const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Deleting all properties from database...');
    
    // Delete all properties
    const deleteResult = await prisma.property.deleteMany({});
    
    console.log(`Successfully deleted ${deleteResult.count} properties`);
  } catch (error) {
    console.error('Error deleting properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 