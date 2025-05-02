import { PrismaClient } from '@prisma/client';
import { TopLetsScraper } from '../lib/scrapers/TopLetsScraper.js';

async function main() {
  const prisma = new PrismaClient();

  try {
    console.log('Starting TopLets scraping...');
    const scraper = new TopLetsScraper(prisma);
    await scraper.scrape();
    console.log('Scraping completed successfully');
  } catch (error) {
    console.error('Error running Top Lets scraper:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main(); 