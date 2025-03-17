import { PrismaClient } from '@prisma/client';
import { CampusScraper } from '../lib/scrapers/CampusScraper';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting Campus Properties scraper...');
    const scraper = new CampusScraper(prisma);
    await scraper.scrape();
    console.log('Campus Properties scraping completed successfully');
  } catch (error) {
    console.error('Error running Campus Properties scraper:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main(); 