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

async function updateTopLetsWalkingDistances() {
  try {
    // Find all Top Lets properties with coordinates
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { externalId: { contains: 'top-lets' } },
          { url: { contains: 'top-lets' } },
        ],
        AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
      },
      select: {
        id: true,
        title: true,
        latitude: true,
        longitude: true,
        distanceToCampus: true,
        distanceToTown: true,
      },
    });

    console.log(
      `Found ${properties.length} Top Lets properties to update walking distances`
    );
    console.log(
      `Using rate limit of ${REQUESTS_PER_MINUTE} requests per minute`
    );
    console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);

    // Process properties in batches to respect rate limits
    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      try {
        console.log(
          `[${i + 1}/${properties.length}] Updating walking distances for ${
            property.title
          }`
        );

        // Calculate walking distance to campus with retry logic
        let campusWalkingData = null;
        let townCenterWalkingData = null;

        // Try to get campus walking data with retries
        for (
          let retry = 0;
          retry < MAX_RETRIES && !campusWalkingData;
          retry++
        ) {
          if (retry > 0) {
            console.log(`Retry ${retry}/${MAX_RETRIES} for campus distance...`);
            // Add extra delay for retries
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }

          campusWalkingData = await getWalkingDistance(
            [property.longitude, property.latitude],
            CAMPUS_COORDINATES
          );
        }

        // Add delay between API calls
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
        );

        // Try to get town center walking data with retries
        for (
          let retry = 0;
          retry < MAX_RETRIES && !townCenterWalkingData;
          retry++
        ) {
          if (retry > 0) {
            console.log(
              `Retry ${retry}/${MAX_RETRIES} for town center distance...`
            );
            // Add extra delay for retries
            await new Promise((resolve) => setTimeout(resolve, 5000));
          }

          townCenterWalkingData = await getWalkingDistance(
            [property.longitude, property.latitude],
            TOWN_CENTER_COORDINATES
          );
        }

        if (campusWalkingData && townCenterWalkingData) {
          // Update the property with walking distances
          await prisma.property.update({
            where: { id: property.id },
            data: {
              distanceToCampus:
                Math.round(campusWalkingData.distance / 10) / 100, // Convert to km with 2 decimal places
              distanceToTown:
                Math.round(townCenterWalkingData.distance / 10) / 100, // Changed from distanceToTownCenter
              isNearCampus: campusWalkingData.distance < 2000, // Within 2km of campus
              isGoldenTriangle: isInGoldenTriangle(
                property.latitude,
                property.longitude
              ),
            },
          });

          console.log(`✓ Updated walking distances for ${property.title}:`);
          console.log(
            `  - Campus: ${
              Math.round(campusWalkingData.distance / 10) / 100
            }km (${Math.round(campusWalkingData.duration / 60)} min walk)`
          );
          console.log(
            `  - Town Center: ${
              Math.round(townCenterWalkingData.distance / 10) / 100
            }km (${Math.round(townCenterWalkingData.duration / 60)} min walk)`
          );
          console.log(`  - Near Campus: ${campusWalkingData.distance < 2000}`);
          console.log(
            `  - Golden Triangle: ${isInGoldenTriangle(
              property.latitude,
              property.longitude
            )}`
          );
        } else {
          console.log(
            `✗ Failed to calculate walking distances for ${property.title} after ${MAX_RETRIES} retries`
          );
        }

        // Add a delay between properties to respect rate limits
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
        );
      } catch (error) {
        console.error(
          `Error updating walking distances for ${property.title}:`,
          error
        );
        // Continue with the next property even if this one fails
        await new Promise((resolve) =>
          setTimeout(resolve, DELAY_BETWEEN_REQUESTS)
        );
      }
    }

    console.log('Finished updating Top Lets walking distances');
  } catch (error) {
    console.error('Error in updateTopLetsWalkingDistances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Function to get walking distance between two points
async function getWalkingDistance(start, end) {
  try {
    const url = `https://api.openrouteservice.org/v2/directions/foot-walking?api_key=${ORS_API_KEY}&start=${start.join(
      ','
    )}&end=${end.join(',')}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data.features && data.features.length > 0) {
      const route = data.features[0];
      return {
        distance: route.properties.summary.distance, // in meters
        duration: route.properties.summary.duration, // in seconds
      };
    }

    if (data.error) {
      console.error(`API Error: ${data.error}`);
      if (data.error.includes('rate limit')) {
        console.log('Rate limit exceeded, adding extra delay...');
        await new Promise((resolve) => setTimeout(resolve, 30000)); // 30 second delay on rate limit
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting walking distance:', error);
    return null;
  }
}

// Function to check if a property is in the Golden Triangle
function isInGoldenTriangle(lat, lng) {
  // Define the Golden Triangle area (approximate polygon)
  // These are approximate coordinates for the Golden Triangle in Loughborough
  const goldenTriangleCoordinates = [
    [52.7721, -1.2079], // Town center
    [52.768, -1.22], // Forest Road area
    [52.763, -1.215], // Ashby Road area
  ];

  // Simple check: if the property is within the bounding box of the Golden Triangle
  // and within a certain distance of the center of the Golden Triangle
  const minLat = Math.min(
    ...goldenTriangleCoordinates.map((coord) => coord[0])
  );
  const maxLat = Math.max(
    ...goldenTriangleCoordinates.map((coord) => coord[0])
  );
  const minLng = Math.min(
    ...goldenTriangleCoordinates.map((coord) => coord[1])
  );
  const maxLng = Math.max(
    ...goldenTriangleCoordinates.map((coord) => coord[1])
  );

  // Check if the property is within the bounding box
  const isWithinBoundingBox =
    lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;

  // For a more accurate check, you could implement a point-in-polygon algorithm
  // or use a more precise definition of the Golden Triangle

  return isWithinBoundingBox;
}

// Run the function if this script is executed directly
if (require.main === module) {
  updateTopLetsWalkingDistances()
    .then(() => console.log('Done'))
    .catch(console.error);
}
