const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUpdatedProperties() {
  try {
    // Get total property count
    const totalCount = await prisma.property.count();
    
    // Count properties with coordinates
    const withCoordinatesCount = await prisma.property.count({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
        ],
      },
    });
    
    // Count properties with distances
    const withDistancesCount = await prisma.property.count({
      where: {
        AND: [
          { distanceToCampus: { not: null } },
          { distanceToTown: { not: null } },
        ],
      },
    });
    
    // Count golden triangle properties
    const goldenTriangleCount = await prisma.property.count({
      where: {
        isGoldenTriangle: true,
      },
    });
    
    // Count properties near campus
    const nearCampusCount = await prisma.property.count({
      where: {
        isNearCampus: true,
      },
    });
    
    // Output statistics
    console.log('\n=== PROPERTY UPDATE STATISTICS ===\n');
    console.log(`Total properties: ${totalCount}`);
    console.log(`Properties with coordinates: ${withCoordinatesCount} (${Math.round(withCoordinatesCount/totalCount*100)}%)`);
    console.log(`Properties with distances: ${withDistancesCount} (${Math.round(withDistancesCount/totalCount*100)}%)`);
    console.log(`Properties in Golden Triangle: ${goldenTriangleCount} (${Math.round(goldenTriangleCount/totalCount*100)}%)`);
    console.log(`Properties near campus: ${nearCampusCount} (${Math.round(nearCampusCount/totalCount*100)}%)`);
    
    // Sample updated property
    if (withDistancesCount > 0) {
      const sampleProperty = await prisma.property.findFirst({
        where: {
          AND: [
            { distanceToCampus: { not: null } },
            { distanceToTown: { not: null } },
          ],
        },
        select: {
          id: true,
          title: true,
          street: true,
          latitude: true,
          longitude: true,
          distanceToCampus: true,
          distanceToTown: true,
          isGoldenTriangle: true,
          isNearCampus: true,
        }
      });
      
      console.log('\n=== SAMPLE UPDATED PROPERTY ===\n');
      console.log(sampleProperty);
    }
    
  } catch (error) {
    console.error('Error checking updated properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkUpdatedProperties()
  .then(() => console.log('\nDone checking property updates'))
  .catch(console.error); 