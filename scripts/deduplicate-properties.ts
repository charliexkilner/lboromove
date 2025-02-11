import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deduplicateProperties() {
  try {
    // Get all properties
    const properties = await prisma.property.findMany();

    // Create a map to store unique properties
    const uniqueMap = new Map();
    const duplicates: number[] = [];

    // Identify duplicates based on multiple criteria
    properties.forEach((property) => {
      // Create a unique key based on multiple properties
      const key = `${property.title}-${property.price}-${property.rooms}-${property.location}`;

      if (uniqueMap.has(key)) {
        // If we've seen this combination before, it's a duplicate
        duplicates.push(property.id);
      } else {
        uniqueMap.set(key, property);
      }
    });

    // Log the number of duplicates found
    console.log(`Found ${duplicates.length} duplicate properties`);

    if (duplicates.length > 0) {
      // Delete all duplicates
      const deleteResult = await prisma.property.deleteMany({
        where: {
          id: {
            in: duplicates,
          },
        },
      });

      console.log(`Deleted ${deleteResult.count} duplicate properties`);
    }
  } catch (error) {
    console.error('Error deduplicating properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deduplication
deduplicateProperties();
