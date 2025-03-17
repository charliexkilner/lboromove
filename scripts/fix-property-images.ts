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
 * Main function to validate and fix property images
 */
async function fixPropertyImages() {
  try {
    console.log('Starting property image validation and fixing...');
    
    // Get all properties with their images
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        street: true,
        url: true,
        images: true,
        externalId: true,
      },
    }) as PropertyWithImages[];

    console.log(`Found ${properties.length} properties to check`);

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
    
    // Find properties with image issues
    const propertiesWithImageIssues = findPropertiesWithImageIssues(properties);
    
    console.log(`Found ${propertiesWithImageIssues.length} properties with image issues`);
    
    // Fix properties with image issues
    const fixedProperties = await fixPropertiesWithImageIssues(propertiesWithImageIssues);
    
    console.log(`Fixed ${fixedProperties.length} properties with image issues`);
    
    // Generate a report
    generateReport(propertiesWithImageIssues, fixedProperties);
    
  } catch (error) {
    console.error('Error in fixPropertyImages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Find properties with image issues (missing, mismatched, or too few images)
 */
function findPropertiesWithImageIssues(properties: PropertyWithImages[]): PropertyWithImages[] {
  const propertiesWithImageIssues: PropertyWithImages[] = [];
  
  for (const property of properties) {
    // Case 1: No images at all
    if (!property.images || !Array.isArray(property.images) || property.images.length === 0) {
      console.log(`Property ${property.id} (${property.title}) has no images`);
      propertiesWithImageIssues.push(property);
      continue;
    }
    
    // Case 2: Too few images (less than 3)
    if (property.images.length < 3) {
      console.log(`Property ${property.id} (${property.title}) has only ${property.images.length} images`);
      propertiesWithImageIssues.push(property);
      continue;
    }
    
    // Case 3: Check for mismatched images if we have street information
    if (property.street) {
      // Extract house number and street name if possible
      const match = property.street.match(/^(\d+)\s+(.+)$/);
      if (match) {
        const houseNumber = match[1];
        const streetName = match[2].toLowerCase();
        
        // Check if images match the property address
        const mismatchedImages = property.images.filter(image => {
          const imagePath = image.toLowerCase();
          
          // Check if image URL contains the house number or street name
          const containsHouseNumber = imagePath.includes(houseNumber);
          const containsStreetName = streetName.split(' ').some(word => {
            // Only check words with length > 3 to avoid common words
            return word.length > 3 && imagePath.includes(word);
          });
          
          // If the image doesn't contain either the house number or street name, it might be mismatched
          return !containsHouseNumber && !containsStreetName;
        });
        
        // If more than 70% of images are potentially mismatched, flag the property
        if (mismatchedImages.length > property.images.length * 0.7) {
          console.log(`Property ${property.id} (${property.title}) has ${mismatchedImages.length}/${property.images.length} potentially mismatched images`);
          propertiesWithImageIssues.push(property);
        }
      }
    }
    
    // Case 4: Check for broken image URLs
    const brokenImages = property.images.filter(image => 
      !image.startsWith('http') || 
      image.includes('placeholder') || 
      image.includes('no-image')
    );
    
    if (brokenImages.length > 0) {
      console.log(`Property ${property.id} (${property.title}) has ${brokenImages.length} potentially broken image URLs`);
      propertiesWithImageIssues.push(property);
    }
  }
  
  return propertiesWithImageIssues;
}

/**
 * Fix properties with image issues
 */
async function fixPropertiesWithImageIssues(properties: PropertyWithImages[]): Promise<PropertyWithImages[]> {
  const fixedProperties: PropertyWithImages[] = [];
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    
    console.log(`[${i + 1}/${properties.length}] Fixing images for ${property.title} (ID: ${property.id})`);
    
    try {
      // Re-scrape images from the property URL
      if (property.url) {
        const newImages = await scrapeImagesFromUrl(property.url, property.provider);
        
        if (newImages.length > 0) {
          // Update the property with the new images
          await prisma.property.update({
            where: { id: property.id },
            data: { images: newImages },
          });
          
          console.log(`  ✓ Updated property with ${newImages.length} new images`);
          
          // Add to fixed properties
          fixedProperties.push({
            ...property,
            images: newImages,
          });
        } else {
          console.log(`  ✗ Could not find new images for property`);
          
          // Try alternative scraping methods based on provider
          if (property.provider === 'top-lets') {
            const alternativeImages = await scrapeTopLetsAlternative(property);
            if (alternativeImages.length > 0) {
              await prisma.property.update({
                where: { id: property.id },
                data: { images: alternativeImages },
              });
              
              console.log(`  ✓ Updated property with ${alternativeImages.length} alternative images`);
              
              fixedProperties.push({
                ...property,
                images: alternativeImages,
              });
            }
          } else if (property.provider === 'loc8me') {
            const alternativeImages = await scrapeLoc8meAlternative(property);
            if (alternativeImages.length > 0) {
              await prisma.property.update({
                where: { id: property.id },
                data: { images: alternativeImages },
              });
              
              console.log(`  ✓ Updated property with ${alternativeImages.length} alternative images`);
              
              fixedProperties.push({
                ...property,
                images: alternativeImages,
              });
            }
          }
        }
      } else {
        console.log(`  ✗ Property has no URL to scrape images from`);
        
        // Try to find the URL based on the property title and street
        if (property.street) {
          const possibleUrl = await findPropertyUrlByAddress(property);
          if (possibleUrl) {
            console.log(`  ✓ Found possible URL: ${possibleUrl}`);
            
            // Update the property URL
            await prisma.property.update({
              where: { id: property.id },
              data: { url: possibleUrl },
            });
            
            // Try to scrape images from the new URL
            const newImages = await scrapeImagesFromUrl(possibleUrl, property.provider);
            
            if (newImages.length > 0) {
              await prisma.property.update({
                where: { id: property.id },
                data: { images: newImages },
              });
              
              console.log(`  ✓ Updated property with ${newImages.length} new images from discovered URL`);
              
              fixedProperties.push({
                ...property,
                url: possibleUrl,
                images: newImages,
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`  ✗ Error fixing property images:`, error);
    }
    
    // Add a delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  return fixedProperties;
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
 * Generate a report of the image validation and fixing process
 */
function generateReport(
  propertiesWithImageIssues: PropertyWithImages[],
  fixedProperties: PropertyWithImages[]
) {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `property-images-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    propertiesWithImageIssuesCount: propertiesWithImageIssues.length,
    fixedPropertiesCount: fixedProperties.length,
    propertiesWithImageIssues: propertiesWithImageIssues.map(p => ({
      id: p.id,
      title: p.title,
      street: p.street,
      provider: p.provider,
      imageCount: p.images?.length || 0,
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
    unfixedProperties: propertiesWithImageIssues
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
  fixPropertyImages()
    .then(() => console.log('Done'))
    .catch(console.error);
}

export { fixPropertyImages }; 