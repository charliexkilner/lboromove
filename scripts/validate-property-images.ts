import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

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
async function validatePropertyImages() {
  try {
    console.log('Starting property image validation...');
    
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
    });

    console.log(`Found ${properties.length} properties to check`);

    // Categorize properties by provider
    const propertiesByProvider = categorizePropertiesByProvider(properties);
    
    // Find properties with duplicate images
    const { duplicateImageMap, propertiesWithDuplicates } = findDuplicateImages(properties);
    
    console.log(`Found ${Object.keys(duplicateImageMap).length} duplicate images`);
    console.log(`${propertiesWithDuplicates.length} properties have duplicate images`);
    
    // Find properties with mismatched images (where image URL doesn't match property address)
    const propertiesWithMismatchedImages = findMismatchedImages(properties);
    
    console.log(`${propertiesWithMismatchedImages.length} properties have potentially mismatched images`);
    
    // Combine properties that need fixing
    const propertiesToFix = [...new Set([
      ...propertiesWithDuplicates.map(p => p.id),
      ...propertiesWithMismatchedImages.map(p => p.id)
    ])];
    
    console.log(`Total properties to fix: ${propertiesToFix.length}`);
    
    // Fix properties by provider
    await fixPropertiesByProvider(propertiesByProvider, propertiesToFix);
    
    console.log('Image validation and fixing complete!');
    
    // Generate a report
    generateReport(propertiesWithDuplicates, propertiesWithMismatchedImages);
    
  } catch (error) {
    console.error('Error in validatePropertyImages:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Categorize properties by their provider (Top Lets, Loc8me, etc.)
 */
function categorizePropertiesByProvider(properties: PropertyWithImages[]) {
  const propertiesByProvider: Record<string, PropertyWithImages[]> = {
    'top-lets': [],
    'loc8me': [],
    'other': []
  };
  
  for (const property of properties) {
    if (property.url?.includes('top-lets') || property.externalId?.includes('top-lets')) {
      property.provider = 'top-lets';
      propertiesByProvider['top-lets'].push(property);
    } else if (property.url?.includes('loc8me') || property.externalId?.includes('loc8me')) {
      property.provider = 'loc8me';
      propertiesByProvider['loc8me'].push(property);
    } else {
      property.provider = 'other';
      propertiesByProvider['other'].push(property);
    }
  }
  
  return propertiesByProvider;
}

/**
 * Find properties with duplicate images
 */
function findDuplicateImages(properties: PropertyWithImages[]) {
  // Create a map to track image URLs and the properties they belong to
  const imageMap: Record<string, number[]> = {};
  const duplicateImageMap: Record<string, number[]> = {};
  
  // Identify duplicate images
  for (const property of properties) {
    if (!property.images || !Array.isArray(property.images)) continue;
    
    for (const image of property.images) {
      if (!imageMap[image]) {
        imageMap[image] = [property.id];
      } else {
        imageMap[image].push(property.id);
        duplicateImageMap[image] = imageMap[image];
      }
    }
  }
  
  // Find properties where all images are duplicates
  const propertiesWithDuplicates = properties.filter(property => {
    if (!property.images || !Array.isArray(property.images) || property.images.length === 0) {
      return false;
    }
    
    // Check if all images are duplicates
    return property.images.every(image => 
      duplicateImageMap[image] && duplicateImageMap[image].length > 1
    );
  });
  
  return { duplicateImageMap, propertiesWithDuplicates };
}

/**
 * Find properties with mismatched images (where image URL doesn't match property address)
 */
function findMismatchedImages(properties: PropertyWithImages[]) {
  return properties.filter(property => {
    if (!property.images || !Array.isArray(property.images) || property.images.length === 0 || !property.street) {
      return false;
    }
    
    // Extract street name without number
    const streetName = property.street.replace(/^\d+\s+/, '').toLowerCase();
    
    // Check if any image URL contains the street name
    const hasMatchingImage = property.images.some(image => {
      const imagePath = image.toLowerCase();
      return streetName.split(' ').some(word => 
        word.length > 3 && imagePath.includes(word)
      );
    });
    
    // If no images match the street name, it might be mismatched
    return !hasMatchingImage;
  });
}

/**
 * Fix properties by re-scraping images from their source websites
 */
async function fixPropertiesByProvider(
  propertiesByProvider: Record<string, PropertyWithImages[]>,
  propertiesToFix: number[]
) {
  // Fix Top Lets properties
  await fixTopLetsProperties(
    propertiesByProvider['top-lets'].filter(p => propertiesToFix.includes(p.id))
  );
  
  // Fix Loc8me properties
  await fixLoc8meProperties(
    propertiesByProvider['loc8me'].filter(p => propertiesToFix.includes(p.id))
  );
  
  // Fix other properties
  await fixOtherProperties(
    propertiesByProvider['other'].filter(p => propertiesToFix.includes(p.id))
  );
}

/**
 * Fix Top Lets properties by re-scraping images
 */
async function fixTopLetsProperties(properties: PropertyWithImages[]) {
  console.log(`Fixing ${properties.length} Top Lets properties...`);
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    
    if (!property.url) {
      console.log(`  ✗ Property ${property.id} (${property.title}) has no URL to scrape`);
      continue;
    }
    
    console.log(`[${i + 1}/${properties.length}] Updating photos for ${property.title}`);
    
    try {
      // Fetch the property page
      const response = await fetch(property.url);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract images
      const images: string[] = [];
      
      // Look for image galleries or sliders
      $('.property-gallery img, .property-slider img, .property-images img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && !src.includes('placeholder') && !images.includes(src)) {
          images.push(src);
        }
      });
      
      // Alternative selectors for different page structures
      if (images.length === 0) {
        $('img.property-image, .carousel-item img, .property-detail img').each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (src && !src.includes('placeholder') && !images.includes(src)) {
            images.push(src);
          }
        });
      }
      
      // Validate images against property address
      if (property.street) {
        const streetName = property.street.replace(/^\d+\s+/, '').toLowerCase();
        const validImages = images.filter(image => {
          const imagePath = image.toLowerCase();
          // Check if image URL contains part of the street name or property ID
          return streetName.split(' ').some(word => 
            word.length > 3 && imagePath.includes(word)
          ) || imagePath.includes(property.id.toString());
        });
        
        // If we have valid images, use those; otherwise use all images
        if (validImages.length > 0) {
          images.length = 0;
          images.push(...validImages);
        }
      }
      
      // If we found images, update the property
      if (images.length > 0) {
        await prisma.property.update({
          where: { id: property.id },
          data: { images },
        });
        
        console.log(`  ✓ Updated with ${images.length} new images`);
      } else {
        console.log(`  ✗ No images found on the property page`);
      }
      
      // Add a delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ✗ Error updating photos for ${property.title}:`, error);
    }
  }
}

/**
 * Fix Loc8me properties by re-scraping images
 */
async function fixLoc8meProperties(properties: PropertyWithImages[]) {
  console.log(`Fixing ${properties.length} Loc8me properties...`);
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    
    if (!property.url) {
      console.log(`  ✗ Property ${property.id} (${property.title}) has no URL to scrape`);
      continue;
    }
    
    console.log(`[${i + 1}/${properties.length}] Updating photos for ${property.title}`);
    
    try {
      // Fetch the property page
      const response = await fetch(property.url);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract images - Loc8me specific selectors
      const images: string[] = [];
      
      // Look for image galleries or sliders (Loc8me specific)
      $('.property-images img, .property-gallery img, .slider-image').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && !src.includes('placeholder') && !images.includes(src)) {
          images.push(src);
        }
      });
      
      // Alternative selectors
      if (images.length === 0) {
        $('.property img, .carousel-item img, .gallery-item img').each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (src && !src.includes('placeholder') && !images.includes(src)) {
            images.push(src);
          }
        });
      }
      
      // Validate images against property address
      if (property.street) {
        const streetName = property.street.replace(/^\d+\s+/, '').toLowerCase();
        const validImages = images.filter(image => {
          const imagePath = image.toLowerCase();
          // Check if image URL contains part of the street name or property ID
          return streetName.split(' ').some(word => 
            word.length > 3 && imagePath.includes(word)
          ) || imagePath.includes(property.id.toString());
        });
        
        // If we have valid images, use those; otherwise use all images
        if (validImages.length > 0) {
          images.length = 0;
          images.push(...validImages);
        }
      }
      
      // If we found images, update the property
      if (images.length > 0) {
        await prisma.property.update({
          where: { id: property.id },
          data: { images },
        });
        
        console.log(`  ✓ Updated with ${images.length} new images`);
      } else {
        console.log(`  ✗ No images found on the property page`);
      }
      
      // Add a delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ✗ Error updating photos for ${property.title}:`, error);
    }
  }
}

/**
 * Fix other properties by using a generic approach
 */
async function fixOtherProperties(properties: PropertyWithImages[]) {
  console.log(`Fixing ${properties.length} properties from other providers...`);
  
  for (let i = 0; i < properties.length; i++) {
    const property = properties[i];
    
    if (!property.url) {
      console.log(`  ✗ Property ${property.id} (${property.title}) has no URL to scrape`);
      continue;
    }
    
    console.log(`[${i + 1}/${properties.length}] Updating photos for ${property.title}`);
    
    try {
      // Fetch the property page
      const response = await fetch(property.url);
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract images using generic selectors
      const images: string[] = [];
      
      // Generic image selectors that should work for most property websites
      $('img').each((_, img) => {
        const src = $(img).attr('src') || $(img).attr('data-src');
        if (src && 
            !src.includes('placeholder') && 
            !src.includes('logo') && 
            !src.includes('icon') && 
            !images.includes(src) &&
            (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png'))) {
          images.push(src);
        }
      });
      
      // If we found images, update the property
      if (images.length > 0) {
        await prisma.property.update({
          where: { id: property.id },
          data: { images },
        });
        
        console.log(`  ✓ Updated with ${images.length} new images`);
      } else {
        console.log(`  ✗ No images found on the property page`);
      }
      
      // Add a delay to avoid overwhelming the server
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`  ✗ Error updating photos for ${property.title}:`, error);
    }
  }
}

/**
 * Generate a report of the validation and fixing process
 */
function generateReport(
  propertiesWithDuplicates: PropertyWithImages[],
  propertiesWithMismatchedImages: PropertyWithImages[]
) {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `image-validation-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    duplicateImagesCount: propertiesWithDuplicates.length,
    mismatchedImagesCount: propertiesWithMismatchedImages.length,
    propertiesWithDuplicates: propertiesWithDuplicates.map(p => ({
      id: p.id,
      title: p.title,
      street: p.street,
      provider: p.provider
    })),
    propertiesWithMismatchedImages: propertiesWithMismatchedImages.map(p => ({
      id: p.id,
      title: p.title,
      street: p.street,
      provider: p.provider
    }))
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report generated at ${reportPath}`);
}

// Run the function if this script is executed directly
if (require.main === module) {
  validatePropertyImages()
    .then(() => console.log('Done'))
    .catch(console.error);
}

export { validatePropertyImages }; 