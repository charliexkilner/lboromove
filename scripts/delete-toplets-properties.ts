const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deletePropertiesFromSource(source) {
  console.log(`Starting deletion of properties from ${source}...`);

  // First, count how many properties will be affected
  const count = await prisma.property.count({
    where: {
      scrapedFrom: source,
    },
  });

  console.log(`Found ${count} properties from ${source}...`);

  // Confirm deletion
  console.log(`Proceeding with deletion of ${count} properties...`);

  // Delete the properties
  const { count: deletedCount } = await prisma.property.deleteMany({
    where: {
      scrapedFrom: source,
    },
  });

  console.log(`Successfully deleted ${deletedCount} properties from ${source}`);
}

async function main() {
  try {
    await deletePropertiesFromSource('top-lets.co.uk');
    console.log('Operation completed successfully.');
  } catch (error) {
    console.error('Error during operation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 