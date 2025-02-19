import { PrismaClient } from '@prisma/client';
import { geocode } from '../utils/geocoding';

const prisma = new PrismaClient();

async function updatePropertyCoordinates() {
  const properties = await prisma.property.findMany({
    where: {
      OR: [{ latitude: null }, { longitude: null }],
    },
  });

  for (const property of properties) {
    if (property.street) {
      try {
        // First try with full address
        const coords = await geocode(property.location);

        await prisma.property.update({
          where: { id: property.id },
          data: {
            latitude: coords.lat,
            longitude: coords.lng,
          },
        });
        console.log(`Updated coordinates for ${property.street}`);
      } catch (error) {
        // If first attempt fails, try with simplified address
        try {
          const simplifiedAddress = `${property.street}, Loughborough`;
          const coords = await geocode(simplifiedAddress);

          await prisma.property.update({
            where: { id: property.id },
            data: {
              latitude: coords.lat,
              longitude: coords.lng,
            },
          });
          console.log(
            `Updated coordinates for ${property.street} (using simplified address)`
          );
        } catch (retryError) {
          console.error(
            `Failed to update coordinates for ${property.street}:`,
            retryError
          );
        }
      }
    }
  }
}

updatePropertyCoordinates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
