import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';

const prisma = new PrismaClient();

export async function updatePropertyCoordinates() {
  try {
    // Get all properties without coordinates
    const properties = await prisma.property.findMany({
      where: {
        OR: [{ latitude: null }, { longitude: null }],
      },
      select: {
        id: true,
        title: true,
        location: true,
        street: true,
        externalId: true,
        url: true,
      },
    });

    console.log(`Found ${properties.length} properties without coordinates`);

    for (const property of properties) {
      try {
        // Determine if this is a Top Lets property
        const isTopLets =
          property.externalId?.includes('top-lets') ||
          property.url?.includes('top-lets');

        // Extract address components
        let addressToGeocode = '';

        if (isTopLets) {
          // For Top Lets properties, try to extract a more specific address
          // First, check if we can extract the address from the title
          const titleMatch = property.title.match(
            /(\d+\s+[A-Za-z\s]+(?:Road|Street|Avenue|Lane|Close|Drive|Way|Place|Terrace))/i
          );

          if (titleMatch && titleMatch[1]) {
            // Use the address from the title
            addressToGeocode = `${titleMatch[1]}, Loughborough, UK`;
          } else if (property.street) {
            // Use the street if available
            addressToGeocode = `${property.street}, Loughborough, UK`;
          } else {
            // Extract address from the URL as a fallback
            const urlMatch = property.url?.match(/properties\/([^\/]+)/);
            if (urlMatch && urlMatch[1]) {
              // Convert URL slug to address format (e.g., "13-radmoor-road" to "13 Radmoor Road")
              const addressFromUrl = urlMatch[1]
                .replace(/-/g, ' ')
                .replace(/(\d+)([A-Za-z])/, '$1 $2')
                .replace(/\b\w/g, (c) => c.toUpperCase());

              addressToGeocode = `${addressFromUrl}, Loughborough, UK`;
            } else {
              // Default to location if nothing else works
              addressToGeocode = `${property.location}, UK`;
            }
          }
        } else {
          // For Loc8me properties, use the existing logic
          addressToGeocode = property.street
            ? `${property.street}, ${property.location}, UK`
            : `${property.location}, UK`;
        }

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
        }

        // Add a small delay to avoid hitting API rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        console.error(
          `Error updating coordinates for property ${property.title}:`,
          error
        );
      }
    }

    console.log('Finished updating property coordinates');
  } catch (error) {
    console.error('Error in updatePropertyCoordinates:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  updatePropertyCoordinates()
    .then(() => console.log('Done'))
    .catch(console.error);
}
