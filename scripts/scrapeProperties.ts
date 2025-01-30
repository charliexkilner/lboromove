import { Loc8meScraper } from '../lib/scrapers/Loc8meScraper';
import { PrismaClient } from '@prisma/client';

async function runScrapers() {
  const prisma = new PrismaClient();

  const scrapers = [
    new Loc8meScraper(prisma),
    // Add more scrapers here as needed
  ];

  for (const scraper of scrapers) {
    try {
      await scraper.scrape();
    } catch (error) {
      console.error('Scraper failed:', error);
    }
  }

  await prisma.$disconnect();
}

runScrapers();
