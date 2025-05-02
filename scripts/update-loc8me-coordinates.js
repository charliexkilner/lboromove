const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');
require('dotenv').config();

const prisma = new PrismaClient();
const ORS_API_KEY = process.env.ORS_API_KEY;

// Rate limiting settings
const REQUESTS_PER_MINUTE = 40;
const DELAY_BETWEEN_REQUESTS = 60000 / REQUESTS_PER_MINUTE;
const MAX_RETRIES = 3;

async function getCoordinatesFromAddress(address) {
  try {
    const encodedAddress = encodeURIComponent(`${address}, Loughborough, UK`);
    const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodedAddress}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data && data.features && data.features.length > 0) {
      const location = data.features[0];
      return {
        lat: location.geometry.coordinates[1],
        lng: location.geometry.coordinates[0]
      };
    }

    if (data.error) {
      console.error(`API Error: ${data.error}`);
      if (data.error.includes('rate limit')) {
        console.log('Rate limit exceeded, adding extra delay...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }

    return null;
  } catch (error) {
    console.error('Error getting coordinates:', error);
    return null;
  }
}

async function updateLoc8meCoordinates() {
  try {
    // Get all Loc8me properties without coordinates
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { source: 'Loc8me' },
          {
            OR: [
              { latitude: null },
              { longitude: null },
              { latitude: 0 },
              { longitude: 0 }
            ]
          }
        ]
      }
    });

    console.log(`Found ${properties.length} Loc8me properties without coordinates`);
    console.log(`Using rate limit of ${REQUESTS_PER_MINUTE} requests per minute`);
    console.log(`Delay between requests: ${DELAY_BETWEEN_REQUESTS}ms`);
    
    let updated = 0;
    let skipped = 0;

    for (let i = 0; i < properties.length; i++) {
      const property = properties[i];
      try {
        console.log(`[${i + 1}/${properties.length}] Processing ${property.title}`);

        // Construct address from property data
        let address = '';
        if (property.street) {
          address = property.street;
        } else {
          // Try to extract address from title
          const titleMatch = property.title.match(/(\d+\s+[A-Za-z\s]+(?:Road|Street|Avenue|Lane|Close|Drive|Way|Place|Gardens|Grove|Court|Crescent))/i);
          if (titleMatch) {
            address = titleMatch[1];
          }
        }

        if (!address) {
          console.log(`✗ No valid address found for ${property.title}`);
          skipped++;
          continue;
        }

        // Try to get coordinates with retries
        let coordinates = null;
        for (let retry = 0; retry < MAX_RETRIES && !coordinates; retry++) {
          if (retry > 0) {
            console.log(`Retry ${retry}/${MAX_RETRIES} for ${address}...`);
            await new Promise(resolve => setTimeout(resolve, 5000));
          }

          coordinates = await getCoordinatesFromAddress(address);
        }

        if (coordinates) {
          // Update the property with coordinates
          await prisma.property.update({
            where: { id: property.id },
            data: {
              latitude: coordinates.lat,
              longitude: coordinates.lng
            }
          });

          console.log(`✓ Updated coordinates for ${property.title}`);
          console.log(`  Address: ${address}`);
          console.log(`  Coordinates: ${coordinates.lat}, ${coordinates.lng}`);
          updated++;
        } else {
          console.log(`✗ Could not get coordinates for ${address}`);
          skipped++;
        }

        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_REQUESTS));

      } catch (error) {
        console.error(`Error processing property ${property.title}:`, error);
        skipped++;
      }
    }

    console.log('\n=== Update Summary ===');
    console.log(`Successfully updated: ${updated}`);
    console.log(`Skipped: ${skipped}`);
    console.log(`Total processed: ${properties.length}`);

  } catch (error) {
    console.error('Error in updateLoc8meCoordinates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateLoc8meCoordinates()
  .then(() => console.log('Done'))
  .catch(console.error); 