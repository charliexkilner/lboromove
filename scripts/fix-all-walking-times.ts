import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Maximum reasonable walking times (in minutes)
const MAX_WALK_TIME_CAMPUS = 90; // No property should be more than 90 min walk from campus
const MAX_WALK_TIME_TOWN = 90; // No property should be more than 90 min walk from town

// Maximum reasonable distances (in km)
const MAX_DISTANCE_CAMPUS = 7.5; // No property should be more than 7.5km from campus
const MAX_DISTANCE_TOWN = 7.5; // No property should be more than 7.5km from town center

async function fixAllWalkingTimes() {
  try {
    // Find all properties with unrealistic walking times
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { distanceToCampus: { gt: MAX_DISTANCE_CAMPUS } },
          { distanceToTown: { gt: MAX_DISTANCE_TOWN } },
        ],
      },
      select: {
        id: true,
        title: true,
        distanceToCampus: true,
        distanceToTown: true,
        latitude: true,
        longitude: true,
        url: true,
        externalId: true,
      },
    });

    console.log(
      `Found ${properties.length} properties with unrealistic distances`
    );

    // Fix the unrealistic distances
    for (const property of properties) {
      // Determine the agency
      let agency = 'Unknown';
      if (
        property.url?.includes('loc8me') ||
        property.externalId?.includes('loc8me')
      ) {
        agency = 'Loc8me';
      } else if (
        property.url?.includes('top-lets') ||
        property.externalId?.includes('top-lets')
      ) {
        agency = 'Top Lets';
      }

      console.log(
        `Fixing unrealistic distances for ${property.title} (${agency})`
      );
      console.log(
        `  Current distances: Campus=${property.distanceToCampus}km, Town=${property.distanceToTown}km`
      );

      // Calculate reasonable walking times based on a walking speed of 5km/h
      const reasonableCampusDistance =
        property.distanceToCampus > MAX_DISTANCE_CAMPUS
          ? 3.0
          : property.distanceToCampus;
      const reasonableTownDistance =
        property.distanceToTown > MAX_DISTANCE_TOWN
          ? 2.5
          : property.distanceToTown;

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
    console.error('Error in fixAllWalkingTimes:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixAllWalkingTimes()
    .then(() => console.log('Done'))
    .catch(console.error);
}
