import { BaseScraper } from './BaseScraper';
import { PrismaClient } from '@prisma/client';
import fetch from 'cross-fetch';
import * as cheerio from 'cheerio';
import { getCoordinatesFromAddress } from '../utils/geocoding';

export class StudentBeehiveScraper extends BaseScraper {
  private readonly baseUrl = 'https://studentbeehive.co.uk';
  private readonly propertyListUrl = 'https://studentbeehive.co.uk/locations/student-accommodation-loughborough';

  constructor(prisma: PrismaClient) {
    super(prisma, 'studentbeehive');
  }

  private extractPrice(priceText: string): number {
    // Extract the first number from price ranges like "£220-£234" or single prices like "£220"
    const match = priceText.match(/£(\d+)/);
    if (match && match[1]) {
      return parseInt(match[1], 10);
    }
    return 0;
  }

  private async fetchPropertyDetails(url: string): Promise<any> {
    try {
      const response = await fetch(url);
      const html = await response.text();
      const $ = cheerio.load(html);

      // Extract images from the gallery
      const images: string[] = [];
      $('.uk-slideshow-items img').each((_, img) => {
        const src = $(img).attr('src');
        if (src) {
          images.push(src.startsWith('http') ? src : `${this.baseUrl}${src}`);
        }
      });

      // Extract address - look specifically for the address panel
      let address = '';
      $('.el-content.uk-panel').each((_, el) => {
        const text = $(el).text().trim();
        if (text.includes('Loughborough') && !text.includes('University') && text.length < 100) {
          address = text;
        }
      });

      console.log('Found address:', address);

      // Get coordinates from address
      const coordinates = await getCoordinatesFromAddress(address);

      return {
        images,
        address,
        latitude: coordinates?.lat,
        longitude: coordinates?.lng
      };
    } catch (error) {
      console.error(`Error fetching property details: ${error}`);
      return null;
    }
  }

  public async scrape(): Promise<void> {
    try {
      console.log('Starting Student Beehive property scraping...');

      const response = await fetch(this.propertyListUrl);
      const html = await response.text();
      const $ = cheerio.load(html);

      // Look for property cards using both data-tag and class selectors
      const propertyCards = $('[data-tag="Studio-Flats"], [data-tag="Ensuite-Rooms"], [data-tag="Studios"], [data-tag="One-Bed-Flats"], [data-tag="Two-Bed-Flats"]').filter(function(this: cheerio.Element) {
        const card = $(this);
        // Filter out cards that don't have a title or price button
        return card.find('h3').length > 0 && card.find('.uk-button').length > 0;
      });

      console.log(`Found ${propertyCards.length} property cards`);

      const processedTitles = new Set(); // To avoid duplicates

      for (let i = 0; i < propertyCards.length; i++) {
        const card = propertyCards[i];
        const $card = $(card);

        // Extract property title
        const title = $card.find('h3').text().trim();
        if (!title || processedTitles.has(title)) {
          console.log('Skipping card - no title found or duplicate');
          continue;
        }
        processedTitles.add(title);
        console.log(`Processing property: ${title}`);

        // Extract price
        const priceText = $card.find('.uk-button').text().trim();
        const price = this.extractPrice(priceText);
        console.log(`Found price: £${price}`);

        // Extract property URL
        const relativeUrl = $card.find('a').attr('href');
        const propertyUrl = relativeUrl ? (relativeUrl.startsWith('http') ? relativeUrl : `${this.baseUrl}${relativeUrl}`) : '';

        if (!propertyUrl) {
          console.log('Skipping card - no URL found');
          continue;
        }
        console.log(`Found URL: ${propertyUrl}`);

        // Fetch additional details from property page
        const details = await this.fetchPropertyDetails(propertyUrl);

        if (!details || !details.address) {
          console.log('Skipping card - no details or address found');
          continue;
        }

        // Extract amenities from the property card
        const amenities: string[] = [];
        $card.find('li').each((_, li) => {
          const amenity = $(li).text().trim();
          if (amenity && !amenity.includes('£')) amenities.push(amenity);
        });
        console.log(`Found ${amenities.length} amenities`);

        const property = {
          title,
          price,
          rooms: 1, // All Student Beehive properties are single rooms
          bathrooms: 1,
          images: details.images,
          description: amenities.join(', '),
          location: details.address,
          amenities,
          latitude: details.latitude,
          longitude: details.longitude,
          url: propertyUrl,
          externalId: `studentbeehive-${i}`,
          emoji: '🐝', // Add bee emoji for Student Beehive properties
        };

        await this.upsertProperty(property);
        console.log(`Successfully scraped property: ${title}`);

        // Add a small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      await this.logScraping('success', `Successfully scraped ${processedTitles.size} properties`);

    } catch (error) {
      console.error('Error scraping Student Beehive properties:', error);
      await this.logScraping('error', `Error: ${error}`);
    }
  }
} 