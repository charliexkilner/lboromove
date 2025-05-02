import { PrismaClient } from '@prisma/client';
import { BaseScraper } from './BaseScraper';
import fetch from 'cross-fetch';
import * as cheerio from 'cheerio';

interface EcoCareProperty {
  title: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  address: string;
  images: string[];
  url: string;
  description?: string;
  amenities: string[];
  isLetAgreed: boolean;
}

export class EcoCareScraper extends BaseScraper {
  private readonly baseUrl = 'https://ecocarestudent.co.uk';
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
  };

  constructor(prisma: PrismaClient) {
    super(prisma, 'ecocare');
  }

  async scrape(): Promise<void> {
    try {
      await this.clearExistingProperties();
      const properties = await this.fetchProperties();
      await this.saveProperties(properties);
      console.log(
        `Successfully scraped ${properties.length} properties from EcoCare (${properties.filter(p => p.isLetAgreed).length} let agreed)`
      );
    } catch (error) {
      console.error('Failed to scrape EcoCare:', error);
      throw error;
    }
  }

  private extractRoadName(title: string): string {
    // Remove postcode (matches format like "LE11 4QD")
    return title.split(',')[0].trim();
  }

  private async fetchPropertyDetails(url: string): Promise<{ images: string[], description: string }> {
    try {
      const response = await fetch(url, { headers: this.headers });
      if (!response.ok) {
        throw new Error(`Failed to fetch property details: HTTP ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Get all images from the property slider
      const images: string[] = [];
      $('.property-slider .prop-slide img').each((_, img) => {
        const src = $(img).attr('src');
        if (src) {
          images.push(src); // These URLs are already absolute
          console.log(`Found image: ${src}`);
        }
      });

      // Get the full description from the property details section
      let description = '';
      const propertyDetails = $('.property-details p').first();
      if (propertyDetails.length) {
        description = propertyDetails.text().trim();
      } else {
        // Fallback to any paragraph in the details section
        description = $('.details p').first().text().trim();
      }

      return { images, description };
    } catch (error) {
      console.error(`Error fetching property details from ${url}:`, error);
      return { images: [], description: '' };
    }
  }

  private async fetchProperties(): Promise<EcoCareProperty[]> {
    const properties: EcoCareProperty[] = [];
    
    try {
      console.log('Fetching EcoCare properties list...');
      
      const listResponse = await fetch(`${this.baseUrl}/our-houses`, {
        headers: this.headers
      });
      
      if (!listResponse.ok) {
        throw new Error(`Failed to fetch EcoCare properties list: HTTP ${listResponse.status}`);
      }
      
      const listHtml = await listResponse.text();
      const $ = cheerio.load(listHtml);
      
      // Find all property cards
      const propertyCards = $('.grid-item.house');
      console.log(`Found ${propertyCards.length} property cards`);

      for (let i = 0; i < propertyCards.length; i++) {
        const $property = $(propertyCards[i]);
        
        // Check if property is let agreed
        const isLetAgreed = $property.find('.let-triangle').length > 0;
        
        // Get the property URL from the first anchor tag
        const propertyLink = $property.find('a').first();
        const propertyUrl = propertyLink.attr('href');
        
        if (!propertyUrl) {
          console.log('Skipping property - no URL found');
          continue;
        }

        const fullUrl = propertyUrl.startsWith('/') ? this.baseUrl + propertyUrl : propertyUrl;

        // Get the title from h3 and clean it
        const rawTitle = $property.find('.heading h3').text().trim();
        if (!rawTitle) {
          console.log('Skipping property - no title found');
          continue;
        }
        const title = this.extractRoadName(rawTitle);

        // Get price from let-price span
        const priceText = $property.find('.let-price').text().trim();
        const price = this.extractPrice(priceText);

        // Get bedroom count
        let bedCount = 0;
        const bedroomText = $property.find('.attr-desc').first().text().trim();
        if (bedroomText.includes('House Share')) {
          bedCount = 1; // Treat house shares as 1 bed for now
        } else {
          bedCount = parseInt(bedroomText.match(/\d+/)?.[0] || '0');
        }

        // Get bathroom count
        const bathroomText = $property.find('.attr-desc').last().text().trim();
        const bathCount = bathroomText.includes('Shared') ? 1 : parseInt(bathroomText.match(/\d+/)?.[0] || '0');

        // Get amenities from the info list
        const amenities: string[] = [];
        $property.find('.info-list li span').each((_, li) => {
          const amenity = $(li).text().trim();
          if (amenity) amenities.push(amenity);
        });

        console.log(`Fetching details for property ${i + 1}/${propertyCards.length}: ${title}`);
        const details = await this.fetchPropertyDetails(fullUrl);

        properties.push({
          title,
          price,
          bedrooms: bedCount,
          bathrooms: bathCount,
          address: title,
          images: details.images,
          url: fullUrl,
          description: details.description || amenities.join('\n'),
          amenities,
          isLetAgreed
        });

        console.log(`Found ${details.images.length} images for ${title}`);
      }
      
      // Log debug info
      console.log('Debug info:');
      console.log('Property cards found:', propertyCards.length);
      console.log('Properties processed:', properties.length);
      console.log('Let agreed properties:', properties.filter(p => p.isLetAgreed).length);
      
    } catch (error) {
      console.error('Error fetching properties list:', error);
      throw error;
    }
    
    return properties;
  }

  private extractPrice(priceText: string): number {
    // Extract numbers from the price text (e.g. "£125 per week" -> 125)
    const matches = priceText.match(/£?(\d+)/);
    if (!matches || !matches[1]) return 0;
    const price = parseInt(matches[1]);
    return isNaN(price) ? 0 : price;
  }

  private async saveProperties(properties: EcoCareProperty[]): Promise<void> {
    for (const property of properties) {
      try {
        await this.upsertProperty({
          title: property.title,
          price: property.price,
          rooms: property.bedrooms,
          bathrooms: property.bathrooms,
          images: property.images,
          description: property.description || '',
          location: property.address,
          amenities: property.amenities,
          externalId: property.url.split('/').pop() || property.url,
          url: property.url,
        });
        console.log(`Saved property: ${property.title}`);
      } catch (error) {
        console.error(`Failed to save property: ${property.title}`, error);
      }
    }
  }

  private async clearExistingProperties(): Promise<void> {
    await this.prisma.property.deleteMany({
      where: {
        scrapedFrom: this.website,
      },
    });
  }
} 