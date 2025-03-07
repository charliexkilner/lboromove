import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const ORS_API_KEY = process.env.ORS_API_KEY;

// Coordinates for key locations
const CAMPUS_COORDINATES = [-1.2329, 52.7652]; // Loughborough University
const TOWN_CENTER_COORDINATES = [-1.2079, 52.7721]; // Loughborough Town Center

// Rate limiting settings
const REQUESTS_PER_MINUTE = 40; // Set lower than the actual limit (100) to be safe
const DELAY_BETWEEN_REQUESTS = 60000 / REQUESTS_PER_MINUTE; // Milliseconds between requests
const MAX_RETRIES = 3;

// Function to get walking distance between two points using Open Route Service API
async function getWalkingDistance(start, end) {
  try {
    const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${ORS_API_KEY}&start=${start.join(
      ','
    )}&end=${end.join(',')}`;

    for (let retry = 0; retry < MAX_RETRIES; retry++) {
      try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.features && data.features[0] && data.features[0].properties) {
          const distanceInMeters =
            data.features[0].properties.segments[0].distance;
          const durationInSeconds =
            data.features[0].properties.segments[0].duration;

          return {
            distance: Math.round(distanceInMeters / 10) / 100, // Convert to km and round to 2 decimal places
            duration: Math.round(durationInSeconds / 60), // Convert to minutes
          };
        }

        if (data.error && data.error.includes('rate limit')) {
          console.log('Rate limit exceeded, adding extra delay...');
          await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 second delay on rate limit
          continue; // Retry after delay
        }

        return null;
      } catch (error) {
        console.error(`Error on attempt ${retry + 1}:`, error);
        if (retry < MAX_RETRIES - 1) {
          // Add delay before retry
          await new Promise((resolve) => setTimeout(resolve, 5000));
        }
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting walking distance:', error);
    return null;
  }
}

async function verifyWalkingDistancesORS() {
  try {
    // Get all properties with coordinates
    const properties = await prisma.property.findMany({
      where: {
        AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        distanceToCampus: true,
        distanceToTown: true,
        url: true,
        externalId: true,
      },
    });

    console.log(`Verifying distances for ${properties.length} properties`);
    console.log(
      `Using rate limit of ${REQUESTS_PER_MINUTE} requests per minute`
    );
    console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);

    let discrepanciesFound = 0;
    let fixedProperties = 0;

    // Check each property
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];

      // Skip properties without valid coordinates
      if (!property.latitude || !property.longitude) continue;

      console.log(`[${i + 1}/${properties.length}] Checking ${property.title}`);

      // Calculate campus walking distance
      const campusWalkingData = await getWalkingDistance(
        [property.longitude, property.latitude],
        CAMPUS_COORDINATES
      );

      // Add delay between API calls
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
      );

      // Calculate town center walking distance
      const townCenterWalkingData = await getWalkingDistance(
        [property.longitude, property.latitude],
        TOWN_CENTER_COORDINATES
      );

      // Add delay between properties
      await new Promise((resolve) =>
        setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
      );

      if (campusWalkingData && townCenterWalkingData) {
        // Check if there's a significant discrepancy (more than 0.5km difference)
        const campusDiscrepancy = Math.abs(
          (property.distanceToCampus || 0) - campusWalkingData.distance
        );
        const townDiscrepancy = Math.abs(
          (property.distanceToTown || 0) - townCenterWalkingData.distance
        );

        if (campusDiscrepancy > 0.5 || townDiscrepancy > 0.5) {
          discrepanciesFound++;

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

          console.log(`Discrepancy found for ${property.title} (${agency}):`);
          console.log(
            `  Campus: DB=${property.distanceToCampus}km, Actual=${
              campusWalkingData.distance
            }km (diff: ${campusDiscrepancy.toFixed(2)}km)`
          );
          console.log(
            `  Town: DB=${property.distanceToTown}km, Actual=${
              townCenterWalkingData.distance
            }km (diff: ${townDiscrepancy.toFixed(2)}km)`
          );

          // Ask if we should update the property
          const shouldUpdate = process.argv.includes('--fix');

          if (shouldUpdate) {
            await prisma.property.update({
              where: { id: property.id },
              data: {
                distanceToCampus: campusWalkingData.distance,
                distanceToTown: townCenterWalkingData.distance,
                isNearCampus: campusWalkingData.distance < 2.0, // Within 2km of campus
              },
            });

            console.log(`  ✓ Updated with accurate walking distances`);
            fixedProperties++;
          }
        }
      } else {
        console.log(`  ✗ Could not calculate walking distances`);
      }
    }

    console.log(`Verification complete.`);
    console.log(
      `Found ${discrepanciesFound} properties with distance discrepancies.`
    );

    if (process.argv.includes('--fix')) {
      console.log(
        `Fixed ${fixedProperties} properties with accurate distances.`
      );
    } else {
      console.log(
        `Run with --fix flag to update properties with accurate distances.`
      );
    }
  } catch (error) {
    console.error('Error in verifyWalkingDistancesORS:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  verifyWalkingDistancesORS()
    .then(() => console.log('Done'))
    .catch(console.error);
}
