const { PrismaClient } = require('@prisma/client');
const fetch = require('cross-fetch');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

// Configuration
const MAX_PROPERTIES = 100;
const PROGRESS_FILE = 'scraper-progress.json';
const PROCESSED_URLS_FILE = 'processed-urls.json';

// Delete existing progress files to start fresh
if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
if (fs.existsSync(PROCESSED_URLS_FILE)) fs.unlinkSync(PROCESSED_URLS_FILE);

async function main() {
  const prisma = new PrismaClient();
  const baseUrl = 'https://www.top-lets.co.uk';
  
  // Define pages for 1-8 bedrooms, prioritizing 1-4 bedrooms
  const bedroomPages = [
    { url: '/listings/1-bed-apartments/', bedrooms: 1 },
    { url: '/listings/2-bed-apartments/', bedrooms: 2 },
    { url: '/listings/3-bed-houses/', bedrooms: 3 },
    { url: '/listings/4-bed-houses/', bedrooms: 4 },
    { url: '/listings/5-bed-houses/', bedrooms: 5 },
    { url: '/listings/6-bed-houses/', bedrooms: 6 },
    { url: '/listings/7-bed-houses/', bedrooms: 7 },
    { url: '/listings/8-bed-houses/', bedrooms: 8 }
  ];

  try {
    console.log('Starting Top Lets scraper (limited to 100 properties)...');
    console.log('Starting fresh - previous progress cleared');
    
    let processedUrls = new Set();
    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalFailed = 0;
    
    // Process each bedroom category until we reach MAX_PROPERTIES
    for (let i = 0; i < bedroomPages.length && totalProcessed < MAX_PROPERTIES; i++) {
      const page = bedroomPages[i];
      console.log(`\n=== Processing ${page.bedrooms} bedroom properties ===`);
      const pageUrl = `${baseUrl}${page.url}`;
      console.log(`Fetching: ${pageUrl}`);

      try {
        const properties = await fetchPropertiesFromPage(baseUrl, pageUrl, page.bedrooms);
        console.log(`Found ${properties.length} properties on page`);
        
        if (properties.length === 0) {
          console.log('No properties found, skipping to next bedroom category');
          continue;
        }

        // Process properties one at a time
        for (const property of properties) {
          // Skip if we've reached the limit
          if (totalProcessed >= MAX_PROPERTIES) {
            console.log('Reached maximum property limit of 100');
            break;
          }

          // Skip if we've already processed this URL
          if (processedUrls.has(property.link)) {
            console.log(`Skipping duplicate property: ${property.title}`);
            continue;
          }

          console.log(`\nProcessing property ${totalProcessed + 1}: ${property.title}`);
          
          try {
            await processProperty(prisma, baseUrl, { ...property, rooms: page.bedrooms });
            totalSuccess++;
            processedUrls.add(property.link);
            console.log(`✅ Successfully processed: ${property.title}`);
          } catch (error) {
            totalFailed++;
            console.error(`❌ Failed to process property: ${property.title}`);
            console.error('Error:', error.message);
          }

          totalProcessed++;
          
          // Save progress after each property
          saveProgress(i, totalProcessed, totalSuccess, totalFailed);
          saveProcessedUrls(processedUrls);

          // Delay between properties
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
        
      } catch (error) {
        console.error(`Error processing ${page.bedrooms} bedroom page:`, error);
        saveProgress(i, totalProcessed, totalSuccess, totalFailed);
      }
    }

    console.log('\n=== Scraping Summary ===');
    console.log(`Total properties processed: ${totalProcessed}`);
    console.log(`Successfully processed: ${totalSuccess}`);
    console.log(`Failed to process: ${totalFailed}`);

    // Clear progress files on successful completion
    if (fs.existsSync(PROGRESS_FILE)) fs.unlinkSync(PROGRESS_FILE);
    if (fs.existsSync(PROCESSED_URLS_FILE)) fs.unlinkSync(PROCESSED_URLS_FILE);
    console.log('Scraping completed successfully, progress files cleared');

  } catch (error) {
    console.error('Error in Top Lets scraper:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function loadProcessedUrls() {
  try {
    if (fs.existsSync(PROCESSED_URLS_FILE)) {
      const data = fs.readFileSync(PROCESSED_URLS_FILE, 'utf8');
      return new Set(JSON.parse(data));
    }
  } catch (error) {
    console.error('Error loading processed URLs file:', error);
  }
  return new Set();
}

function saveProcessedUrls(urls) {
  try {
    fs.writeFileSync(PROCESSED_URLS_FILE, JSON.stringify(Array.from(urls), null, 2));
  } catch (error) {
    console.error('Error saving processed URLs:', error);
  }
}

function loadProgress() {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = fs.readFileSync(PROGRESS_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading progress file:', error);
  }
  return {};
}

function saveProgress(bedroomIndex, totalProcessed, totalSuccess, totalFailed) {
  try {
    const progress = {
      lastBedroomIndex: bedroomIndex,
      totalProcessed,
      totalSuccess,
      totalFailed,
      lastUpdate: new Date().toISOString()
    };
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify(progress, null, 2));
  } catch (error) {
    console.error('Error saving progress:', error);
  }
}

async function fetchPropertiesFromPage(baseUrl, pageUrl, bedrooms) {
  console.log(`Fetching properties from: ${pageUrl}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    const response = await fetch(pageUrl, {
      headers: getHeaders(),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.status}`);
    }

    const html = await response.text();
    console.log(`Received HTML length: ${html.length}`);
    
    if (html.length < 1000) {
      throw new Error('Received incomplete HTML');
    }

    const $ = cheerio.load(html);
    const properties = [];

    // Find all property listings on the page
    $('.property_listing, .listing_wrapper').each((_, card) => {
      const $card = $(card);
      
      // Extract property link
      let propertyLink = $card.attr('data-link') || 
                        $card.find('h4 a').attr('href') || 
                        $card.find('.title_unit a').attr('href');

      if (!propertyLink) {
        console.log('Skipping property - no link found');
        return;
      }

      // Make link absolute
      if (!propertyLink.startsWith('http')) {
        propertyLink = baseUrl + propertyLink;
      }

      // Extract title
      const title = $card.find('h4, .title_unit').first().text().trim();

      // Extract price
      const priceText = $card.find('.listing_unit_price_wrapper, .price_unit').first().text().trim();

      // Extract image
      let imageUrl = $card.find('img.lazyload').attr('data-src') || 
                    $card.find('img').attr('src');

      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = baseUrl + imageUrl;
      }

      console.log(`Found property: ${title} (${priceText})`);
      
      properties.push({
        id: propertyLink,
        title,
        link: propertyLink,
        price: priceText,
        imageUrl,
        rooms: bedrooms
      });
    });

    console.log(`Total properties found on page: ${properties.length}`);
    return properties;
  } catch (error) {
    console.error(`Error fetching properties from page:`, error);
    return [];
  }
}

function getHeaders() {
  return {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Referer': 'https://www.google.com/',
  };
}

async function processProperty(prisma, baseUrl, property) {
  const MAX_RETRIES = 2;
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Processing property (attempt ${attempt}/${MAX_RETRIES}): ${property.title}`);
      
      const randomDelay = Math.floor(Math.random() * 500) + 500;
      await new Promise(resolve => setTimeout(resolve, randomDelay));
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(property.link, {
        headers: getHeaders(),
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

      // Extract property details
      const details = {
        title: property.title || $('h1.entry-title').text().trim(),
        location: $('.property_address_container').text().trim() || $('.property_address').text().trim() || 'Loughborough',
        price: extractPrice(property.price),
        rooms: property.rooms || extractBedrooms($) || 1,
        bathrooms: extractBathrooms($) || 1,
        description: $('.wpestate_property_description p').text().trim() || $('.property_content').text().trim(),
        images: extractImages($, property.imageUrl),
        amenities: extractAmenities($)
      };

      // Generate a hash for the property based on its details
      const hash = generateHash(details);

      // Extract street from location or title
      const street = extractStreet(details.location) || extractStreet(details.title) || '';
      
      // Check if property is in the Golden Triangle
      const isGoldenTriangle = isInGoldenTriangle(street, details.description);

      // Generate an externalId from the property URL
      const externalId = `toplets-${hash}`;

      // Save property to database
      await prisma.property.upsert({
        where: {
          hash: hash // Using hash as the unique identifier
        },
        update: {
          title: details.title,
          location: details.location,
          price: details.price,
          rooms: details.rooms,
          bathrooms: details.bathrooms,
          description: details.description,
          images: details.images,
          amenities: details.amenities,
          url: property.link,
          updatedAt: new Date(),
          hash: hash,
          externalId: externalId,
          scrapedFrom: 'TOPLETS',
          street: street,
          isGoldenTriangle: isGoldenTriangle,
          source: 'TopLets',
          priceRange: getPriceRange(details.price),
          maxPrice: details.price
        },
        create: {
          title: details.title,
          location: details.location,
          price: details.price,
          rooms: details.rooms,
          bathrooms: details.bathrooms,
          description: details.description,
          images: details.images,
          amenities: details.amenities,
          url: property.link,
          createdAt: new Date(),
          updatedAt: new Date(),
          hash: hash,
          externalId: externalId,
          scrapedFrom: 'TOPLETS',
          street: street,
          isGoldenTriangle: isGoldenTriangle,
          source: 'TopLets',
          priceRange: getPriceRange(details.price),
          maxPrice: details.price
        },
      });

      console.log(`Successfully processed property: ${details.title}`);
      return;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error processing property (attempt ${attempt}/${MAX_RETRIES}):`, errorMessage);
      
      if (attempt < MAX_RETRIES) {
        const waitTime = attempt * 2000;
        console.log(`Waiting ${waitTime}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  
  console.error(`Failed to process property after ${MAX_RETRIES} attempts: ${property.title}`);
}

// Helper function to extract street name
function extractStreet(text) {
  if (!text) return null;
  const streetMatch = text.match(/\d+\s+([A-Za-z\s]+(?:Street|Road|Avenue|Lane|Close|Way|Drive|Place|Gardens|Grove|Court|Crescent))/i);
  return streetMatch ? streetMatch[0] : null;
}

// Helper function to check if property is in Golden Triangle
function isInGoldenTriangle(street, description) {
  const goldenTriangleStreets = [
    'Leopold Street',
    'Frederick Street',
    'William Street',
    'York Road',
    'Ashby Road',
    'Forest Road',
    // Add more Golden Triangle streets as needed
  ];

  // Check if street is in Golden Triangle
  if (street && goldenTriangleStreets.some(s => street.toLowerCase().includes(s.toLowerCase()))) {
    return true;
  }

  // Check description for Golden Triangle mentions
  if (description && (
    description.toLowerCase().includes('golden triangle') ||
    description.toLowerCase().includes('student triangle')
  )) {
    return true;
  }

  return false;
}

// Helper function to get price range
function getPriceRange(price) {
  if (!price) return null;
  if (price < 80) return '< £80 pw';
  if (price < 100) return '£80-100 pw';
  if (price < 120) return '£100-120 pw';
  if (price < 140) return '£120-140 pw';
  return '£140+ pw';
}

// Add hash generation function
function generateHash(details) {
  const str = `${details.title}-${details.location}-${details.price}-${details.rooms}-${details.bathrooms}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString();
}

// Helper functions for property extraction
function extractPrice(priceText) {
  const priceMatch = priceText.match(/£?\s*(\d+)/);
  return priceMatch && priceMatch[1] ? parseInt(priceMatch[1], 10) : 0;
}

function extractBedrooms($) {
  let bedrooms = 0;
  $('.property_bedrooms, .feature_wrapper').each((_, element) => {
    const text = $(element).text().trim();
    if (text.includes('bed') || text.includes('Bed')) {
      const match = text.match(/(\d+)\s*(?:bed|Bed)/);
      if (match && match[1]) bedrooms = parseInt(match[1], 10);
    }
  });
  return bedrooms;
}

function extractBathrooms($) {
  let bathrooms = 0;
  $('.property_bathrooms, .feature_wrapper').each((_, element) => {
    const text = $(element).text().trim();
    if (text.includes('bath') || text.includes('Bath')) {
      const match = text.match(/(\d+)\s*(?:bath|Bath)/);
      if (match && match[1]) bathrooms = parseInt(match[1], 10);
    }
  });
  return bathrooms;
}

function extractImages($, fallbackImage) {
  const images = new Set();
  
  $('.carousel-inner img, .property_image img, .gallery_wrapper img').each((_, element) => {
    const src = $(element).attr('src') || $(element).attr('data-src');
    if (src && !src.includes('transparent.png')) images.add(src);
  });
  
  if (images.size === 0) {
    $('img.lazyload').each((_, element) => {
      const src = $(element).attr('data-src') || $(element).attr('src');
      if (src && !src.includes('transparent.png')) images.add(src);
    });
  }
  
  if (images.size === 0 && fallbackImage) {
    images.add(fallbackImage);
  }
  
  return Array.from(images);
}

function extractAmenities($) {
  const amenities = new Set();
  $('.feature_wrapper, .listing_detail').each((_, element) => {
    const text = $(element).text().trim();
    if (text) amenities.add(text);
  });
  return Array.from(amenities);
}

main(); 