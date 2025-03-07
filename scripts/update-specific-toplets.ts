import { PrismaClient } from '@prisma/client';
import { TopLetsScraper } from '../lib/scrapers/TopLetsScraper';

const prisma = new PrismaClient();

async function updateSpecificTopLetsProperties() {
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
      `Found ${propertiesWithDuplicates.length} properties to update`
    );

    // Extract URLs for the scraper
    const urlsToScrape = propertiesWithDuplicates
      .map((p) => p.url)
      .filter(Boolean);

    // Initialize the scraper
    const scraper = new TopLetsScraper(prisma);

    // Run the scraper with specific URLs
    console.log('Starting targeted scraping...');
    await scraper.scrapeSpecificUrls(urlsToScrape);

    console.log('Finished updating Top Lets properties');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateSpecificTopLetsProperties()
  .then(() => console.log('Done'))
  .catch(console.error);
