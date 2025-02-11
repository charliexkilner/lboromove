import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanDatabase() {
  try {
    // Delete all properties
    const deleteProperties = await prisma.property.deleteMany();
    console.log(`Deleted ${deleteProperties.count} properties`);

    // Delete all scraping logs
    const deleteLogs = await prisma.scrapingLog.deleteMany();
    console.log(`Deleted ${deleteLogs.count} scraping logs`);

    console.log('Database cleaned successfully');
  } catch (error) {
    console.error('Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanDatabase();
