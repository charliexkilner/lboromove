const { PrismaClient } = require('@prisma/client');
const { TopLetsScraper } = require('../lib/scrapers/TopLetsScraper');

async function main() {
  const prisma = new PrismaClient();

  try {
    const scraper = new TopLetsScraper(prisma);
    await scraper.scrape();
  } catch (error) {
    console.error('Error running Top Lets scraper:', error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

main();
