import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

async function fixTopLetsStreetsAndCoordinates() {
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
        location: true,
        street: true,
        latitude: true,
        longitude: true,
      },
    });

    console.log(`Found ${properties.length} Top Lets properties to check`);

    for (const property of properties) {
      try {
        // Extract street name from title
        // Pattern: "123 Street Name" -> "Street Name"
        const streetMatch = property.title.match(/^\d+\s+(.+)$/);
        let streetName = '';

        if (streetMatch && streetMatch[1]) {
          // Remove "Flat X" or other apartment indicators if present
          streetName = streetMatch[1].replace(/\s+Flat\s+\d+$/i, '');

          // Check if the street name ends with "Road", "Street", etc.
          const hasStreetSuffix =
            /(?:Road|Street|Avenue|Lane|Close|Drive|Way|Place|Terrace)$/i.test(
              streetName
            );

          if (hasStreetSuffix) {
            console.log(
              `Extracted street name "${streetName}" from title "${property.title}"`
            );
          } else {
            // If no street suffix, use the whole title as it might be a building name
            streetName = property.title;
            console.log(`Using full title as street name: "${streetName}"`);
          }
        } else {
          // If no number at the beginning, use the whole title
          streetName = property.title;
          console.log(`Using full title as street name: "${streetName}"`);
        }

        // Update the street name in the database
        await prisma.property.update({
          where: { id: property.id },
          data: {
            street: streetName,
          },
        });

        console.log(
          `Updated street name for property ID ${property.id} to "${streetName}"`
        );

        // Now update the coordinates using the street name
        const addressToGeocode = `${streetName}, Loughborough, UK`;
        console.log(`Geocoding: ${addressToGeocode}`);

        // Call the geocoding API
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          addressToGeocode
        )}&key=${apiKey}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.status === 'OK' && data.results && data.results.length > 0) {
          const { lat, lng } = data.results[0].geometry.location;

          // Update the property with the coordinates
          await prisma.property.update({
            where: { id: property.id },
            data: {
              latitude: lat,
              longitude: lng,
            },
          });

          console.log(
            `✓ Updated coordinates for ${property.title}: ${lat}, ${lng}`
          );
        } else {
          console.log(`✗ Failed to geocode ${property.title}: ${data.status}`);

          // Try with just the street name without the number
          const streetNameOnly = streetName.replace(/^\d+\s+/, '');
          const fallbackAddress = `${streetNameOnly}, Loughborough, UK`;
          console.log(`Trying fallback geocoding: ${fallbackAddress}`);

          const fallbackUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            fallbackAddress
          )}&key=${apiKey}`;

          const fallbackResponse = await fetch(fallbackUrl);
          const fallbackData = await fallbackResponse.json();

          if (
            fallbackData.status === 'OK' &&
            fallbackData.results &&
            fallbackData.results.length > 0
          ) {
            const { lat, lng } = fallbackData.results[0].geometry.location;

            // Update the property with the coordinates
            await prisma.property.update({
              where: { id: property.id },
              data: {
                latitude: lat,
                longitude: lng,
              },
            });

            console.log(
              `✓ Updated coordinates using fallback for ${property.title}: ${lat}, ${lng}`
            );
          } else {
            console.log(
              `✗ Failed to geocode using fallback for ${property.title}: ${fallbackData.status}`
            );
          }
        }

        // Add a delay to avoid hitting API rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error updating property ${property.title}:`, error);
      }
    }

    console.log('Finished updating Top Lets streets and coordinates');
  } catch (error) {
    console.error('Error in fixTopLetsStreetsAndCoordinates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  fixTopLetsStreetsAndCoordinates()
    .then(() => console.log('Done'))
    .catch(console.error);
}
