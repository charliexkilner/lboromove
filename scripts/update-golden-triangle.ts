import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type PropertyWithStreet = {
  street: string;
};

// Base street names with their variations
const GOLDEN_TRIANGLE_STREETS = [
  ['station', 'street', 'st'],
  ['paget', 'street', 'st'],
  ['leopold', 'street', 'st'],
  ['regent', 'street', 'st'],
  ['broad', 'street', 'st'],
  ['hastings', 'street', 'st'],
  ['granville', 'street', 'st'],
  ['chestnut', 'street', 'st'],
  ['radmoor', 'road', 'rd'],
  ['ashby', 'road', 'rd'],
  ['cumberland', 'road', 'rd'],
  ['fearon', 'street', 'st'],
  ['havelock', 'street', 'st'],
  ['forest', 'road', 'rd'],
  ['forest', 'court', 'ct'],
  ['ashleigh', 'drive', 'dr'],
  ['oakwood', 'drive', 'dr'],
  ['college', 'road', 'rd'],
  ['tower', 'way'],
  ['park', 'road', 'rd'],
  ['burleigh', 'road', 'rd'],
  ['epinal', 'way'],
  ['kingfisher', 'way'],
  ['frederick', 'street', 'st'],
  ['william', 'street', 'st'],
].flatMap(([base, suffix, shortSuffix]) => {
  if (!shortSuffix) return [`${base} ${suffix}`];
  return [`${base} ${suffix}`, `${base} ${shortSuffix}`];
});

async function updateGoldenTriangleProperties() {
  try {
    // First, reset all properties to not be in the Golden Triangle
    await prisma.property.updateMany({
      data: {
        isGoldenTriangle: false,
      },
    });

    console.log('Reset all properties to not be in Golden Triangle');

    // Update properties that are in the Golden Triangle
    for (const streetPattern of GOLDEN_TRIANGLE_STREETS) {
      const updateResult = await prisma.property.updateMany({
        where: {
          street: {
            contains: streetPattern,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        data: {
          isGoldenTriangle: true,
        },
      });

      console.log(
        `Updated ${updateResult.count} properties matching "${streetPattern}"`
      );
    }

    // Get final count and list of Golden Triangle properties
    const goldenTriangleProperties = (await prisma.property.findMany({
      where: {
        isGoldenTriangle: true,
      },
      select: {
        street: true,
      },
    })) as PropertyWithStreet[];

    console.log('\nProperties in Golden Triangle:');
    goldenTriangleProperties.forEach((prop: PropertyWithStreet) =>
      console.log(`- ${prop.street}`)
    );
    console.log(
      `\nTotal properties in Golden Triangle: ${goldenTriangleProperties.length}`
    );
  } catch (error) {
    console.error('Error updating Golden Triangle properties:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update function
updateGoldenTriangleProperties().catch((error) => {
  console.error('Failed to update Golden Triangle properties:', error);
  process.exit(1);
});
