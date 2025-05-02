import { PrismaClient } from '@prisma/client';
import { StudentBeehiveScraper } from '../lib/scrapers/StudentBeehiveScraper';

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting Student Beehive scraper...');
    const scraper = new StudentBeehiveScraper(prisma);
    await scraper.scrape();
    console.log('Scraping completed successfully');
  } catch (error) {
    console.error('Error running scraper:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 