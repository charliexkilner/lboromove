const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Campus and town center coordinates
const CAMPUS_COORDINATES = { lat: 52.7652, lng: -1.2329 }; // Loughborough University
const TOWN_CENTER_COORDINATES = { lat: 52.7721, lng: -1.2079 }; // Loughborough Town Center

// Function to calculate straight-line distance between two points (in km)
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLng = deg2rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

// Check if a property is close to university (within 2km)
function isCloseToUniversity(property) {
  if (!property.latitude || !property.longitude) return false;
  
  const distance = calculateDistance(
    property.latitude,
    property.longitude,
    CAMPUS_COORDINATES.lat,
    CAMPUS_COORDINATES.lng
  );
  
  return distance < 2.0;
}

async function updateWalkingDistances() {
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

    for (const property of properties) {
      try {
        const distanceToTown = calculateDistance(
          property.latitude,
          property.longitude,
          TOWN_CENTER_COORDINATES.lat,
          TOWN_CENTER_COORDINATES.lng
        );
        
        const distanceToCampus = calculateDistance(
          property.latitude,
          property.longitude,
          CAMPUS_COORDINATES.lat,
          CAMPUS_COORDINATES.lng
        );
        
        const nearCampus = isCloseToUniversity(property);

        await prisma.property.update({
          where: { id: property.id },
          data: {
            distanceToTown: distanceToTown,
            distanceToCampus: distanceToCampus,
            isNearCampus: nearCampus,
          },
        });

        console.log(
          `✓ ${property.title || property.id}: ` +
            `${distanceToTown}km to town, ${distanceToCampus}km to campus, ` +
            `near campus: ${nearCampus}`
        );
      } catch (error) {
        console.error(
          `Failed to update distances for ${property.title || property.id}:`,
          error
        );
      }
    }
    
    console.log('Walking distances update completed successfully');
  } catch (error) {
    console.error('Error in updateWalkingDistances:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateWalkingDistances()
  .then(() => console.log('Done'))
  .catch(console.error); 