const { PrismaClient } = require('@prisma/client');
const { Loc8meScraper } = require('../lib/scrapers/Loc8meScraper');

async function main() {
  const prisma = new PrismaClient();
  const scraper = new Loc8meScraper(prisma);

  try {
    console.log('Starting Loc8me scraping...');
    await scraper.scrape();
    console.log('Scraping completed successfully');
  } catch (error) {
    console.error('Error during scraping:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
