import { prisma } from './prisma';
import { Loc8meScraper } from './scrapers/Loc8meScraper';
import { BaseScraper } from './scrapers/BaseScraper';
import cron from 'node-cron';
// Import other scrapers

export class ScrapingManager {
  private scrapers: BaseScraper[];

  constructor() {
    this.scrapers = [
      new Loc8meScraper(prisma),
      // Initialize other scrapers
    ];
  }

  async scrapeAll() {
    for (const scraper of this.scrapers) {
      try {
        await scraper.scrape();
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error(`Error with scraper: ${error.message}`);
        } else {
          console.error('An unknown error occurred with scraper');
        }
      }
    }
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
