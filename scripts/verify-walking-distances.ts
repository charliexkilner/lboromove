import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

// Coordinates for key locations
const CAMPUS_COORDINATES = [-1.2329, 52.7652]; // Loughborough University
const TOWN_CENTER_COORDINATES = [-1.2079, 52.7721]; // Loughborough Town Center

// Function to calculate straight-line distance between two points (in km)
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

async function verifyWalkingDistances() {
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

    let discrepanciesFound = 0;
    let fixedProperties = 0;

    // Check each property
    for (const property of properties) {
      // Skip properties without valid coordinates
      if (!property.latitude || !property.longitude) continue;

      // Calculate actual distances
      const actualCampusDistance = calculateDistance(
        property.latitude,
        property.longitude,
        CAMPUS_COORDINATES[1],
        CAMPUS_COORDINATES[0]
      );

      const actualTownDistance = calculateDistance(
        property.latitude,
        property.longitude,
        TOWN_CENTER_COORDINATES[1],
        TOWN_CENTER_COORDINATES[0]
      );

      // Check if there's a significant discrepancy (more than 0.5km difference)
      const campusDiscrepancy = Math.abs(
        (property.distanceToCampus || 0) - actualCampusDistance
      );
      const townDiscrepancy = Math.abs(
        (property.distanceToTown || 0) - actualTownDistance
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
          `  Campus: DB=${
            property.distanceToCampus
          }km, Actual=${actualCampusDistance}km (diff: ${campusDiscrepancy.toFixed(
            2
          )}km)`
        );
        console.log(
          `  Town: DB=${
            property.distanceToTown
          }km, Actual=${actualTownDistance}km (diff: ${townDiscrepancy.toFixed(
            2
          )}km)`
        );

        // Ask if we should update the property
        const shouldUpdate = process.argv.includes('--fix');

        if (shouldUpdate) {
          await prisma.property.update({
            where: { id: property.id },
            data: {
              distanceToCampus: actualCampusDistance,
              distanceToTown: actualTownDistance,
              isNearCampus: actualCampusDistance < 2.0, // Within 2km of campus
            },
          });

          console.log(`  ✓ Updated with accurate distances`);
          fixedProperties++;
        }
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
    console.error('Error in verifyWalkingDistances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  verifyWalkingDistances()
    .then(() => console.log('Done'))
    .catch(console.error);
}
