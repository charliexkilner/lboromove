import type { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import * as fs from 'fs';
import * as path from 'path';
import { BaseScraper } from './BaseScraper';

interface CampusProperty {
  title: string;
  url: string;
  imageUrl: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  pricingOptions: string[];
  location: string;
  catering: string;
  bathroomType: string;
}

export class CampusScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.lboro.ac.uk';
  private readonly hallsUrl = 'https://www.lboro.ac.uk/services/accommodation/our-halls/';
  private outputDir: string;

  constructor(prisma: PrismaClient) {
    super(prisma, 'lboro-university');
    this.outputDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir);
    }
  }

  async scrape(): Promise<void> {
    try {
      console.log('Starting on-campus property scraping...');
      
      // Fetch all hall links from the main page
      const hallLinks = await this.fetchHallLinks();
      console.log(`Found ${hallLinks.length} on-campus halls`);
      
      // Process each hall to extract property details
      const properties = await this.fetchPropertyDetails(hallLinks);
      
      // Save properties to JSON file
      this.savePropertiesToJson(properties);
      
      // Save properties to database
      await this.saveProperties(properties);
      
      console.log(`Successfully scraped ${properties.length} properties from Loughborough University`);
    } catch (error) {
      console.error('Failed to scrape campus properties:', error);
      throw error;
    }
  }

  private async fetchHallLinks(): Promise<{ title: string; url: string }[]> {
    const hallLinks: { title: string; url: string }[] = [];
    
    try {
      // Fetch the main page
      const mainResponse = await fetch(this.hallsUrl);
      const mainHtml = await mainResponse.text();
      const main$ = cheerio.load(mainHtml);
      
      // Find all hall links - they are in list items with "View hall" links
      main$('ul li').each((_, element) => {
        const viewHallLink = main$(element).find('a:contains("View hall")');
        if (viewHallLink.length > 0) {
          const url = this.baseUrl + viewHallLink.attr('href');
          // Get the hall title from the list item text (it's the first text node)
          const title = main$(element).contents().filter(function(this: cheerio.Element) {
            return this.type === 'text';
          }).first().text().trim();
          
          // Skip Stratford One (London campus)
          if (title && title !== 'Stratford One') {
            hallLinks.push({ title, url });
          }
        }
      });
    } catch (error) {
      console.error('Error fetching hall links:', error);
    }
    
    return hallLinks;
  }

  private async fetchPropertyDetails(hallLinks: { title: string; url: string }[]): Promise<CampusProperty[]> {
    const properties: CampusProperty[] = [];
    
    for (let i = 0; i < hallLinks.length; i++) {
      const { title, url } = hallLinks[i];
      console.log(`[${i + 1}/${hallLinks.length}] Processing ${title}`);
      
      try {
        // Fetch the hall page
        const hallResponse = await fetch(url);
        const hallHtml = await hallResponse.text();
        const hall$ = cheerio.load(hallHtml);
        
        // Get the main image URL - it's in the hero image section
        const imageUrl = hall$('.hall-hero-image img, .hero-image img').attr('src') || '';
        
        // Get the location - it's in the hall offers section with a map icon
        const location = hall$('.hall-offers li:contains("Loughborough"), .location-info').text().trim();
        
        // Get the catering type - look for "Self-catered" or "Catered" text
        let catering = 'Not specified';
        if (hall$('.hall-offers:contains("Self-catered"), .catering-info:contains("Self-catered")').length > 0) {
          catering = 'Self-catered';
        } else if (hall$('.hall-offers:contains("Catered"), .catering-info:contains("Catered")').length > 0) {
          catering = 'Catered';
        }
        
        // Get the bathroom type - look for "en-suite" or "shared bathroom" text
        let bathroomType = 'Not specified';
        if (hall$('.hall-offers:contains("en-suite"), .bathroom-info:contains("en-suite")').length > 0) {
          bathroomType = 'En-suite';
        } else if (hall$('.hall-offers:contains("Shared"), .bathroom-info:contains("Shared")').length > 0) {
          bathroomType = 'Shared bathroom';
        }
        
        // Find the pricing information - it's in the "Occupancy and costs" tab
        // First try to find the tab content directly
        let pricingText = hall$('#tab2, .occupancy-costs').text();
        
        // If not found, try to find the pricing from the main page
        if (!pricingText) {
          const priceElement = hall$('.price, .price-info');
          if (priceElement.length > 0) {
            pricingText = priceElement.text();
          }
        }
        
        // Extract pricing lines from the text
        const pricingLines = this.extractPricingLines(pricingText);
        
        // Calculate price range from the pricing lines
        const prices = pricingLines.map(line => {
          // Extract price per week from the line
          const match = line.match(/£(\d+\.\d+) per week/);
          return match ? parseFloat(match[1]) : 0;
        }).filter(price => price > 0);
        
        let minPrice = 0;
        let maxPrice = 0;
        
        if (prices.length > 0) {
          minPrice = Math.min(...prices);
          maxPrice = Math.max(...prices);
        } else {
          // If no pricing lines found, try to extract from the price info on the main page
          const priceMatch = pricingText.match(/From £(\d+\.\d+) per week/);
          if (priceMatch) {
            minPrice = parseFloat(priceMatch[1]);
            maxPrice = minPrice;
          }
        }
        
        // Format price range
        let priceRange = '';
        if (minPrice === maxPrice) {
          priceRange = `£${minPrice.toFixed(2)} per week`;
        } else {
          priceRange = `£${minPrice.toFixed(2)}-${maxPrice.toFixed(2)} per week`;
        }
        
        // Create property object
        const property: CampusProperty = {
          title,
          url,
          imageUrl,
          priceRange,
          minPrice,
          maxPrice,
          pricingOptions: pricingLines,
          location,
          catering,
          bathroomType
        };
        
        properties.push(property);
        console.log(`  ✓ Extracted pricing: ${priceRange}`);
        console.log(`  ✓ Found ${pricingLines.length} pricing options`);
        
      } catch (error) {
        console.error(`  ✗ Error processing ${title}:`, error);
      }
      
      // Add a delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return properties;
  }

  private extractPricingLines(text: string): string[] {
    // Look for pricing lines in various formats
    const pricingLines: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      // Match lines with pricing information in different formats
      if (
        trimmedLine.match(/£[\d,]+\.\d+ \(£\d+\.\d+ per week\)/) || 
        trimmedLine.match(/£\d+\.\d+ per week/) ||
        trimmedLine.match(/From £\d+\.\d+ per week/)
      ) {
        pricingLines.push(trimmedLine);
      }
    }
    
    return pricingLines;
  }

  private savePropertiesToJson(properties: CampusProperty[]) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const outputPath = path.join(this.outputDir, `campus-properties-${timestamp}.json`);
    
    fs.writeFileSync(outputPath, JSON.stringify(properties, null, 2));
    console.log(`Properties saved to ${outputPath}`);
    
    // Also save a fixed filename version for easy access
    const fixedOutputPath = path.join(this.outputDir, 'campus-properties.json');
    fs.writeFileSync(fixedOutputPath, JSON.stringify(properties, null, 2));
    console.log(`Properties also saved to ${fixedOutputPath}`);
  }

  private async saveProperties(properties: CampusProperty[]): Promise<void> {
    console.log(`Saving ${properties.length} campus properties to database...`);
    
    // Clear existing campus properties
    await this.clearExistingProperties();
    
    // Save each property
    let savedCount = 0;
    
    for (const property of properties) {
      try {
        // Skip properties with missing required data
        if (!property.title || !property.minPrice) {
          console.log(`Skipping property with missing data: ${property.title || 'Unknown'}`);
          continue;
        }
        
        // Format price range with rounded values
        const minPrice = Math.floor(property.minPrice);
        const maxPrice = Math.ceil(property.maxPrice || minPrice);
        
        // Create keyFeatures object with campus property data
        const keyFeatures = {
          isCampusProperty: true,
          priceRange: property.priceRange,
          pricingOptions: property.pricingOptions || [],
          catering: property.catering || 'Not specified',
          bathroomType: property.bathroomType || 'Not specified',
          maxPrice: maxPrice
        };
        
        // Create a unique hash for the property
        const hash = `campus-${property.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        
        // Create new property
        await this.prisma.property.create({
          data: {
            title: property.title,
            url: property.url || '',
            images: property.imageUrl ? [property.imageUrl] : [],
            price: minPrice,
            location: `Loughborough University Campus - ${property.location || ''}`,
            rooms: 1, // Default to 1 room for campus properties
            bathrooms: 1, // Default to 1 bathroom for campus properties
            amenities: [`On Campus`, `University Accommodation`, property.catering || 'Not specified', property.bathroomType || 'Not specified'],
            scrapedFrom: 'lboro-university',
            externalId: `campus-${Date.now()}`,
            hash: hash,
            description: `${property.title} - ${property.catering || 'Not specified'} - ${property.bathroomType || 'Not specified'}`,
            isNearCampus: true,
            distanceToCampus: 0,
            source: 'lboro-university',
            keyFeatures: keyFeatures,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        
        savedCount++;
        console.log(`Saved campus property: ${property.title}`);
      } catch (error) {
        console.error(`Error saving property ${property.title}:`, error);
      }
    }
    
    console.log(`Successfully saved ${savedCount} campus properties to database`);
  }

  private async clearExistingProperties(): Promise<void> {
    try {
      const deleted = await this.prisma.property.deleteMany({
        where: {
          keyFeatures: {
            path: ['isCampusProperty'],
            equals: true
          }
        },
      });
      console.log(`Cleared ${deleted.count} existing campus properties`);
    } catch (error) {
      console.error('Error clearing existing campus properties:', error);
    }
  }
} 