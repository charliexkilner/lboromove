import { PrismaClient } from '@prisma/client';
import * as cheerio from 'cheerio';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function updateTopLetsPhotos() {
  try {
    // Get properties with duplicate images
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { externalId: { contains: 'top-lets' } },
          { url: { contains: 'top-lets' } },
        ],
      },
      select: {
        id: true,
        title: true,
        url: true,
        images: true,
      },
    });

    console.log(`Found ${properties.length} Top Lets properties to check`);

    // Create a map to track image URLs and the properties they belong to
    const imageMap = new Map();
    const duplicateImages = new Map();

    // Identify duplicate images
    for (const property of properties) {
      if (!property.images || !Array.isArray(property.images)) continue;

      for (const image of property.images) {
        if (!imageMap.has(image)) {
          imageMap.set(image, property.id);
        } else {
          // This is a duplicate image
          if (!duplicateImages.has(image)) {
            duplicateImages.set(image, [imageMap.get(image)]);
          }
          duplicateImages.get(image).push(property.id);
        }
      }
    }

    // Properties that need to be updated with new images
    const propertiesToUpdate = new Set();

    // Identify properties with all duplicate images
    for (const property of properties) {
      if (!property.images || !Array.isArray(property.images)) continue;

      const allDuplicates = property.images.every((image) =>
        duplicateImages.has(image)
      );
      if (allDuplicates && property.images.length > 0) {
        propertiesToUpdate.add(property.id);
      }
    }

    const propertiesWithDuplicates = properties.filter(
      (p) => propertiesToUpdate.has(p.id) && p.url
    );

    console.log(
      `Updating photos for ${propertiesWithDuplicates.length} properties`
    );

    // Process properties with a delay to avoid overwhelming the server
    for (let i = 0; i < propertiesWithDuplicates.length; i++) {
      const property = propertiesWithDuplicates[i];

      console.log(
        `[${i + 1}/${propertiesWithDuplicates.length}] Updating photos for ${
          property.title
        }`
      );

      try {
        // Fetch the property page
        const response = await fetch(property.url);
        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract images
        const images: string[] = [];

        // Look for image galleries or sliders
        $(
          '.property-gallery img, .property-slider img, .property-images img'
        ).each((_, img) => {
          const src = $(img).attr('src') || $(img).attr('data-src');
          if (src && !src.includes('placeholder') && !images.includes(src)) {
            images.push(src);
          }
        });

        // Alternative selectors for different page structures
        if (images.length === 0) {
          $(
            'img.property-image, .carousel-item img, .property-detail img'
          ).each((_, img) => {
            const src = $(img).attr('src') || $(img).attr('data-src');
            if (src && !src.includes('placeholder') && !images.includes(src)) {
              images.push(src);
            }
          });
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
        console.error(
          `  ✗ Error updating photos for ${property.title}:`,
          error
        );
      }
    }

    console.log('Finished updating Top Lets photos');
  } catch (error) {
    console.error('Error in updateTopLetsPhotos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  updateTopLetsPhotos()
    .then(() => console.log('Done'))
    .catch(console.error);
}
