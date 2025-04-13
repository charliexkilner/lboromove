const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

//  street names with their variations
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
];

// Convert to street patterns for easier matching
const streetPatterns = GOLDEN_TRIANGLE_STREETS.flatMap(([base, suffix, shortSuffix]) => {
  if (!shortSuffix) return [`${base} ${suffix}`];
  return [`${base} ${suffix}`, `${base} ${shortSuffix}`];
});

async function updateGoldenTrianglePropertiesByTitle() {
  try {
    // reset all properties to not be in the Golden Triangle
    await prisma.property.updateMany({
      data: {
        isGoldenTriangle: false,
      },
    });

    console.log('Reset all properties to not be in Golden Triangle');

    let totalUpdated = 0;

    // Update properties that are in the Golden Triangle based on title
    for (const streetPattern of streetPatterns) {
      const updateResult = await prisma.property.updateMany({
        where: {
          title: {
            contains: streetPattern,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        data: {
          isGoldenTriangle: true,
        },
      });

      if (updateResult.count > 0) {
        console.log(
          `Updated ${updateResult.count} properties with title containing "${streetPattern}"`
        );
        totalUpdated += updateResult.count;
      }
    }

    // Also update properties that explicitly mention "golden triangle"
    const goldenTriangleUpdateResult = await prisma.property.updateMany({
      where: {
        OR: [
          {
            title: {
              contains: 'golden triangle',
              mode: 'insensitive',
            },
          },
          {
            location: {
              contains: 'golden triangle',
              mode: 'insensitive',
            },
          },
        ],
      },
      data: {
        isGoldenTriangle: true,
      },
    });

    if (goldenTriangleUpdateResult.count > 0) {
      console.log(`Updated ${goldenTriangleUpdateResult.count} properties explicitly mentioning "Golden Triangle"`);
      totalUpdated += goldenTriangleUpdateResult.count;
    }

    // Get final count and list of Golden Triangle properties
    const goldenTriangleProperties = await prisma.property.findMany({
      where: {
        isGoldenTriangle: true,
      },
      select: {
        id: true,
        title: true,
      },
    });

    console.log('\nProperties in Golden Triangle:');
    goldenTriangleProperties.forEach((prop) =>
      console.log(`- ${prop.title} (ID: ${prop.id})`)
    );
    console.log(
      `\nTotal properties in Golden Triangle: ${goldenTriangleProperties.length}`
    );
    
    if (totalUpdated !== goldenTriangleProperties.length) {
      console.log(`Note: ${totalUpdated} total updates were made, but only ${goldenTriangleProperties.length} properties are marked as Golden Triangle.`);
      console.log('This may be due to some properties matching multiple patterns.');
    }
  } catch (error) {
    console.error('Error updating Golden Triangle properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateGoldenTrianglePropertiesByTitle()
  .then(() => console.log('Done'))
  .catch(console.error); 