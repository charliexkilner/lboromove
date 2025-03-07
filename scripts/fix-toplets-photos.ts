import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function fixTopLetsPhotos() {
  try {
    // Find all Top Lets properties
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
        images: true,
        url: true,
      },
    });

    console.log(
      `Found ${properties.length} Top Lets properties to check for duplicate photos`
    );

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

    console.log(
      `Found ${duplicateImages.size} duplicate images across properties`
    );

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
        console.log(
          `Property "${property.title}" (ID: ${property.id}) has all duplicate images`
        );
      }
    }

    console.log(`${propertiesToUpdate.size} properties need new images`);

    // For properties that need updating, we'll need to re-scrape their images
    // This requires accessing the Top Lets website again
    if (propertiesToUpdate.size > 0) {
      console.log('These properties need to be re-scraped for images:');
      for (const property of properties) {
        if (propertiesToUpdate.has(property.id)) {
          console.log(`- ${property.title} (${property.url})`);
        }
      }
    }

    console.log('Finished checking Top Lets photos');
  } catch (error) {
    console.error('Error in fixTopLetsPhotos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixTopLetsPhotos()
    .then(() => console.log('Done'))
    .catch(console.error);
}
