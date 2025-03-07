import type { PrismaClient } from '@prisma/client';
import type { BaseScraper as BaseScraperType } from './BaseScraper';

const fetch = require('cross-fetch');
const cheerio = require('cheerio');
const { BaseScraper } = require('./BaseScraper');
const nodeCrypto = require('crypto');

class TopLetsScraper extends BaseScraper {
  private readonly baseUrl = 'https://www.top-lets.co.uk';
  private searchUrl = 'https://www.top-lets.co.uk/loughborough-student-houses/';

  constructor(prisma: any) {
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

    try {
      // Use a direct approach - fetch the main page once
      console.log(`Fetching main page: ${this.searchUrl}`);
      const response = await fetch(this.searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        timeout: 30000, // Longer timeout
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch main page: ${response.status}`);
      }

      const html = await response.text();
      console.log(`Received HTML length: ${html.length}`);

      const $ = cheerio.load(html);

      // Look specifically for the property cards based on the HTML structure you shared
      $('.col-md-3.has_4per_row.listing_wrapper, .property_listing').each(
        (_: any, card: any) => {
          const $card = $(card);

          // Find the property_listing div which contains the data-link attribute
          let propertyLink = '';
          let propertyListing = $card;

          // If this is a wrapper, find the property_listing inside it
          if ($card.hasClass('listing_wrapper')) {
            propertyListing = $card.find('.property_listing');
            propertyLink = propertyListing.attr('data-link');
          } else if ($card.hasClass('property_listing')) {
            propertyLink = $card.attr('data-link');
          }

          // If we couldn't find the link via data-link, try to find it via h4 a
          if (!propertyLink) {
            const titleLink = $card.find('h4 a');
            if (titleLink.length > 0) {
              propertyLink = titleLink.attr('href');
            }
          }

          // Skip if no property link found or if it's not a property page
          if (!propertyLink || !propertyLink.includes('/properties/')) {
            return;
          }

          // Extract title from h4
          const title = $card.find('h4').text().trim();

          // Extract price from listing_unit_price_wrapper
          const priceText = $card
            .find('.listing_unit_price_wrapper')
            .text()
            .trim();

          // Extract image from listing-unit-img-wrapper
          const imageUrl = $card
            .find('.listing-unit-img-wrapper img')
            .attr('src');

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
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Error fetching properties:`, errorMessage);
    }

    return allProperties;
  }

  private async processProperty(property: any): Promise<void> {
    try {
      console.log(`Processing property: ${property.title}`);

      // Fetch the property detail page with timeout and retry
      let response;
      let retries = 0;
      const maxRetries = 3;

      while (retries < maxRetries) {
        try {
          response = await fetch(property.link, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
              Accept:
                'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 20000,
          });
          break; // Success, exit retry loop
        } catch (error) {
          retries++;
          console.log(`Retry ${retries}/${maxRetries} for ${property.title}`);
          await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait before retry
        }
      }

      if (!response) {
        throw new Error(`Failed to fetch property after ${maxRetries} retries`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract property details
      const title = property.title;
      const location = 'Loughborough';
      const price = this.extractPrice(property.price);

      // Look for bedrooms and bathrooms in the property details section
      let bedrooms = 0;
      let bathrooms = 0;

      // Based on the HTML structure you shared, look for the listing_detail elements
      $('.listing_detail').each((_: any, detail: any) => {
        const detailText = $(detail).text().trim();
        console.log(`Found detail: ${detailText}`);

        // Check for bedrooms
        if (detailText.includes('Bedrooms:')) {
          const roomsMatch = detailText.match(/Bedrooms:\s*(\d+)/);
          if (roomsMatch && roomsMatch[1]) {
            bedrooms = parseInt(roomsMatch[1], 10);
            console.log(`Found ${bedrooms} bedrooms`);
          }
        }

        // Check for bathrooms
        if (detailText.includes('Bathrooms:')) {
          const bathMatch = detailText.match(/Bathrooms:\s*(\d+\.?\d*)/);
          if (bathMatch && bathMatch[1]) {
            bathrooms = parseFloat(bathMatch[1]);
            console.log(`Found ${bathrooms} bathrooms`);
          }
        }
      });

      // If we couldn't find bedrooms/bathrooms in the listing_detail, try the property details panel
      if (bedrooms === 0) {
        // Look for the property details in the panel-group property-panel
        $('.panel-group.property-panel').each((_: any, panel: any) => {
          const panelText = $(panel).text().trim();

          // Look for bedrooms
          const bedroomsMatch = panelText.match(/Bedrooms:\s*(\d+)/);
          if (bedroomsMatch && bedroomsMatch[1]) {
            bedrooms = parseInt(bedroomsMatch[1], 10);
            console.log(`Found ${bedrooms} bedrooms in panel`);
          }

          // Look for bathrooms
          const bathroomsMatch = panelText.match(/Bathrooms:\s*(\d+\.?\d*)/);
          if (bathroomsMatch && bathroomsMatch[1]) {
            bathrooms = parseFloat(bathroomsMatch[1]);
            console.log(`Found ${bathrooms} bathrooms in panel`);
          }
        });
      }

      // Extract description from the property description
      const description = $('.panel-body').text().trim();

      // Extract images from the property gallery/carousel
      const images: string[] = [];

      // Look for images in the slider
      $(
        'img.wp-post-image, .carousel-inner img, .gallery img, .property-gallery img, .slider img'
      ).each((_: any, img: any) => {
        const src = $(img).attr('src');
        if (
          src &&
          !src.includes('logo') &&
          !src.includes('icon') &&
          !images.includes(src)
        ) {
          console.log(`Found image: ${src}`);
          images.push(src);
        }
      });

      // If no images found, use the featured image
      if (images.length === 0 && property.imageUrl) {
        images.push(property.imageUrl);
      }

      console.log({
        title,
        location,
        price,
        bedrooms,
        bathrooms,
        imageCount: images.length,
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
        amenities: [],
      });

      console.log(`Successfully processed property: ${title}`);
    } catch (error) {
      console.error('Error processing property:', error);
    }
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

  async scrapeSpecificUrls(urls: string[]) {
    console.log(`Scraping ${urls.length} specific Top Lets URLs`);

    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      console.log(`[${i + 1}/${urls.length}] Scraping ${url}`);

      try {
        // Extract property ID from URL
        const urlParts = url.split('/');
        const slug =
          urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
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
                lastUpdated: new Date(),
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

module.exports = { TopLetsScraper };
