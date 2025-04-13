const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPropertyCount() {
  try {
    const count = await prisma.property.count();
    console.log(`Total properties in database: ${count}`);
    
    if (count > 0) {
      // Get a sample property to check its structure
      const sampleProperty = await prisma.property.findFirst({
        select: {
          id: true,
          title: true,
          distanceToCampus: true,
          distanceToTown: true,
          isGoldenTriangle: true,
          isNearCampus: true,
          latitude: true,
          longitude: true
        }
      });
      console.log('Sample property data:', sampleProperty);
    }
  } catch (error) {
    console.error('Error checking properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPropertyCount(); 