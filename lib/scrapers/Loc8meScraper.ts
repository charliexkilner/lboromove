import { PrismaClient } from '@prisma/client';
import fetch from 'node-fetch';
import { BaseScraper } from './BaseScraper';

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

    while (true) {
      const response = await fetch(
        `${this.baseUrl}?__v_isShallow=false&__v_isRef=true&branch=loughborough&paged=${page}`
      );
      const data = (await response.json()) as Loc8meApiResponse;

      if (!data.properties || !Array.isArray(data.properties)) {
        throw new Error('Invalid API response from Loc8me');
      }

      // Fetch detailed information for each property
      const detailedProperties = await Promise.all(
        data.properties.map(async (property) => {
          try {
            const detailResponse = await fetch(
              `${this.baseUrl}/${property.id}?__v_isShallow=false&__v_isRef=true`
            );
            const detailData = (await detailResponse.json()) as any;
            return {
              ...property,
              about: detailData?.about || '',
              key_features: detailData?.key_features || [],
            };
          } catch (error) {
            console.error(
              `Failed to fetch details for property ${property.id}:`,
              error
            );
            return property;
          }
        })
      );

      allProperties = [...allProperties, ...detailedProperties];
      console.log(
        `Fetched page ${page} with ${data.properties.length} properties`
      );

      if (page >= data.pagination.max_num_pages) {
        break;
      }
      page++;
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
        const fullDescription = [
          property.about || '',
          ...(property.key_features || []),
        ].join('\n');

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
