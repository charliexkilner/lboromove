import { PrismaClient } from '@prisma/client';
import { updatePropertyStreets } from './update-property-streets';
import { updatePropertyCoordinates } from './update-property-coordinates';
import { updateGoldenTriangleProperties } from './update-golden-triangle';
import { updateWalkingDistances } from './update-walking-distances';

const prisma = new PrismaClient();

async function runPostScrapeUpdates() {
  try {
    console.log('Starting post-scrape updates...');

    // 1. Update streets
    console.log('\n1. Updating property streets...');
    await updatePropertyStreets();

    // 2. Update coordinates
    console.log('\n2. Updating property coordinates...');
    await updatePropertyCoordinates();

    // 3. Update walking distances
    console.log('\n3. Updating walking distances...');
    await updateWalkingDistances();

    // 4. Update Golden Triangle properties
    console.log('\n4. Updating Golden Triangle properties...');
    await updateGoldenTriangleProperties();

    console.log('\nAll post-scrape updates completed successfully!');
  } catch (error) {
    console.error('Error during post-scrape updates:', error);
  } finally {
    await prisma.$disconnect();
    // Force exit after cleanup
    process.exit(0);
  }
}

runPostScrapeUpdates().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
