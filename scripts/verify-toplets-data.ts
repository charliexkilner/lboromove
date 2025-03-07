import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyTopLetsData() {
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
        rooms: true,
        bathrooms: true,
        latitude: true,
        longitude: true,
        distanceToCampus: true,
        distanceToTown: true,
        isNearCampus: true,
        isGoldenTriangle: true,
      },
    });

    console.log(`Found ${properties.length} Top Lets properties`);

    // Check for missing data
    const missingRooms = properties.filter((p) => !p.rooms || p.rooms === 0);
    const missingBathrooms = properties.filter(
      (p) => !p.bathrooms || p.bathrooms === 0
    );
    const missingCoordinates = properties.filter(
      (p) => !p.latitude || !p.longitude
    );
    const missingDistances = properties.filter(
      (p) => !p.distanceToCampus || !p.distanceToTown
    );

    console.log(`Properties missing rooms: ${missingRooms.length}`);
    console.log(`Properties missing bathrooms: ${missingBathrooms.length}`);
    console.log(`Properties missing coordinates: ${missingCoordinates.length}`);
    console.log(`Properties missing distances: ${missingDistances.length}`);

    // Print details of properties with missing data
    if (missingRooms.length > 0) {
      console.log('Properties missing rooms:');
      missingRooms.forEach((p) => console.log(`- ${p.title} (ID: ${p.id})`));
    }

    if (missingBathrooms.length > 0) {
      console.log('Properties missing bathrooms:');
      missingBathrooms.forEach((p) =>
        console.log(`- ${p.title} (ID: ${p.id})`)
      );
    }

    if (missingCoordinates.length > 0) {
      console.log('Properties missing coordinates:');
      missingCoordinates.forEach((p) =>
        console.log(`- ${p.title} (ID: ${p.id})`)
      );
    }

    if (missingDistances.length > 0) {
      console.log('Properties missing distances:');
      missingDistances.forEach((p) =>
        console.log(`- ${p.title} (ID: ${p.id})`)
      );
    }

    console.log('Verification complete');
  } catch (error) {
    console.error('Error in verifyTopLetsData:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  verifyTopLetsData()
    .then(() => console.log('Done'))
    .catch(console.error);
}
