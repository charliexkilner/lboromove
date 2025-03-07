import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const ORS_API_KEY = process.env.ORS_API_KEY;

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

        // Now update the coordinates using Open Route Service
        const addressToGeocode = `${streetName}, Loughborough, UK`;
        console.log(`Geocoding: ${addressToGeocode}`);

        // Call the Open Route Service API
        const url = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
          addressToGeocode
        )}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data && data.features && data.features.length > 0) {
          // ORS returns coordinates as [longitude, latitude]
          const [lon, lat] = data.features[0].geometry.coordinates;

          // Update the property with the coordinates
          await prisma.property.update({
            where: { id: property.id },
            data: {
              latitude: lat,
              longitude: lon,
            },
          });

          console.log(
            `✓ Updated coordinates for ${property.title}: ${lat}, ${lon}`
          );
        } else {
          console.log(`✗ Failed to geocode ${property.title}`);

          // Try with just the street name without the number
          const streetNameOnly = streetName.replace(/^\d+\s+/, '');
          const fallbackAddress = `${streetNameOnly}, Loughborough, UK`;
          console.log(`Trying fallback geocoding: ${fallbackAddress}`);

          const fallbackUrl = `https://api.openrouteservice.org/geocode/search?api_key=${ORS_API_KEY}&text=${encodeURIComponent(
            fallbackAddress
          )}`;

          const fallbackResponse = await fetch(fallbackUrl);
          const fallbackData = await fallbackResponse.json();

          if (
            fallbackData &&
            fallbackData.features &&
            fallbackData.features.length > 0
          ) {
            // ORS returns coordinates as [longitude, latitude]
            const [lon, lat] = fallbackData.features[0].geometry.coordinates;

            // Update the property with the coordinates
            await prisma.property.update({
              where: { id: property.id },
              data: {
                latitude: lat,
                longitude: lon,
              },
            });

            console.log(
              `✓ Updated coordinates using fallback for ${property.title}: ${lat}, ${lon}`
            );
          } else {
            console.log(
              `✗ Failed to geocode using fallback for ${property.title}`
            );
          }
        }

        // Add a delay to avoid hitting API rate limits
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
