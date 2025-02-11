import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
    console.log('Successfully connected to database');
    const count = await prisma.property.count();
    console.log(`Found ${count} properties`);
  } catch (error) {
    console.error('Failed to connect:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
