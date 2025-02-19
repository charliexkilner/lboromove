import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyPropertyData() {
  const properties = await prisma.property.findMany({
    select: {
      id: true,
      street: true,
      latitude: true,
      longitude: true,
      location: true,
    },
  });

  console.log('Total properties:', properties.length);
  console.log(
    'Properties with coordinates:',
    properties.filter((p) => p.latitude && p.longitude).length
  );
  console.log(
    'Properties with street:',
    properties.filter((p) => p.street).length
  );

  // Show a few sample properties
  console.log('\nSample properties:');
  properties.slice(0, 3).forEach((p) => console.log(p));
}

verifyPropertyData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
