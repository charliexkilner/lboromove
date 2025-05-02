import { PrismaClient } from '@prisma/client';
import { EcoCareScraper } from '../lib/scrapers/EcoCareScraper';

async function main() {
  const prisma = new PrismaClient();
  const scraper = new EcoCareScraper(prisma);

  try {
    await scraper.scrape();
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 