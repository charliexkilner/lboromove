import { PrismaClient } from '@prisma/client';
import { Loc8meScraper } from './scrapers/Loc8meScraper';
import { TopLetsScraper } from './scrapers/TopLetsScraper';
import { BaseScraper } from './scrapers/BaseScraper';
import cron from 'node-cron';
// Import other scrapers

export class ScrapingManager {
  private readonly prisma: PrismaClient;
  private readonly scrapers: BaseScraper[];

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.scrapers = [new Loc8meScraper(prisma), new TopLetsScraper(prisma)];
  }

  async scrapeAll(): Promise<void> {
    try {
      // Run Loc8me scraper
      console.log('Starting Loc8me scraper...');
      const loc8meScraper = new Loc8meScraper(this.prisma);
      await loc8meScraper.scrape();
      console.log('Loc8me scraper completed');

      // Run Top Lets scraper
      console.log('Starting Top Lets scraper...');
      const topLetsScraper = new TopLetsScraper(this.prisma);
      await topLetsScraper.scrape();
      console.log('Top Lets scraper completed');

      // Run post-scrape updates
      console.log('Running post-scrape updates...');
      await this.runPostScrapeUpdates();
      console.log('Post-scrape updates completed');
    } catch (error) {
      console.error('Error in scraping manager:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  private async runPostScrapeUpdates(): Promise<void> {
    // Import and run the post-scrape updates
    const {
      updatePropertyStreets,
    } = require('../scripts/update-property-streets');
    const {
      updatePropertyCoordinates,
    } = require('../scripts/update-property-coordinates');
    const {
      updateWalkingDistances,
    } = require('../scripts/update-walking-distances');
    const {
      updateGoldenTriangleProperties,
    } = require('../scripts/update-golden-triangle');

    await updatePropertyStreets();
    await updatePropertyCoordinates();
    await updateWalkingDistances();
    await updateGoldenTriangleProperties();
  }

  async scheduleScrapingJobs() {
    // Run every day at 2 AM
    cron.schedule('0 2 * * *', () => {
      this.scrapeAll().catch((error: unknown) => {
        if (error instanceof Error) {
          console.error(`Scheduled scraping error: ${error.message}`);
        } else {
          console.error('An unknown error occurred during scheduled scraping');
        }
      });
    });
  }
}
