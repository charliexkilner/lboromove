import { PrismaClient } from '@prisma/client';
import { BaseScraper } from './BaseScraper';
import fetch from 'cross-fetch';
import * as cheerio from 'cheerio';
import * as crypto from 'crypto';

class TopLetsScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.top-lets.co.uk';
  private searchUrl = 'https://www.top-lets.co.uk/loughborough-student-houses/';

  constructor(prisma: PrismaClient) {
    super(prisma, 'TopLets');
  }

  async scrape(): Promise<void> {
    console.log('Starting Top Lets scraper...');

    try {
      // Get all properties using HTML scraping
      const properties = await this.fetchProperties();
      console.log(`Found ${properties.length} properties`);

      // Track processed properties to avoid duplicates
      const processedLinks = new Set();

      // Process each property
      for (const property of properties) {
        try {
          // Skip if already processed
          if (processedLinks.has(property.link)) {
            console.log(`Skipping duplicate property: ${property.title}`);
            continue;
          }

          processedLinks.add(property.link);

          await this.processProperty(property);
          // Add delay to avoid overloading the server
          await new Promise((resolve) => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`Error processing property:`, error);
        }
      }
    } catch (error) {
      console.error('Error in Top Lets scraper:', error);
    }
  }

  private async fetchProperties(): Promise<any[]> {
    console.log('Fetching properties from Top Lets...');
    const allProperties: any[] = [];
    const MAX_RETRIES = 3;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        // Use a direct approach - fetch the main page
        console.log(`Fetching main page (attempt ${attempt}/${MAX_RETRIES}): ${this.searchUrl}`);
        
        // Use AbortController for timeout (90 seconds for more time)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 90000);
        
        // Add a random delay before fetch to mimic more human-like behavior
        const randomDelay = Math.floor(Math.random() * 2000) + 1000; // 1-3 seconds
        await new Promise(resolve => setTimeout(resolve, randomDelay));
        
        const response = await fetch(this.searchUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            // Add a referer to make the request look more legitimate
            'Referer': 'https://www.google.com/',
          },
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`Failed to fetch main page: ${response.status}`);
        }

        const html = await response.text();
        console.log(`Received HTML length: ${html.length}`);

        if (html.length < 1000) {
          throw new Error('Received incomplete HTML, likely got redirected or blocked');
        }

        const $ = cheerio.load(html);

        // Look specifically for the property cards based on the HTML structure
        $('.col-md-3.has_4per_row.listing_wrapper, .property_listing').each(
          (_: any, card: any) => {
            const $card = $(card);

            // Find the property_listing div which contains the data-link attribute
            let propertyLink = '';
            let propertyListing = $card;

            // If this is a wrapper, find the property_listing inside it
            if ($card.hasClass('listing_wrapper')) {
              propertyListing = $card.find('.property_listing');
              propertyLink = propertyListing.attr('data-link') || '';
            } else if ($card.hasClass('property_listing')) {
              propertyLink = $card.attr('data-link') || '';
            }

            // If we couldn't find the link via data-link, try to find it via h4 a
            if (!propertyLink) {
              const titleLink = $card.find('h4 a');
              if (titleLink.length > 0) {
                propertyLink = titleLink.attr('href') || '';
              }
            }

            // Also check for .title_unit a as a backup
            if (!propertyLink) {
              const titleLink = $card.find('.title_unit a');
              if (titleLink.length > 0) {
                propertyLink = titleLink.attr('href') || '';
              }
            }

            // Skip if no property link found or if it's not a property page
            if (!propertyLink || !propertyLink.includes('/properties/')) {
              return;
            }

            // Make sure the link is absolute
            if (!propertyLink.startsWith('http')) {
              propertyLink = this.baseUrl + propertyLink;
            }

            // Extract title from h4 or title_unit
            let title = $card.find('h4').text().trim();
            if (!title) {
              title = $card.find('.title_unit').text().trim();
            }

            // Extract price from listing_unit_price_wrapper or price_unit
            let priceText = $card
              .find('.listing_unit_price_wrapper')
              .text()
              .trim();
              
            if (!priceText) {
              priceText = $card.find('.price_unit').text().trim();
            }

            // Extract image from listing-unit-img-wrapper or lazyload
            let imageUrl = $card
              .find('.listing-unit-img-wrapper img, .lazyload')
              .attr('src');
              
            // Try data-src if src is not available (lazyloaded images)
            if (!imageUrl) {
              imageUrl = $card
                .find('.listing-unit-img-wrapper img, .lazyload')
                .attr('data-src');
            }

            console.log(`Found property: ${title}, link: ${propertyLink}`);

            allProperties.push({
              id: propertyLink,
              title,
              link: propertyLink,
              price: priceText,
              imageUrl,
            });
          }
        );

        console.log(`Total properties found: ${allProperties.length}`);
        
        // If we found properties, we're done
        if (allProperties.length > 0) {
          return allProperties;
        }
        
        // If we didn't find any properties but the request was successful,
        // wait a bit and retry with a different approach
        console.log('No properties found but request was successful. Waiting before retry...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error(`Error fetching properties (attempt ${attempt}/${MAX_RETRIES}):`, errorMessage);
        
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

    console.log(`Giving up after ${MAX_RETRIES} attempts. Returning ${allProperties.length} properties found.`);
    return allProperties;
  }

  private async processProperty(property: any): Promise<void> {
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
        
        const response = await fetch(property.link, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            // Add a referer to make the request look more legitimate
            'Referer': 'https://www.google.com/',
          },
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
        let bedrooms = 0;
        $('.property_bedrooms, .feature_wrapper').each((_, element) => {
          const text = $(element).text().trim();
          if (text.includes('bed') || text.includes('Bed')) {
            const bedroomMatch = text.match(/(\d+)\s*(?:bed|Bed)/);
            if (bedroomMatch && bedroomMatch[1]) {
              bedrooms = parseInt(bedroomMatch[1], 10);
            }
          }
        });

        // Extract bathrooms
        let bathrooms = 0;
        $('.property_bathrooms, .feature_wrapper').each((_, element) => {
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
        $('.carousel-inner img, .property_image img, .gallery_wrapper img').each((_, element) => {
          const src = $(element).attr('src') || $(element).attr('data-src');
          if (src && !src.includes('transparent.png')) {
            console.log(`Found image: ${src}`);
            images.push(src);
          }
        });

        // Try alternative image selectors if none found
        if (images.length === 0) {
          $('img.lazyload').each((_, element) => {
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
        $('.feature_wrapper, .listing_detail').each((_, element) => {
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

  private async scrapePropertyDetails(url: string): Promise<any | null> {
    const MAX_RETRIES = 3;
    
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Scraping details for ${url} (attempt ${attempt}/${MAX_RETRIES})`);
        
        // Use AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000);
        
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
            Accept:
              'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
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
        return {
          title: $('h1.entry-title').text().trim(),
          location: $('.property_address_container').text().trim(),
          html: html // Return the full HTML for further processing
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

  async scrapeSpecificUrls(urls: string[]) {
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
            // Update only the images
            await this.prisma.property.update({
              where: { id: existingProperty.id },
              data: {
                images: propertyData.images,
                updatedAt: new Date(),
              },
            });
            console.log(`  ✓ Updated images for ${existingProperty.title}`);
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

export { TopLetsScraper };
