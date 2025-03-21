import { ScrapingManager } from '../lib/ScrapingManager';
import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient();
  const manager = new ScrapingManager(prisma);
  
  try {
    await manager.scrapeAll();
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch(console.error)
  .finally(() => process.exit());
