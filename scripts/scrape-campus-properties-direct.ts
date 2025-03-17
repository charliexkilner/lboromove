const cheerio = require('cheerio');
const fetchApi = require('node-fetch');
const fs = require('fs');
const path = require('path');

interface CampusProperty {
  title: string;
  url: string;
  imageUrl: string;
  images: string[];  // Array for multiple images
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  pricingOptions: string[];
  location: string;
  catering: string;
  bathroomType: string;
}

// List of hall URLs provided by the user
const hallUrls: string[] = [
  'https://www.lboro.ac.uk/services/accommodation/our-halls/butler-court/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/cayley/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/claudia-parsons/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/david-collett/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/elvyn-richards/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/falkner-eggington/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/faraday/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/harry-french/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/hazlerigg-rutland/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/john-phillips/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/robert-bakewell/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/royce/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/rutherford/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/telford/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/the-holt/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/towers/',
  'https://www.lboro.ac.uk/services/accommodation/our-halls/william-morris/'
];

/**
 * Fetch with retry functionality to handle timeouts
 */
async function fetchWithRetry(url: string, maxRetries = 3, timeout = 60000): Promise<string> {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      // Use timeout option with increased time
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetchApi(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.text();
    } catch (error: any) {
      retries++;
      console.log(`Attempt ${retries}/${maxRetries} failed for ${url}: ${error.message || 'Unknown error'}`);
      
      if (retries >= maxRetries) {
        console.log(`Moving on after ${maxRetries} failed attempts for ${url}`);
        return ''; // Return empty string instead of throwing error to continue with other properties
      }
      
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
    }
  }
  
  return ''; // This line shouldn't be reached but is needed to satisfy TypeScript
}

/**
 * Make URL absolute if it's relative
 */
function makeUrlAbsolute(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  
  return new URL(url, baseUrl).toString();
}

/**
 * Main function to scrape on-campus properties
 */
async function scrapeCampusProperties(): Promise<void> {
  try {
    console.log('Starting on-campus property scraping...');
    
    const properties: CampusProperty[] = [];
    
    for (let i = 0; i < hallUrls.length; i++) {
      const url = hallUrls[i];
      // Extract hall name from URL
      const urlParts = url.split('/');
      const hallSlug = urlParts[urlParts.length - 2];
      const hallName = hallSlug
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
      
      console.log(`[${i + 1}/${hallUrls.length}] Processing ${hallName}`);
      
      try {
        // Fetch the hall page with retry functionality
        const html = await fetchWithRetry(url);
        
        if (!html) {
          console.log(`  ✗ Failed to fetch HTML for ${hallName}, skipping`);
          continue;
        }
        
        const $ = cheerio.load(html);
        
        // Get the title from the page
        const pageTitle = $('h1').first().text().trim() || hallName;
        
        // Initialize arrays for images
        let images: string[] = [];
        
        console.log(`  - Looking for images for ${hallName}`);
        
        // 1. Specifically target image-link class but exclude iframe-link class
        $('.media-link__link.image-link').each((_: any, el: any) => {
          // Skip if it also has the iframe-link class
          if ($(el).hasClass('iframe-link')) {
            console.log('    - Skipping iframe link');
            return;
          }
          
          const href = $(el).attr('href');
          if (href && !images.includes(href)) {
            console.log(`    - Found image link: ${href.substring(0, 50)}...`);
            images.push(href);
          }
        });
        
        console.log(`  - Found ${images.length} image links with class 'media-link__link image-link'`);
        
        // 2. Look for images in the hall-carousel section
        $('.hall-carousel .slick-slide img').each((_: any, el: any) => {
          const src = $(el).attr('src') || $(el).attr('data-src');
          if (src && !src.includes('data:image/gif;base64') && !images.includes(src)) {
            console.log(`    - Found carousel image: ${src.substring(0, 50)}...`);
            images.push(src);
          }
        });
        
        console.log(`  - Found ${images.length} total images after checking carousel`);
        
        // 3. Look for any bg images in the hall-carousel
        $('.hall-carousel .slick-slide').each((_: any, el: any) => {
          const style = $(el).attr('style');
          if (style && style.includes('background-image')) {
            const bgMatch = style.match(/background-image:url\(['"]?([^'"]+)['"]?\)/i);
            if (bgMatch && bgMatch[1] && !images.includes(bgMatch[1])) {
              console.log(`    - Found background image: ${bgMatch[1].substring(0, 50)}...`);
              images.push(bgMatch[1]);
            }
          }
        });
        
        console.log(`  - Found ${images.length} total images after checking background images`);
        
        // 4. If still no images, try to get src from all img tags
        if (images.length === 0) {
          $('img').each((_: any, el: any) => {
            const src = $(el).attr('src') || $(el).attr('data-src');
            if (src && !src.includes('data:image/gif;base64') && !images.includes(src)) {
              images.push(src);
            }
          });
          
          console.log(`  - Found ${images.length} images from all img tags as fallback`);
        }
        
        // 5. Try hero image as a fallback
        if (images.length === 0) {
          const heroImage = $('.key-info__img').attr('src');
          if (heroImage && !heroImage.includes('data:image/gif;base64')) {
            images.push(heroImage);
          }
        }
        
        // Ensure all URLs are absolute
        images = images.map(img => makeUrlAbsolute(img, url));
        
        // Deduplicate images
        images = Array.from(new Set(images)).filter(Boolean);
        
        // If no images found, use default images
        if (images.length === 0) {
          // Add default images based on the hall name
          const baseUrl = `https://www.lboro.ac.uk/media/wwwlboroacuk/external/content/services/accommodation/ourhalls/${hallSlug}`;
          images = [
            `${baseUrl}/${hallSlug}-1.jpg`,
            `${baseUrl}/${hallSlug}-2.jpg`
          ];
          console.log(`  ⚠ Using default image URLs for ${hallName}`);
        }
        
        // Set the main image URL to the first image
        const imageUrl = images[0] || '';
        
        // Get the location
        let location = 'Loughborough Campus';
        $('.key-info__list-item-text').each((_: any, el: any) => {
          const text = $(el).text().trim();
          if (text.includes('Loughborough')) {
            location = text;
          }
        });
        
        // Get the catering type
        let catering = 'Not specified';
        $('.key-info__list-item--catering .key-info__list-item-text').each((_: any, el: any) => {
          catering = $(el).text().trim();
        });
        
        // Get the bathroom type
        let bathroomType = 'Not specified';
        $('.key-info__list-item--facilities .key-info__list-item-text').each((_: any, el: any) => {
          const text = $(el).text().trim();
          bathroomType = text;
        });
        
        // Find the pricing information from the key info section
        let priceRange = 'Not specified';
        let minPrice = 0;
        let maxPrice = 0;
        let pricingOptions: string[] = [];
        
        // Get price from key info section
        $('.key-info__list-item--cost .key-info__list-item-text').each((_: any, el: any) => {
          priceRange = $(el).text().trim();
          
          // Extract min and max prices
          const priceMatch = priceRange.match(/£(\d+\.\d+)/g);
          if (priceMatch && priceMatch.length >= 1) {
            const prices = priceMatch.map(p => parseFloat(p.replace('£', '')));
            minPrice = Math.min(...prices);
            maxPrice = Math.max(...prices);
            
            if (minPrice === maxPrice) {
              priceRange = `£${minPrice.toFixed(2)} per week`;
            } else {
              priceRange = `£${minPrice.toFixed(2)}-${maxPrice.toFixed(2)} per week`;
            }
          }
        });
        
        // Try to get more detailed pricing from tabs
        $('#tab2, .occupancy-costs').each((_: any, el: any) => {
          const text = $(el).text().trim();
          const lines = text.split('\n').map((line: string) => line.trim()).filter(Boolean);
          
          for (const line of lines) {
            if (line.includes('£') && line.includes('per week')) {
              pricingOptions.push(line);
            }
          }
        });
        
        // Create property object
        const property: CampusProperty = {
          title: pageTitle,
          url,
          imageUrl,
          images,
          priceRange,
          minPrice,
          maxPrice,
          pricingOptions,
          location,
          catering,
          bathroomType
        };
        
        properties.push(property);
        console.log(`  ✓ Extracted pricing: ${priceRange}`);
        console.log(`  ✓ Found ${pricingOptions.length} pricing options`);
        console.log(`  ✓ Found ${images.length} images`);
        
      } catch (error) {
        console.error(`  ✗ Error processing ${hallName}:`, error);
      }
      
      // Add a delay to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Save the properties to a JSON file
    savePropertiesToJson(properties);
    
    console.log(`\nScraped ${properties.length} on-campus properties`);
    
  } catch (error) {
    console.error('Error in scrapeCampusProperties:', error);
  }
}

/**
 * Save properties to a JSON file
 */
function savePropertiesToJson(properties: CampusProperty[]): void {
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
scrapeCampusProperties()
  .then(() => console.log('Done'))
  .catch(console.error);

module.exports = { scrapeCampusProperties }; 