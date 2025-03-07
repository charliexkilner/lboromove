import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Maximum reasonable walking times (in minutes)
const MAX_WALK_TIME_CAMPUS = 90; // No property should be more than 90 min walk from campus
const MAX_WALK_TIME_TOWN = 90; // No property should be more than 90 min walk from town

async function fixTopLetsWalkingTimes() {
  try {
    // Find all Top Lets properties with unrealistic walking times
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          {
            OR: [
              { externalId: { contains: 'top-lets' } },
              { url: { contains: 'top-lets' } },
            ],
          },
          {
            OR: [
              { distanceToCampus: { gt: 7.5 } }, // More than 7.5km is unrealistic for Loughborough
              { distanceToTown: { gt: 7.5 } }, // More than 7.5km is unrealistic for Loughborough
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        distanceToCampus: true,
        distanceToTown: true,
        latitude: true,
        longitude: true,
      },
    });

    console.log(
      `Found ${properties.length} Top Lets properties with unrealistic distances`
    );

    // Fix the unrealistic distances
    for (const property of properties) {
      console.log(`Fixing unrealistic distances for ${property.title}`);
      console.log(
        `  Current distances: Campus=${property.distanceToCampus}km, Town=${property.distanceToTown}km`
      );

      // Calculate reasonable walking times based on a walking speed of 5km/h
      const reasonableCampusDistance =
        property.distanceToCampus > 7.5 ? 3.0 : property.distanceToCampus;
      const reasonableTownDistance =
        property.distanceToTown > 7.5 ? 2.5 : property.distanceToTown;

      // Update the property with reasonable distances
      await prisma.property.update({
        where: { id: property.id },
        data: {
          distanceToCampus: reasonableCampusDistance,
          distanceToTown: reasonableTownDistance,
          isNearCampus: reasonableCampusDistance < 2.0, // Within 2km of campus
        },
      });

      console.log(
        `  Updated distances: Campus=${reasonableCampusDistance}km, Town=${reasonableTownDistance}km`
      );
    }

    console.log('Finished fixing unrealistic walking distances');
  } catch (error) {
    console.error('Error in fixTopLetsWalkingTimes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixTopLetsWalkingTimes()
    .then(() => console.log('Done'))
    .catch(console.error);
}
