const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Golden Triangle streets from the original update-golden-triangle.ts script
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
].flatMap(([base, suffix, shortSuffix]) => {
  if (!shortSuffix) return [`${base} ${suffix}`];
  return [`${base} ${suffix}`, `${base} ${shortSuffix}`];
});

// Campus and town center coordinates 
const UNIVERSITY_COORDS = { lat: 52.7650, lng: -1.2277 };
const TOWN_CENTER_COORDS = { lat: 52.7727, lng: -1.2065 };

// Calculate walking distance (approximated by haversine formula)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
}

// Calculate walking time (in minutes) based on distance 
// Using average walking speed of 5 km/h (83.3m per minute)
function calculateWalkingTime(distance) {
  const walkingSpeedKmH = 5;
  const walkingTimeMinutes = (distance / walkingSpeedKmH) * 60;
  return Math.round(walkingTimeMinutes);
}

// Step 1: Update the Golden Triangle properties
async function updateGoldenTriangleProperties() {
  console.log('--- Starting Golden Triangle Update ---');
  try {
    // First, reset all properties to not be in the Golden Triangle
    await prisma.property.updateMany({
      data: {
        isGoldenTriangle: false,
      },
    });

    console.log('Reset all properties to not be in Golden Triangle');

    // Update properties that are in the Golden Triangle
    for (const streetPattern of GOLDEN_TRIANGLE_STREETS) {
      const updateResult = await prisma.property.updateMany({
        where: {
          street: {
            contains: streetPattern,
            mode: 'insensitive', // Case-insensitive search
          },
        },
        data: {
          isGoldenTriangle: true,
        },
      });

      if (updateResult.count > 0) {
        console.log(`Updated ${updateResult.count} properties matching "${streetPattern}"`);
      }
    }

    // Get final count of Golden Triangle properties
    const count = await prisma.property.count({
      where: {
        isGoldenTriangle: true,
      }
    });

    console.log(`Total properties in Golden Triangle: ${count}`);
  } catch (error) {
    console.error('Error updating Golden Triangle properties:', error);
  }
}

// Step 2: Update Walking Distances
async function updateWalkingDistances() {
  console.log('\n--- Starting Walking Distance Update ---');
  try {
    // Only get properties with valid coordinates
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { latitude: { not: null } },
          { longitude: { not: null } },
          { latitude: { not: 0 } },
          { longitude: { not: 0 } },
        ],
      },
    });

    console.log(`Calculating distances for ${properties.length} properties...`);
    let updateCount = 0;

    for (const property of properties) {
      try {
        // Calculate distance to campus and town center
        const distanceToCampus = calculateDistance(
          property.latitude, 
          property.longitude, 
          UNIVERSITY_COORDS.lat, 
          UNIVERSITY_COORDS.lng
        );
        
        const distanceToTown = calculateDistance(
          property.latitude, 
          property.longitude, 
          TOWN_CENTER_COORDS.lat, 
          TOWN_CENTER_COORDS.lng
        );

        // Calculate walking times in minutes
        const walkTimeToCampus = calculateWalkingTime(distanceToCampus);
        const walkTimeToTown = calculateWalkingTime(distanceToTown);
        
        // Determine if the property is near campus (within 2 km)
        const isNearCampus = distanceToCampus <= 2.0;

        // Update the property with calculated distances
        await prisma.property.update({
          where: { id: property.id },
          data: {
            distanceToCampus: distanceToCampus,
            distanceToTown: distanceToTown,
            isNearCampus: isNearCampus,
          },
        });

        updateCount++;
        
        if (updateCount % 10 === 0) {
          console.log(`Updated ${updateCount} of ${properties.length} properties`);
        }
      } catch (error) {
        console.error(`Failed to update distances for property ID ${property.id}:`, error);
      }
    }

    console.log(`Successfully updated walking distances for ${updateCount} properties`);
  } catch (error) {
    console.error('Error in updateWalkingDistances:', error);
  }
}

// Step 3: Fix unrealistic walking times
async function fixUnrealisticWalkingTimes() {
  console.log('\n--- Fixing Unrealistic Walking Times ---');
  try {
    // Find properties with unrealistic walking times
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { distanceToCampus: { gt: 7.5 } }, // More than 7.5km is unrealistic for Loughborough
          { distanceToTown: { gt: 7.5 } }, // More than 7.5km is unrealistic for Loughborough
        ],
      },
      select: {
        id: true,
        title: true,
        distanceToCampus: true,
        distanceToTown: true,
      },
    });

    console.log(`Found ${properties.length} properties with unrealistic distances`);

    // Fix the unrealistic distances
    for (const property of properties) {
      const reasonableCampusDistance =
        property.distanceToCampus > 7.5 ? 3.0 : property.distanceToCampus;
      const reasonableTownDistance =
        property.distanceToTown > 7.5 ? 2.5 : property.distanceToTown;

      const walkTimeToCampus = calculateWalkingTime(reasonableCampusDistance);
      const walkTimeToTown = calculateWalkingTime(reasonableTownDistance);

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
        `Fixed unrealistic distances for property ID ${property.id}: ` +
        `Campus=${reasonableCampusDistance.toFixed(2)}km (${walkTimeToCampus}min), ` +
        `Town=${reasonableTownDistance.toFixed(2)}km (${walkTimeToTown}min)`
      );
    }
  } catch (error) {
    console.error('Error fixing unrealistic walking times:', error);
  }
}

// Main function to run all updates
async function updateAllPropertyInfo() {
  try {
    console.log('=== Starting Property Information Update ===\n');
    
    // Step 1: Update Golden Triangle properties
    await updateGoldenTriangleProperties();
    
    // Step 2: Update walking distances
    await updateWalkingDistances();
    
    // Step 3: Fix any unrealistic walking times
    await fixUnrealisticWalkingTimes();
    
    console.log('\n=== Property Information Update Completed Successfully ===');
  } catch (error) {
    console.error('\nError during property information update:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
updateAllPropertyInfo(); 