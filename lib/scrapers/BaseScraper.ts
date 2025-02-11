import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';

interface ScrapedData {
  title: string;
  price: number;
  rooms: number;
  bathrooms: number;
  images: string[];
  description: string;
  location: string;
  amenities: string[];
  externalId: string;
  url?: string;
}

export abstract class BaseScraper {
  protected prisma: PrismaClient;
  protected website: string;

  constructor(prisma: PrismaClient, website: string) {
    this.prisma = prisma;
    this.website = website;
  }

  protected async createBrowser() {
    return chromium.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      executablePath:
        process.platform === 'darwin'
          ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
          : undefined,
    });
  }

  protected async logScraping(
    status: string,
    message?: string,
    itemsScraped: number = 0
  ) {
    try {
      await this.prisma.scrapingLog.create({
        data: {
          website: this.website,
          status,
          message: message || null,
          itemsScraped,
          endTime: new Date(),
        },
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error logging scraping:', error.message);
      } else {
        console.error('Unknown error while logging scraping');
      }
    }
  }

  abstract scrape(): Promise<void>;

  protected async upsertProperty(property: {
    title: string;
    price: number;
    rooms: number;
    bathrooms: number;
    images: string[];
    description: string;
    location: string;
    amenities: string[];
    externalId: string;
    url?: string;
  }) {
    const hash = `${property.title}-${property.price}-${property.rooms}-${property.location}`;

    try {
      await this.prisma.property.upsert({
        where: {
          hash: hash,
        },
        update: {
          ...property,
          scrapedFrom: this.website,
          hash: hash,
        },
        create: {
          ...property,
          scrapedFrom: this.website,
          hash: hash,
        },
      });
      console.log('Found property:', 'yes');
    } catch (error) {
      console.error('Failed to upsert property:', error);
    }
  }
}
