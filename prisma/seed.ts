import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Comment out or remove test property creation
  /*
  await prisma.property.create({
    data: {
      title: 'Test Property',
      price: 125.0,
      rooms: 4,
      bathrooms: 2,
      description: 'A lovely student property near campus',
      location: 'Loughborough',
      images: [
        'https://images.unsplash.com/photo-1518780664697-55e3ad937233',
        'https://images.unsplash.com/photo-1523217582562-09d0def993a6',
      ],
      amenities: ['WiFi', 'Washing Machine'],
      scrapedFrom: 'manual',
      externalId: 'TEST-1',
      hash: 'unique-hash-1',
    },
  });
  */
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
