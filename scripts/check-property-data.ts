import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPropertyData() {
  const totalProperties = await prisma.property.count();
  const propertiesWithCoordinates = await prisma.property.count({
    where: {
      AND: [{ latitude: { not: null } }, { longitude: { not: null } }],
    },
  });
  const propertiesWithStreet = await prisma.property.count({
    where: {
      street: { not: null },
    },
  });

  console.log(`Total properties: ${totalProperties}`);
  console.log(`Properties with coordinates: ${propertiesWithCoordinates}`);
  console.log(`Properties with street: ${propertiesWithStreet}`);

  // Check a sample property
  const sampleProperty = await prisma.property.findFirst({
    where: {
      OR: [{ street: { not: null } }, { latitude: { not: null } }],
    },
  });
  console.log('Sample property:', sampleProperty);
}

checkPropertyData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
