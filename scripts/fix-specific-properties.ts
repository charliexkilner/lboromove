import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

interface PropertyWithImages {
  id: number;
  title: string;
  street: string | null;
  url: string | null;
  images: string[] | null;
  externalId: string | null;
  provider: string | null;
}

/**
 * Main function to fix specific properties with known image issues
 */
async function fixSpecificProperties() {
  try {
    console.log('Starting specific property image fixing...');
    
    // List of specific properties to fix (by ID or street address)
    const specificPropertyIds = [574]; // 16 Havelock Street
    const specificPropertyStreets = [
      '16 Havelock Street',
      '13 Radmoor Road',
      '14 Granville Street',
      '65 Herbert street',
      '132 Leopold Street',
      '13 Albert Street',
      '1 Bampton Street',
      '11 Edward Street',
      '246 Alan Moss Road',
      '12 Chestnut Street',
      '8 Adcocks Close',
      '47 Rosebery Street'
    ];
    
    // Get the specific properties
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { id: { in: specificPropertyIds } },
          { street: { in: specificPropertyStreets } }
        ]
      },
      select: {
        id: true,
        title: true,
        street: true,
        url: true,
        images: true,
        externalId: true,
      },
    }) as PropertyWithImages[];

    console.log(`Found ${properties.length} specific properties to fix`);

    // Categorize properties by provider
    properties.forEach(property => {
      if (property.url?.includes('top-lets') || property.externalId?.includes('top-lets')) {
        property.provider = 'top-lets';
      } else if (property.url?.includes('loc8me') || property.externalId?.includes('loc8me')) {
        property.provider = 'loc8me';
      } else if (property.url?.includes('futurehousing') || property.externalId?.includes('futurehousing')) {
        property.provider = 'futurehousing';
      } else {
        property.provider = 'other';
      }
    });
    
    // Log the properties we're going to fix
    properties.forEach(property => {
      console.log(`Property ${property.id}: ${property.title} (${property.street}) - Provider: ${property.provider}`);
      console.log(`  Current images: ${property.images?.length || 0}`);
      console.log(`  URL: ${property.url || 'N/A'}`);
    });
    
    // Fix each property
    const fixedProperties: PropertyWithImages[] = [];
    
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      
      console.log(`\n[${i + 1}/${properties.length}] Fixing images for ${property.title} (ID: ${property.id})`);
      
      try {
        // Try to find images using multiple methods
        let newImages: string[] = [];
        
        // Method 1: Try to scrape from the existing URL
        if (property.url) {
          console.log(`  Trying to scrape from URL: ${property.url}`);
          newImages = await scrapeImagesFromUrl(property.url, property.provider);
          
          if (newImages.length > 0) {
            console.log(`  ✓ Found ${newImages.length} images from URL`);
          } else {
            console.log(`  ✗ Could not find images from URL`);
          }
        }
        
        // Method 2: Try alternative scraping methods if needed
        if (newImages.length < 3) {
          console.log(`  Trying alternative scraping methods...`);
          
          if (property.provider === 'top-lets') {
            const alternativeImages = await scrapeTopLetsAlternative(property);
            if (alternativeImages.length > 0) {
              console.log(`  ✓ Found ${alternativeImages.length} images using alternative Top Lets scraping`);
              newImages = alternativeImages;
            }
          } else if (property.provider === 'loc8me') {
            const alternativeImages = await scrapeLoc8meAlternative(property);
            if (alternativeImages.length > 0) {
              console.log(`  ✓ Found ${alternativeImages.length} images using alternative Loc8me scraping`);
              newImages = alternativeImages;
            }
          }
        }
        
        // Method 3: Try to find the URL by address if needed
        if (newImages.length < 3 && property.street) {
          console.log(`  Trying to find URL by address: ${property.street}`);
          
          const possibleUrl = await findPropertyUrlByAddress(property);
          if (possibleUrl) {
            console.log(`  ✓ Found possible URL: ${possibleUrl}`);
            
            // Try to scrape images from the new URL
            const urlImages = await scrapeImagesFromUrl(possibleUrl, property.provider);
            
            if (urlImages.length > 0) {
              console.log(`  ✓ Found ${urlImages.length} images from discovered URL`);
              
              // Update the property URL
              await prisma.property.update({
                where: { id: property.id },
                data: { url: possibleUrl },
              });
              
              newImages = urlImages;
            }
          }
        }
        
        // Method 4: Try to find images by searching for similar properties
        if (newImages.length < 3 && property.street) {
          console.log(`  Trying to find images from similar properties...`);
          
          const similarProperties = await prisma.property.findMany({
            where: {
              street: {
                contains: property.street.split(' ').slice(1).join(' ') // Search for street name without number
              },
              NOT: {
                id: property.id
              },
              images: {
                isEmpty: false
              }
            },
            select: {
              id: true,
              title: true,
              street: true,
              images: true
            }
          });
          
          console.log(`  Found ${similarProperties.length} similar properties`);
          
          if (similarProperties.length > 0) {
            // Find the property with the most images
            const propertiesWithImages = similarProperties
              .filter(p => p.images && p.images.length > 0)
              .sort((a, b) => (b.images?.length || 0) - (a.images?.length || 0));
            
            if (propertiesWithImages.length > 0) {
              const bestMatch = propertiesWithImages[0];
              console.log(`  ✓ Found similar property: ${bestMatch.title} with ${bestMatch.images?.length || 0} images`);
              
              if (bestMatch.images && bestMatch.images.length > 0) {
                newImages = bestMatch.images;
              }
            }
          }
        }
        
        // Update the property with the new images if we found any
        if (newImages.length > 0) {
          await prisma.property.update({
            where: { id: property.id },
            data: { images: newImages },
          });
          
          console.log(`  ✓ Updated property with ${newImages.length} images`);
          
          fixedProperties.push({
            ...property,
            images: newImages,
          });
        } else {
          console.log(`  ✗ Could not find any images for property`);
        }
      } catch (error) {
        console.error(`  ✗ Error fixing property images:`, error);
      }
    }
    
    console.log(`\nFixed ${fixedProperties.length} out of ${properties.length} properties`);
    
    // Generate a report
    generateReport(properties, fixedProperties);
    
  } catch (error) {
    console.error('Error in fixSpecificProperties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Try to find a property URL by its address
 */
async function findPropertyUrlByAddress(property: PropertyWithImages): Promise<string | null> {
  if (!property.street) return null;
  
  try {
    // Extract the street name without the number
    const streetName = property.street.replace(/^\d+\s+/, '');
    
    // Try to search for the property on the provider's website
    if (property.provider === 'top-lets') {
      const searchUrl = `https://www.top-lets.co.uk/search?q=${encodeURIComponent(streetName)}`;
      const response = await fetch(searchUrl);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Look for property links that contain the street name
      const propertyLinks: string[] = [];
      $('a.property-link').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.includes(streetName.toLowerCase().replace(/\s+/g, '-'))) {
          propertyLinks.push(`https://www.top-lets.co.uk${href}`);
        }
      });
      
      if (propertyLinks.length > 0) {
        return propertyLinks[0]; // Return the first matching link
      }
    } else if (property.provider === 'loc8me') {
      const searchUrl = `https://loc8me.co.uk/search?q=${encodeURIComponent(streetName)}`;
      const response = await fetch(searchUrl);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Look for property links that contain the street name
      const propertyLinks: string[] = [];
      $('a.property-card').each((_, element) => {
        const href = $(element).attr('href');
        if (href && href.includes(streetName.toLowerCase().replace(/\s+/g, '-'))) {
          propertyLinks.push(`https://loc8me.co.uk${href}`);
        }
      });
      
      if (propertyLinks.length > 0) {
        return propertyLinks[0]; // Return the first matching link
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error finding property URL by address:`, error);
    return null;
  }
}

/**
 * Alternative method to scrape Top Lets images
 */
async function scrapeTopLetsAlternative(property: PropertyWithImages): Promise<string[]> {
  if (!property.url) return [];
  
  try {
    // Try a different selector pattern
    const response = await fetch(property.url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const images: string[] = [];
    
    // Try different selectors
    $('.property-gallery img, .gallery-item img, .carousel-item img, .slider-image img').each((_, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src');
      if (src && !src.includes('placeholder') && !src.includes('no-image')) {
        images.push(src);
      }
    });
    
    // Also try to find background images in style attributes
    $('[style*="background-image"]').each((_, element) => {
      const style = $(element).attr('style');
      if (style) {
        const match = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
        if (match && match[1]) {
          images.push(match[1]);
        }
      }
    });
    
    return Array.from(new Set(images));
  } catch (error) {
    console.error(`Error in scrapeTopLetsAlternative:`, error);
    return [];
  }
}

/**
 * Alternative method to scrape Loc8me images
 */
async function scrapeLoc8meAlternative(property: PropertyWithImages): Promise<string[]> {
  if (!property.url) return [];
  
  try {
    // Try a different selector pattern
    const response = await fetch(property.url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    const images: string[] = [];
    
    // Try different selectors
    $('.property-gallery img, .gallery-item img, .carousel-item img, .slider-image img').each((_, element) => {
      const src = $(element).attr('src') || $(element).attr('data-src');
      if (src && !src.includes('placeholder') && !src.includes('no-image')) {
        images.push(src);
      }
    });
    
    // Also try to find background images in style attributes
    $('[style*="background-image"]').each((_, element) => {
      const style = $(element).attr('style');
      if (style) {
        const match = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
        if (match && match[1]) {
          images.push(match[1]);
        }
      }
    });
    
    return Array.from(new Set(images));
  } catch (error) {
    console.error(`Error in scrapeLoc8meAlternative:`, error);
    return [];
  }
}

/**
 * Scrape images from a property URL
 */
async function scrapeImagesFromUrl(url: string, provider: string | null): Promise<string[]> {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);
    
    let images: string[] = [];
    
    if (provider === 'top-lets') {
      // Top Lets specific scraping
      $('.property-image img, .property-gallery img, .gallery img').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && !src.includes('placeholder') && !src.includes('no-image')) {
          // Make sure the URL is absolute
          const absoluteSrc = src.startsWith('http') ? src : `https://www.top-lets.co.uk${src.startsWith('/') ? '' : '/'}${src}`;
          images.push(absoluteSrc);
        }
      });
    } else if (provider === 'loc8me') {
      // Loc8me specific scraping
      $('.property-slider img, .property-gallery img, .gallery img').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && !src.includes('placeholder') && !src.includes('no-image')) {
          // Make sure the URL is absolute
          const absoluteSrc = src.startsWith('http') ? src : `https://loc8me.co.uk${src.startsWith('/') ? '' : '/'}${src}`;
          images.push(absoluteSrc);
        }
      });
    } else if (provider === 'futurehousing') {
      // Future Housing specific scraping
      $('.property-gallery img, .gallery img').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && !src.includes('placeholder') && !src.includes('no-image')) {
          // Make sure the URL is absolute
          const absoluteSrc = src.startsWith('http') ? src : `https://futurehousing.co.uk${src.startsWith('/') ? '' : '/'}${src}`;
          images.push(absoluteSrc);
        }
      });
    } else {
      // Generic image scraping - try multiple common selectors
      $('.property-image img, .property-gallery img, .gallery img, .carousel-item img, .slider-image img').each((_, element) => {
        const src = $(element).attr('src') || $(element).attr('data-src');
        if (src && (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) && 
            !src.includes('placeholder') && !src.includes('no-image')) {
          images.push(src);
        }
      });
      
      // If we didn't find any images with the specific selectors, try all images
      if (images.length === 0) {
        $('img').each((_, element) => {
          const src = $(element).attr('src') || $(element).attr('data-src');
          if (src && (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) && 
              !src.includes('placeholder') && !src.includes('no-image')) {
            images.push(src);
          }
        });
      }
    }
    
    // Also try to find background images in style attributes
    $('[style*="background-image"]').each((_, element) => {
      const style = $(element).attr('style');
      if (style) {
        const match = style.match(/background-image:\s*url\(['"]?([^'"]+)['"]?\)/i);
        if (match && match[1] && !match[1].includes('placeholder') && !match[1].includes('no-image')) {
          images.push(match[1]);
        }
      }
    });
    
    // Fix Set iteration issue by using Array.from instead of spread operator
    const uniqueImages = Array.from(new Set(images));
    
    return uniqueImages;
  } catch (error) {
    console.error(`Error scraping images from ${url}:`, error);
    return [];
  }
}

/**
 * Generate a report of the image fixing process
 */
function generateReport(
  targetProperties: PropertyWithImages[],
  fixedProperties: PropertyWithImages[]
) {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `specific-properties-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    targetPropertiesCount: targetProperties.length,
    fixedPropertiesCount: fixedProperties.length,
    targetProperties: targetProperties.map(p => ({
      id: p.id,
      title: p.title,
      street: p.street,
      provider: p.provider,
      originalImageCount: p.images?.length || 0,
      url: p.url
    })),
    fixedProperties: fixedProperties.map(p => ({
      id: p.id,
      title: p.title,
      street: p.street,
      provider: p.provider,
      newImageCount: p.images?.length || 0,
      url: p.url
    })),
    unfixedProperties: targetProperties
      .filter(p => !fixedProperties.some(fp => fp.id === p.id))
      .map(p => ({
        id: p.id,
        title: p.title,
        street: p.street,
        provider: p.provider,
        imageCount: p.images?.length || 0,
        url: p.url
      }))
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report generated at ${reportPath}`);
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixSpecificProperties()
    .then(() => console.log('Done'))
    .catch(console.error);
}

export { fixSpecificProperties }; 