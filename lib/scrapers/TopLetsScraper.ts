import { PrismaClient } from '@prisma/client';
import { BaseScraper } from './BaseScraper';
import crossFetch from 'cross-fetch';
import * as cheerio from 'cheerio';
import nodeCrypto from 'crypto';

interface BedroomPage {
  url: string;
  bedrooms: number;
}

interface Property {
  id: string;
  title: string;
  link: string;
  price: string;
  imageUrl?: string;
  rooms?: number;
}

interface PropertyDetails {
  title: string;
  location: string;
  price: number;
  rooms: number;
  bathrooms: number;
  description: string;
  images: string[];
  externalId: string;
  url: string;
  amenities: string[];
}

export class TopLetsScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.top-lets.co.uk';
  private readonly bedroomPages: BedroomPage[] = [
    { url: '/listings/1-bed-apartments/', bedrooms: 1 },
    { url: '/listings/2-bed-apartments/', bedrooms: 2 },
    ...Array.from({ length: 10 }, (_, i) => ({
      url: `/listings/${i + 3}-bed-houses/`,
      bedrooms: i + 3,
    })),
  ];

  constructor(prisma: PrismaClient) {
    super(prisma, 'TopLets');
  }

  async scrape(): Promise<void> {
    console.log('Starting Top Lets scraper...');

    try {
      // Process each bedroom page
      for (const page of this.bedroomPages) {
        console.log(`Processing ${page.bedrooms} bedroom properties...`);
        await this.scrapeBedroomPage(page);
      }
    } catch (error) {
      console.error('Error in Top Lets scraper:', error);
    }
  }

  private async scrapeBedroomPage(page: BedroomPage): Promise<void> {
    const processedLinks = new Set<string>();
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage) {
      const pageUrl = currentPage === 1 
        ? `${this.baseUrl}${page.url}`
        : `${this.baseUrl}${page.url}page/${currentPage}/`;

      console.log(`Fetching page ${currentPage} for ${page.bedrooms} bedrooms: ${pageUrl}`);

      try {
        const properties = await this.fetchPropertiesFromPage(pageUrl, page.bedrooms);
        
        if (properties.length === 0) {
          console.log(`No properties found on page ${currentPage}, assuming last page`);
          hasNextPage = false;
          break;
        }

        // Process each property
        for (const property of properties) {
          try {
            if (processedLinks.has(property.link)) {
              console.log(`Skipping duplicate property: ${property.title}`);
              continue;
            }

            processedLinks.add(property.link);
            await this.processProperty({ ...property, rooms: page.bedrooms });
            await new Promise((resolve) => setTimeout(resolve, 2000));
          } catch (error) {
            console.error(`Error processing property:`, error);
          }
        }

        // Check if next page exists by making a test request
        const nextPageUrl = `${this.baseUrl}${page.url}page/${currentPage + 1}/`;
        const nextPageExists = await this.doesPageExist(nextPageUrl);
        
        if (!nextPageExists) {
          console.log(`No more pages found for ${page.bedrooms} bedrooms`);
          hasNextPage = false;
        } else {
          currentPage++;
        }

        // Add delay between pages
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } catch (error) {
        console.error(`Error fetching page ${currentPage}:`, error);
        hasNextPage = false;
      }
    }
  }

  private async doesPageExist(url: string): Promise<boolean> {
    try {
      const response = await crossFetch(url, {
        headers: this.getHeaders(),
        redirect: 'follow',
      });

      if (!response.ok) return false;

      const html = await response.text();
      return !html.includes('Page not found');
    } catch {
      return false;
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.google.com/',
    };
  }

  private async fetchPropertiesFromPage(pageUrl: string, bedrooms: number): Promise<Property[]> {
    const properties: Property[] = [];
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      const response = await crossFetch(pageUrl, {
        headers: this.getHeaders(),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch page: ${response.status}`);
      }

      const html = await response.text();
      
      if (html.length < 1000) {
        throw new Error('Received incomplete HTML');
      }

      const $ = cheerio.load(html);

      // Find all property listings on the page
      $('.property_listing, .listing_wrapper').each((_: any, card: any) => {
        const $card = $(card);
        
        // Extract property link
        let propertyLink = $card.attr('data-link') || 
                          $card.find('h4 a').attr('href') || 
                          $card.find('.title_unit a').attr('href');

        if (!propertyLink) return;

        // Make link absolute
        if (!propertyLink.startsWith('http')) {
          propertyLink = this.baseUrl + propertyLink;
        }

        // Extract title
        const title = $card.find('h4, .title_unit').first().text().trim();

        // Extract price
        const priceText = $card.find('.listing_unit_price_wrapper, .price_unit').first().text().trim();

        // Extract image
        let imageUrl = $card.find('img.lazyload').attr('data-src') || 
                      $card.find('img').attr('src');

        if (imageUrl && !imageUrl.startsWith('http')) {
          imageUrl = this.baseUrl + imageUrl;
        }

        properties.push({
          id: propertyLink,
          title,
          link: propertyLink,
          price: priceText,
          imageUrl,
          rooms: bedrooms
        });
      });

      return properties;
    } catch (error) {
      console.error(`Error fetching properties from page:`, error);
      return [];
    }
  }

  private async processProperty(property: Property): Promise<void> {
    const MAX_RETRIES = 3;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Processing property (attempt ${attempt}/${MAX_RETRIES}): ${property.title}`);
        
        // Add a random delay before fetch to mimic more human-like behavior
        const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, randomDelay));
        
        // Use AbortController for timeout (90 seconds for more time)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);
        
        const response = await crossFetch(property.link, {
          headers: this.getHeaders(),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch property details: ${response.status}`);
        }

        const html = await response.text();
        
        if (html.length < 1000) {
          throw new Error('Received incomplete HTML, likely got redirected or blocked');
        }

        const $ = cheerio.load(html);

        // Extract property details
        const title = property.title || $('h1.entry-title').text().trim();
        
        // Extract location
        let location = $('.property_address_container').text().trim();
        if (!location) {
          location = $('.property_address').text().trim();
        }
        // Add Loughborough as a fallback if no location found
        if (!location) location = 'Loughborough';

        // Extract price
        const price = this.extractPrice(property.price);

        // Extract bedrooms
        let bedrooms = property.rooms || 0;
        if (!bedrooms) {
          $('.property_bedrooms, .feature_wrapper').each((_: any, element: any) => {
            const text = $(element).text().trim();
            if (text.includes('bed') || text.includes('Bed')) {
              const bedroomMatch = text.match(/(\d+)\s*(?:bed|Bed)/);
              if (bedroomMatch && bedroomMatch[1]) {
                bedrooms = parseInt(bedroomMatch[1], 10);
              }
            }
          });
        }

        // Extract bathrooms
        let bathrooms = 0;
        $('.property_bathrooms, .feature_wrapper').each((_: any, element: any) => {
          const text = $(element).text().trim();
          if (text.includes('bath') || text.includes('Bath')) {
            const bathroomMatch = text.match(/(\d+)\s*(?:bath|Bath)/);
            if (bathroomMatch && bathroomMatch[1]) {
              bathrooms = parseInt(bathroomMatch[1], 10);
            }
          }
        });

        // Extract description
        let description = $('.wpestate_property_description p').text().trim();
        if (!description) {
          description = $('.property_content').text().trim();
        }

        // Extract images
        const images: string[] = [];
        $('.carousel-inner img, .property_image img, .gallery_wrapper img').each((_: any, element: any) => {
          const src = $(element).attr('src') || $(element).attr('data-src');
          if (src && !src.includes('transparent.png')) {
            console.log(`Found image: ${src}`);
            images.push(src);
          }
        });

        // Try alternative image selectors if none found
        if (images.length === 0) {
          $('img.lazyload').each((_: any, element: any) => {
            const src = $(element).attr('data-src') || $(element).attr('src');
            if (src && !src.includes('transparent.png')) {
              images.push(src);
            }
          });
        }

        // If no images found, use the featured image
        if (images.length === 0 && property.imageUrl) {
          images.push(property.imageUrl);
        }

        // Extract amenities/features
        const amenities: string[] = [];
        $('.feature_wrapper, .listing_detail').each((_: any, element: any) => {
          const text = $(element).text().trim();
          if (text) {
            amenities.push(text);
          }
        });

        console.log({
          title,
          location,
          price,
          bedrooms,
          bathrooms,
          imageCount: images.length,
          amenitiesCount: amenities.length
        });

        // Save property to database
        await this.upsertProperty({
          title,
          location,
          price,
          rooms: bedrooms || 1, // Default to 1 if not found
          bathrooms: bathrooms || 1, // Default to 1 if not found
          description: this.cleanHtml(description),
          images,
          externalId: property.link,
          url: property.link,
          amenities: amenities,
        });

        console.log(`Successfully processed property: ${title}`);
        return; // Exit after successful processing
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing property (attempt ${attempt}/${MAX_RETRIES}):`, errorMessage);
        
        // Check if it's an abort error
        const isAbortError = error instanceof Error && 
                           (error.name === 'AbortError' || 
                            errorMessage.includes('abort') || 
                            errorMessage.includes('Abort'));
        
        if (attempt < MAX_RETRIES) {
          // Wait longer between retries with a random component
          const baseWaitTime = attempt * 5000; // 5s, 10s, 15s base
          const randomTime = Math.floor(Math.random() * 3000); // 0-3s random
          const waitTime = baseWaitTime + randomTime;
          
          console.log(`Waiting ${waitTime}ms before retry${isAbortError ? ' (abort detected)' : ''}...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    console.error(`Failed to process property after ${MAX_RETRIES} attempts: ${property.title}`);
  }

  private cleanHtml(html: string): string {
    // Remove HTML tags
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractPrice(priceText: string): number {
    const priceMatch = priceText.match(/£?\s*(\d+)/);
    if (priceMatch && priceMatch[1]) {
      return parseInt(priceMatch[1], 10);
    }
    return 0;
  }

  private async calculateDistanceToCampus(location: string): Promise<number | null> {
    try {
      // Add simple estimation logic based on location text
      if (location.toLowerCase().includes('campus') || 
          location.toLowerCase().includes('university')) {
        return 0; // On campus
      }
      
      // For now, return null as we would need a geocoding service for precise calculations
      return null;
    } catch (error) {
      console.error('Error calculating distance to campus:', error);
      return null;
    }
  }

  private async scrapePropertyDetails(url: string): Promise<PropertyDetails | null> {
    const MAX_RETRIES = 3;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Scraping details for ${url} (attempt ${attempt}/${MAX_RETRIES})`);
        
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await crossFetch(url, {
          headers: this.getHeaders(),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch property details: ${response.status}`);
        }

        const html = await response.text();
        
        if (html.length < 1000) {
          throw new Error('Received incomplete HTML');
        }

        const $ = cheerio.load(html);
        
        // Extract basic property details
        const title = $('h1.entry-title').text().trim();
        const location = $('.property_address_container').text().trim() || 'Loughborough';
        const price = this.extractPrice($('.listing_unit_price_wrapper').text().trim());
        const rooms = parseInt($('.property_bedrooms').text().trim(), 10) || 1;
        const bathrooms = parseInt($('.property_bathrooms').text().trim(), 10) || 1;
        const description = $('.wpestate_property_description').text().trim();
        
        const images: string[] = [];
        $('.carousel-inner img').each((_: any, element: any) => {
          const src = $(element).attr('src');
          if (src) images.push(src);
        });
        
        const amenities: string[] = [];
        $('.feature_wrapper').each((_: any, element: any) => {
          const text = $(element).text().trim();
          if (text) amenities.push(text);
        });

        return {
          title,
          location,
          price,
          rooms,
          bathrooms,
          description,
          images,
          externalId: url,
          url,
          amenities
        };
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error scraping property details (attempt ${attempt}/${MAX_RETRIES}):`, errorMessage);
        
        if (attempt < MAX_RETRIES) {
          // Wait longer between retries
          const waitTime = attempt * 5000;
          console.log(`Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }
    
    console.error(`Failed to scrape property details after ${MAX_RETRIES} attempts: ${url}`);
    return null;
  }

  async scrapeSpecificUrls(urls: string[]): Promise<void> {
    console.log(`Scraping ${urls.length} specific Top Lets URLs`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[${i + 1}/${urls.length}] Scraping ${url}`);

      try {
        // Extract property ID from URL
        const urlParts = url.split('/');
        const slug =
          urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2] || '';
        const externalId = `top-lets-${slug}`;

        // Check if property exists
        const existingProperty = await this.prisma.property.findFirst({
          where: {
            OR: [{ externalId }, { url }],
          },
        });

        if (existingProperty) {
          // Scrape the property details and update
          const propertyData = await this.scrapePropertyDetails(url);

          if (propertyData) {
            // Update the property
            await this.prisma.property.update({
              where: { id: existingProperty.id },
              data: {
                ...propertyData,
                updatedAt: new Date(),
              },
            });
            console.log(`  ✓ Updated property: ${propertyData.title}`);
          } else {
            console.log(`  ✗ Failed to scrape details for ${url}`);
          }
        } else {
          console.log(`  ✗ Property not found in database: ${url}`);
        }

        // Add delay between requests
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (error) {
        console.error(`  ✗ Error scraping ${url}:`, error);
      }
    }
  }
}
