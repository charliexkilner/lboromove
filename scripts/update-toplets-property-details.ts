import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

const prisma = new PrismaClient();

async function updateTopLetsPropertyDetails() {
  try {
    // Find all Top Lets properties with missing bedroom or bathroom information
    const properties = await prisma.property.findMany({
      where: {
        OR: [
          { rooms: 0 },
          { bathrooms: 0 },
          { rooms: { equals: undefined } },
          { bathrooms: { equals: undefined } },
        ],
        AND: [
          {
            OR: [
              { externalId: { contains: 'top-lets' } },
              { url: { contains: 'top-lets' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
        url: true,
        externalId: true,
        rooms: true,
        bathrooms: true,
      },
    });

    console.log(
      `Found ${properties.length} Top Lets properties with missing details`
    );

    for (const property of properties) {
      try {
        // Get the property URL
        const propertyUrl = property.url;

        if (!propertyUrl) {
          console.log(`No URL found for property ${property.title}, skipping`);
          continue;
        }

        console.log(
          `Fetching details for ${property.title} from ${propertyUrl}`
        );

        // Fetch the property page
        const response = await fetch(propertyUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
          timeout: 15000,
        });

        if (!response.ok) {
          console.log(`Failed to fetch ${propertyUrl}: ${response.status}`);
          continue;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Extract bedroom and bathroom information
        let bedrooms = 0;
        let bathrooms = 0;

        // Method 1: Look for the property details section
        $('.listing_detail').each((_, detail) => {
          const detailText = $(detail).text().trim();

          // Check for bedrooms
          if (detailText.includes('Bedrooms:')) {
            const bedroomsMatch = detailText.match(/Bedrooms:\s*(\d+)/);
            if (bedroomsMatch && bedroomsMatch[1]) {
              bedrooms = parseInt(bedroomsMatch[1], 10);
              console.log(`Found ${bedrooms} bedrooms in listing detail`);
            }
          }

          // Check for bathrooms
          if (detailText.includes('Bathrooms:')) {
            const bathroomsMatch = detailText.match(/Bathrooms:\s*(\d+\.?\d*)/);
            if (bathroomsMatch && bathroomsMatch[1]) {
              // Round up decimal bathrooms to the nearest integer
              bathrooms = Math.ceil(parseFloat(bathroomsMatch[1]));
              console.log(
                `Found ${bathroomsMatch[1]} bathrooms in listing detail, rounded to ${bathrooms}`
              );
            }
          }
        });

        // Method 2: Look for property features that might indicate bathrooms
        if (bathrooms === 0) {
          const propertyFeatures = $('.property-features li').text();
          if (
            propertyFeatures.includes('Ensuite') ||
            propertyFeatures.includes('En-suite')
          ) {
            // If there are ensuite rooms, assume at least one bathroom per bedroom
            bathrooms = bedrooms;
            console.log(
              `Assuming ${bathrooms} bathrooms based on ensuite features`
            );
          } else if (
            propertyFeatures.includes('Bathroom') ||
            propertyFeatures.includes('Shower')
          ) {
            // If bathroom is mentioned but count not specified, assume at least 1
            bathrooms = 1;
            console.log(`Assuming at least 1 bathroom based on features`);
          }
        }

        // Method 3: Extract from property description
        if (bedrooms === 0 || bathrooms === 0) {
          const description = $(
            '.wpestate_property_description, .panel-body'
          ).text();

          // Look for bedroom mentions in description
          if (bedrooms === 0) {
            const bedroomsMatch = description.match(
              /(\d+)\s*(?:double\s*)?(?:bed|bedroom)/i
            );
            if (bedroomsMatch && bedroomsMatch[1]) {
              bedrooms = parseInt(bedroomsMatch[1], 10);
              console.log(`Found ${bedrooms} bedrooms in description`);
            }
          }

          // Look for bathroom mentions in description
          if (bathrooms === 0) {
            const bathroomsMatch = description.match(
              /(\d+\.?\d*)\s*(?:bath|bathroom|shower)/i
            );
            if (bathroomsMatch && bathroomsMatch[1]) {
              // Round up decimal bathrooms to the nearest integer
              bathrooms = Math.ceil(parseFloat(bathroomsMatch[1]));
              console.log(
                `Found ${bathroomsMatch[1]} bathrooms in description, rounded to ${bathrooms}`
              );
            }
          }
        }

        // If we still don't have values, try to extract from the title
        if (bedrooms === 0) {
          // Some properties have the bedroom count in the title (e.g., "6 Bed House")
          const titleMatch = property.title.match(/(\d+)\s*(?:bed|bedroom)/i);
          if (titleMatch && titleMatch[1]) {
            bedrooms = parseInt(titleMatch[1], 10);
            console.log(`Found ${bedrooms} bedrooms in title`);
          }
        }

        // If we still don't have values, set defaults
        if (bedrooms === 0) {
          // Look at the URL for clues (e.g., "6-bed-houses")
          const urlMatch = propertyUrl.match(/(\d+)-bed/);
          if (urlMatch && urlMatch[1]) {
            bedrooms = parseInt(urlMatch[1], 10);
            console.log(`Found ${bedrooms} bedrooms in URL`);
          } else {
            // Default to 1 if we couldn't find any information
            bedrooms = 1;
            console.log(`Defaulting to ${bedrooms} bedroom`);
          }
        }

        if (bathrooms === 0) {
          // Default to 1 bathroom per 3 bedrooms, minimum 1
          bathrooms = Math.max(1, Math.ceil(bedrooms / 3));
          console.log(
            `Defaulting to ${bathrooms} bathrooms based on bedroom count`
          );
        }

        // Update the property in the database
        try {
          await prisma.property.update({
            where: { id: property.id },
            data: {
              rooms: bedrooms,
              bathrooms: bathrooms,
            },
          });
          console.log(
            `Updated ${property.title}: ${bedrooms} bedrooms, ${bathrooms} bathrooms`
          );
        } catch (updateError) {
          if (updateError.code === 'P2002') {
            // Handle unique constraint violation by using a different approach
            console.log(
              `Unique constraint error for ${property.title}, trying alternative update method`
            );

            // Get all properties with the same title, price, and location
            const duplicates = await prisma.property.findMany({
              where: {
                title: property.title,
                location: 'Loughborough',
                // Don't include price in the query to find all potential duplicates
              },
              select: {
                id: true,
                rooms: true,
                bathrooms: true,
              },
            });

            console.log(
              `Found ${duplicates.length} properties with title "${property.title}"`
            );

            // Update all duplicates
            for (const dup of duplicates) {
              try {
                await prisma.property.update({
                  where: { id: dup.id },
                  data: {
                    rooms: bedrooms,
                    bathrooms: bathrooms,
                  },
                });
                console.log(`Updated duplicate property ID ${dup.id}`);
              } catch (dupError) {
                console.error(
                  `Failed to update duplicate property ID ${dup.id}:`,
                  dupError
                );
              }
            }
          } else {
            throw updateError; // Re-throw other errors
          }
        }

        // Add a delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`Error updating property ${property.title}:`, error);
      }
    }

    // Final check for any properties still missing data
    const remainingProperties = await prisma.property.findMany({
      where: {
        OR: [
          { rooms: 0 },
          { bathrooms: 0 },
          { rooms: { equals: undefined } },
          { bathrooms: { equals: undefined } },
        ],
        AND: [
          {
            OR: [
              { externalId: { contains: 'top-lets' } },
              { url: { contains: 'top-lets' } },
            ],
          },
        ],
      },
      select: {
        id: true,
        title: true,
      },
    });

    if (remainingProperties.length > 0) {
      console.log(
        `Still have ${remainingProperties.length} properties with missing data:`
      );
      for (const prop of remainingProperties) {
        console.log(`- ${prop.title} (ID: ${prop.id})`);

        // Force update with default values
        try {
          await prisma.property.update({
            where: { id: prop.id },
            data: {
              rooms: 1, // Default to 1 bedroom
              bathrooms: 1, // Default to 1 bathroom
            },
          });
          console.log(`Forced update of ${prop.title} with default values`);
        } catch (error) {
          console.error(`Failed to force update ${prop.title}:`, error);
        }
      }
    } else {
      console.log(
        'All Top Lets properties now have bedroom and bathroom data!'
      );
    }

    console.log('Finished updating Top Lets property details');
  } catch (error) {
    console.error('Error in updateTopLetsPropertyDetails:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function if this script is executed directly
if (require.main === module) {
  updateTopLetsPropertyDetails()
    .then(() => console.log('Done'))
    .catch(console.error);
}
