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
    priceRange?: string;
    catering?: string;
    bathroomType?: string;
  }) {
    const hash = `${property.title}-${property.price}-${property.rooms}-${property.location}`;
    
    // Create a safe property object that removes any fields that might not be in the database schema
    // Explicitly create a new object with only the fields we know exist in the database
    const safeProperty = {
      title: property.title,
      price: property.price,
      rooms: property.rooms,
      bathrooms: property.bathrooms,
      images: property.images,
      description: property.description,
      location: property.location,
      amenities: property.amenities,
      externalId: property.externalId,
      url: property.url,
      pricingOptions: [],
      isGoldenTriangle: false,
      // Optional fields that might not be in all property records
      ...(property.priceRange ? { priceRange: property.priceRange } : {}),
      ...(property.catering ? { catering: property.catering } : {}),
      ...(property.bathroomType ? { bathroomType: property.bathroomType } : {})
    };

    try {
      await this.prisma.property.upsert({
        where: {
          hash: hash,
        },
        update: {
          ...safeProperty,
          scrapedFrom: this.website,
          hash: hash
        },
        create: {
          ...safeProperty,
          scrapedFrom: this.website,
          hash: hash
        },
      });
      console.log('Found property:', 'yes');
    } catch (error) {
      console.error('Failed to upsert property:', error);
    }
  }
}
