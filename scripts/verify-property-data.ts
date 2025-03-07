import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPropertyData() {
  try {
    // Check coordinates
    const noCoords = await prisma.property.count({
      where: {
        OR: [
          { latitude: null },
          { longitude: null },
          { latitude: 0 },
          { longitude: 0 },
        ],
      },
    });

    // Check walking distances
    const noDistances = await prisma.property.count({
      where: {
        OR: [{ distanceToTown: null }, { distanceToCampus: null }],
      },
    });

    // Check near campus properties
    const nearCampus = await prisma.property.count({
      where: { isNearCampus: true },
    });

    // Check Golden Triangle properties
    const goldenTriangle = await prisma.property.count({
      where: { isGoldenTriangle: true },
    });

    console.log('\nProperty Data Verification:');
    console.log('-------------------------');
    console.log(`Properties missing coordinates: ${noCoords}`);
    console.log(`Properties missing distances: ${noDistances}`);
    console.log(`Properties near campus: ${nearCampus}`);
    console.log(`Properties in Golden Triangle: ${goldenTriangle}`);

    // Sample a property to check all data
    const sampleProperty = await prisma.property.findFirst({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { distanceToTown: { not: null } },
          { distanceToCampus: { not: null } },
        ],
      },
    });

    if (sampleProperty) {
      console.log('\nSample Property Data:');
      console.log('-------------------');
      console.log(`Street: ${sampleProperty.street}`);
      console.log(
        `Coordinates: ${sampleProperty.latitude}, ${sampleProperty.longitude}`
      );
      console.log(`Distance to Town: ${sampleProperty.distanceToTown} minutes`);
      console.log(
        `Distance to Campus: ${sampleProperty.distanceToCampus} minutes`
      );
      console.log(`Near Campus: ${sampleProperty.isNearCampus}`);
      console.log(`Golden Triangle: ${sampleProperty.isGoldenTriangle}`);
    }
  } catch (error) {
    console.error('Verification failed:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

verifyPropertyData();
