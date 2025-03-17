import dotenv from 'dotenv';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

interface CampusProperty {
  id?: number;
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
  bedCount?: number;
  bathCount?: number;
}

/**
 * Main function to scrape on-campus properties
 */
async function scrapeCampusProperties() {
  try {
    console.log('Starting on-campus property scraping...');
    
    // Base URL for the accommodation page
    const baseUrl = 'https://www.lboro.ac.uk';
    const mainUrl = `${baseUrl}/services/accommodation/our-halls/`;
    
    // Fetch the main page
    const mainResponse = await fetch(mainUrl);
    const mainHtml = await mainResponse.text();
    const main$ = cheerio.load(mainHtml);
    
    // Find all hall links
    const hallLinks: { title: string; url: string }[] = [];
    
    main$('.halls-list li').each((_, element) => {
      const title = main$(element).find('h3').text().trim();
      const url = baseUrl + main$(element).find('a').attr('href');
      
      // Skip Stratford One (London campus)
      if (title !== 'Stratford One') {
        hallLinks.push({ title, url });
      }
    });
    
    console.log(`Found ${hallLinks.length} on-campus halls`);
    
    // Process each hall
    const properties: CampusProperty[] = [];
    
    for (let i = 0; i < hallLinks.length; i++) {
      const { title, url } = hallLinks[i];
      console.log(`[${i + 1}/${hallLinks.length}] Processing ${title}`);
      
      try {
        // Fetch the hall page
        const hallResponse = await fetch(url);
        const hallHtml = await hallResponse.text();
        const hall$ = cheerio.load(hallHtml);
        
        // Get the main image URL
        const imageUrl = hall$('.hall-hero-image img').attr('src') || '';
        
        // Get the location
        const location = hall$('.hall-offers li:contains("Loughborough")').text().trim();
        
        // Get the catering type
        const catering = hall$('.hall-offers li:contains("catered")').text().trim();
        
        // Get the bathroom type
        const bathroomType = hall$('.hall-offers li:contains("bathroom")').text().trim();
        
        // Fetch the pricing tab
        const pricingTabUrl = `${url}#tab2`;
        const pricingResponse = await fetch(pricingTabUrl);
        const pricingHtml = await pricingResponse.text();
        const pricing$ = cheerio.load(pricingHtml);
        
        // Extract pricing information
        const pricingText = pricing$('#tab2').text();
        const pricingLines = extractPricingLines(pricingText);
        
        // Calculate price range
        const prices = pricingLines.map(line => {
          const match = line.match(/£(\d+\.\d+) per week/);
          return match ? parseFloat(match[1]) : 0;
        }).filter(price => price > 0);
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        
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
    
    // Save the properties to a JSON file
    savePropertiesToJson(properties);
    
    console.log(`\nScraped ${properties.length} on-campus properties`);
    
  } catch (error) {
    console.error('Error in scrapeCampusProperties:', error);
  }
}

/**
 * Extract pricing lines from the text
 */
function extractPricingLines(text: string): string[] {
  // Look for pricing lines in the format "£X,XXX.XX (£XXX.XX per week) - Description"
  const pricingLines: string[] = [];
  const lines = text.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine.match(/£[\d,]+\.\d+ \(£\d+\.\d+ per week\) -/)) {
      pricingLines.push(trimmedLine);
    }
  }
  
  return pricingLines;
}

/**
 * Save properties to a JSON file
 */
function savePropertiesToJson(properties: CampusProperty[]) {
  const outputDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const outputPath = path.join(outputDir, `campus-properties-${timestamp}.json`);
  
  fs.writeFileSync(outputPath, JSON.stringify(properties, null, 2));
  console.log(`Properties saved to ${outputPath}`);
  
  // Also save a fixed filename version for easy access
  const fixedOutputPath = path.join(outputDir, 'campus-properties.json');
  fs.writeFileSync(fixedOutputPath, JSON.stringify(properties, null, 2));
  console.log(`Properties also saved to ${fixedOutputPath}`);
}

// Run the function if this script is executed directly
if (require.main === module) {
  scrapeCampusProperties()
    .then(() => console.log('Done'))
    .catch(console.error);
}

export { scrapeCampusProperties }; 