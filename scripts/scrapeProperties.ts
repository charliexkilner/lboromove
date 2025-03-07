import { PrismaClient } from '@prisma/client';
import { Loc8meScraper } from '../lib/scrapers/Loc8meScraper';
import { TopLetsScraper } from '../lib/scrapers/TopLetsScraper';

async function main() {
  const prisma = new PrismaClient();

  try {
    // Run Loc8me scraper
    console.log('Starting Loc8me scraper...');
    const loc8meScraper = new Loc8meScraper(prisma);
    await loc8meScraper.scrape();

    // Run Top Lets scraper
    console.log('Starting Top Lets scraper...');
    const topLetsScraper = new TopLetsScraper(prisma);
    await topLetsScraper.scrape();

    console.log('All scrapers completed successfully!');
  } catch (error) {
    console.error('Error running scrapers:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
