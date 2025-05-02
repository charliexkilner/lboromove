const { PrismaClient } = require('@prisma/client');
const fetch = require('node-fetch');

const prisma = new PrismaClient();

async function updatePropertyCoordinates() {
  try {
    // Get all TopLets properties without coordinates
    const properties = await prisma.property.findMany({
      where: {
        AND: [
          { source: 'TopLets' },
          {
            OR: [
              { latitude: null },
              { longitude: null },
              { latitude: 0 },
              { longitude: 0 }
            ]
          }
        ]
      },
      select: {
        id: true,
        title: true,
        location: true,
        street: true,
        url: true,
      },
    });

    console.log(`Found ${properties.length} TopLets properties without coordinates`);

    // Check if API key exists
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('GOOGLE_MAPS_API_KEY environment variable is not set.');
      console.log('Please add your Google Maps API key to the .env file:');
      console.log('GOOGLE_MAPS_API_KEY=your_api_key_here');
      return;
    }

    let successCount = 0;
    let failureCount = 0;

    for (const property of properties) {
      try {
        // Extract address components
        let addressToGeocode = '';

        // First try to use the street address if available
        if (property.street) {
          addressToGeocode = `${property.street}, Loughborough, UK`;
        } else {
          // Try to extract address from title
          const titleMatch = property.title.match(
            /(\d+\s+[A-Za-z\s]+(?:Road|Street|Avenue|Lane|Close|Drive|Way|Place|Terrace|Gardens|Grove|Court|Crescent))/i
          );

          if (titleMatch && titleMatch[1]) {
            addressToGeocode = `${titleMatch[1]}, Loughborough, UK`;
          } else {
            // Use location as fallback
            addressToGeocode = `${property.location}, UK`;
          }
        }

        console.log(`\nGeocoding: ${addressToGeocode}`);
        console.log(`Property: ${property.title}`);

        // Call the geocoding API
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          addressToGeocode
        )}&key=${apiKey}&components=country:GB|locality:Loughborough`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;

          // Verify the coordinates are within Loughborough bounds
          const isInLoughborough = lat >= 52.75 && lat <= 52.79 && lng >= -1.24 && lng <= -1.19;

          if (!isInLoughborough) {
            console.log(`✗ Coordinates outside Loughborough bounds: ${lat}, ${lng}`);
            failureCount++;
            continue;
          }

          // Update the property with the coordinates
          await prisma.property.update({
            where: { id: property.id },
            data: {
              latitude: lat,
              longitude: lng,
            },
          });

          console.log(`✓ Updated coordinates: ${lat}, ${lng}`);
          successCount++;
        } else {
          console.log(`✗ Failed to geocode: ${data.status}`);
          failureCount++;
        }

        // Add a delay to avoid hitting API rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(`Error updating coordinates:`, error);
        failureCount++;
      }
    }

    console.log('\n=== Geocoding Summary ===');
    console.log(`Successfully geocoded: ${successCount}`);
    console.log(`Failed to geocode: ${failureCount}`);
    console.log(`Total processed: ${properties.length}`);

  } catch (error) {
    console.error('Error in updatePropertyCoordinates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updatePropertyCoordinates()
  .then(() => console.log('Done'))
  .catch(console.error); 