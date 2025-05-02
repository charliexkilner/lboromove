import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting emoji update for Student Beehive properties...');
    
    // Use executeRaw to run a direct SQL update
    const result = await prisma.$executeRaw`
      UPDATE "Property"
      SET emoji = '🐝'
      WHERE "scrapedFrom" = 'studentbeehive'
    `;

    console.log(`Successfully updated ${result} Student Beehive properties with bee emoji`);
  } catch (error) {
    console.error('Error updating emojis:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 