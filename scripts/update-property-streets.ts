import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updatePropertyStreets() {
  const properties = await prisma.property.findMany({
    where: {
      street: null,
    },
  });

  for (const property of properties) {
    // Extract street from location
    const street = property.location.split(',')[0].trim();

    try {
      await prisma.property.update({
        where: { id: property.id },
        data: { street },
      });
      console.log(`Updated street for property ${property.id}: ${street}`);
    } catch (error) {
      console.error(
        `Failed to update street for property ${property.id}:`,
        error
      );
    }
  }
}

updatePropertyStreets()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
