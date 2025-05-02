import { PrismaClient } from '@prisma/client';
import { BaseScraper } from './BaseScraper';
import fetch from 'cross-fetch';

interface Loc8meProperty {
  id: number;
  title: string;
  price: string | number;
  bedroom_count: string;
  address: string;
  gallery: Array<{
    url: string;
  }>;
  bills_included: boolean;
  has_ensuite: boolean | null;
  url: string;
  description?: string;
  about?: string;
  key_features?: string[];
}

interface Loc8meApiResponse {
  pagination: {
    count: number;
    max_num_pages: number;
    paged: number;
    text: string;
  };
  properties: Loc8meProperty[];
}

export class Loc8meScraper extends BaseScraper {
  private readonly baseUrl = 'https://loc8me.co.uk/wp-json/api/v1/properties';
  private readonly headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'application/json',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://loc8me.co.uk/student-accommodation/loughborough/'
  };

  constructor(prisma: PrismaClient) {
    super(prisma, 'loc8me');
  }

  async scrape(): Promise<void> {
    try {
      await this.clearExistingProperties();
      const properties = await this.fetchProperties();
      await this.saveProperties(properties);
      console.log(
        `Successfully scraped ${properties.length} properties from Loc8me`
      );
    } catch (error) {
      console.error('Failed to scrape Loc8me:', error);
      throw error;
    }
  }

  private async fetchProperties(): Promise<Loc8meProperty[]> {
    let allProperties: Loc8meProperty[] = [];
    let page = 1;
    const MAX_RETRIES = 3;

    while (true) {
      let success = false;
      let apiResponse: Loc8meApiResponse | null = null;
      
      // Retry logic for the main page request
      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          console.log(`Fetching Loc8me properties page ${page} (attempt ${attempt}/${MAX_RETRIES})`);
          
          // Add a random delay before fetch to mimic more human-like behavior
          const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
          await new Promise(resolve => setTimeout(resolve, randomDelay));
          
          // Use AbortController for timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
          
          const response = await fetch(
            `${this.baseUrl}?branch=loughborough&paged=${page}&per_page=24`,
            {
              headers: this.headers,
              signal: controller.signal
            }
          );
          
          clearTimeout(timeoutId);
          
          if (!response.ok) {
            throw new Error(`Failed to fetch Loc8me API: HTTP ${response.status}`);
          }
          
          const data = await response.json() as Loc8meApiResponse;
          
          if (!data.properties || !Array.isArray(data.properties)) {
            throw new Error('Invalid API response from Loc8me');
          }
          
          // Process each property directly from the main listing
          const processedProperties = data.properties.map(property => ({
            ...property,
            about: property.description || '',
            key_features: [] // We'll get these from the description if needed
          }));

          allProperties = [...allProperties, ...processedProperties];
          apiResponse = data;
          success = true;
          
          console.log(
            `Fetched page ${page} with ${processedProperties.length} properties`
          );
          break; // Exit retry loop if successful
          
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error fetching Loc8me page ${page} (attempt ${attempt}/${MAX_RETRIES}):`, errorMessage);
          
          if (attempt < MAX_RETRIES) {
            const waitTime = attempt * 5000 + Math.floor(Math.random() * 3000);
            console.log(`Waiting ${waitTime}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (!success || !apiResponse) {
        console.error(`Failed to fetch Loc8me page ${page} after ${MAX_RETRIES} attempts, stopping.`);
        break;
      }

      if (page >= apiResponse.pagination.max_num_pages) {
        break;
      }
      page++;
      
      // Add a pause between pages to avoid rate limiting
      const pagePauseTime = 5000 + Math.floor(Math.random() * 3000);
      console.log(`Pausing for ${pagePauseTime}ms before fetching the next page...`);
      await new Promise(resolve => setTimeout(resolve, pagePauseTime));
    }

    return allProperties;
  }

  private extractBathroomCount(description: string): number {
    // If description mentions en-suite and main bathroom
    if (
      description.toLowerCase().includes('en-suite') &&
      description.toLowerCase().includes('main bathroom')
    ) {
      return 2;
    }

    // If description mentions shared bathroom
    if (description.toLowerCase().includes('shared bathroom')) {
      return 1;
    }

    // Default to 1 bathroom if we can't determine the count
    return 1;
  }

  private async saveProperties(properties: Loc8meProperty[]): Promise<void> {
    for (const property of properties) {
      try {
        const title = this.formatPropertyTitle(property.title);
        const fullDescription = property.about || '';

        await this.upsertProperty({
          title: title,
          price:
            typeof property.price === 'string'
              ? parseInt(property.price.replace(/[^0-9]/g, '') || '0')
              : property.price || 0,
          rooms: parseInt(property.bedroom_count || '0'),
          bathrooms: this.extractBathroomCount(fullDescription),
          images: property.gallery?.map((img) => img.url) || [],
          description: fullDescription,
          location: property.address || '',
          amenities: [
            ...(property.bills_included ? ['Bills Included'] : []),
            ...(property.has_ensuite ? ['En-suite'] : []),
          ],
          externalId: property.id.toString(),
          url: property.url || '',
        });
      } catch (error) {
        console.error(`Failed to save property: ${property.title}`, error);
      }
    }
  }

  private async clearExistingProperties(): Promise<void> {
    await this.prisma.property.deleteMany({
      where: {
        scrapedFrom: this.website,
      },
    });
  }

  private formatPropertyTitle(title: string): string {
    if (title.toLowerCase().includes('street')) {
      const cleanTitle = title.replace(/\s*street\s*/gi, '').trim();
      return cleanTitle + ' Street';
    }
    return title;
  }
}
