import fs from 'fs';
import path from 'path';
import { Property, PrismaClient } from '@prisma/client';
import { Prisma } from '@prisma/client';

// Initialize Prisma client
let prisma: PrismaClient | undefined;

// Get Prisma client (singleton pattern)
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient();
  }
  return prisma;
}

export interface CampusProperty {
  id?: number;
  title: string;
  url: string;
  imageUrl: string;
  images?: string[];
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  pricingOptions: string[];
  location: string;
  catering: string;
  bathroomType: string;
}

/**
 * Convert campus properties to the Property format used by the application
 */
export function convertCampusPropertiesToPropertyFormat(campusProperties: CampusProperty[]): Partial<Property>[] {
  return campusProperties.map((campusProperty, index) => {
    // Create a unique ID for each campus property
    const id = campusProperty.id || (10000 + index);
    
    // Extract min price from the price range
    const minPrice = campusProperty.minPrice || 0;
    
    // Use the images array if available, otherwise fall back to the single imageUrl
    const images = campusProperty.images && campusProperty.images.length > 0 
      ? campusProperty.images 
      : (campusProperty.imageUrl ? [campusProperty.imageUrl] : []);
    
    // Create a property object that matches the Property type
    return {
      id,
      title: campusProperty.title,
      description: `${campusProperty.title} - ${campusProperty.catering} - ${campusProperty.bathroomType}`,
      price: minPrice,
      rooms: 1, // Default to 1 room for campus properties
      bathrooms: 1, // Default to 1 bathroom for campus properties
      images: images,
      amenities: [`On Campus`, `University Accommodation`, campusProperty.catering, campusProperty.bathroomType],
      location: `Loughborough University Campus - ${campusProperty.location}`,
      scrapedFrom: 'lboro-university',
      hash: `campus-${id}`,
      latitude: null,
      longitude: null,
      street: campusProperty.location,
      city: 'Loughborough',
      postcode: null,
      isGoldenTriangle: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      externalId: `campus-${id}`,
      url: campusProperty.url,
      keyFeatures: {
        priceRange: campusProperty.priceRange,
        pricingOptions: campusProperty.pricingOptions,
        catering: campusProperty.catering,
        bathroomType: campusProperty.bathroomType,
        isCampusProperty: true
      } as Prisma.JsonValue,
      isNearCampus: true,
      distanceToCampus: 0,
      source: 'lboro-university',
    };
  });
}

/**
 * Get campus properties from the JSON file
 */
export function getCampusProperties(): CampusProperty[] {
  try {
    const filePath = path.join(process.cwd(), 'data', 'campus-properties.json');
    
    if (!fs.existsSync(filePath)) {
      console.warn('Campus properties file not found:', filePath);
      return [];
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const properties = JSON.parse(fileContent) as CampusProperty[];
    
    return properties;
  } catch (error) {
    console.error('Error loading campus properties:', error);
    return [];
  }
}

/**
 * Get campus properties from the database
 */
export async function getCampusPropertiesFromDB(): Promise<CampusProperty[]> {
  try {
    const client = getPrismaClient();
    
    // Check if the CampusProperty model exists in the Prisma client
    if ('campusProperty' in client) {
      // @ts-ignore - We've already checked that campusProperty exists
      const campusProperties = await client.campusProperty.findMany();
      return campusProperties;
    } else {
      console.warn('CampusProperty model not found in Prisma client, falling back to JSON file');
      return getCampusProperties();
    }
  } catch (error) {
    console.error('Error fetching campus properties from database:', error);
    // Fallback to JSON file if database query fails
    return getCampusProperties();
  }
}

/**
 * Get campus properties in Property format
 * This function can be used on the server side
 */
export async function getCampusPropertiesAsPropertiesFromDB(): Promise<Partial<Property>[]> {
  const campusProperties = await getCampusPropertiesFromDB();
  return convertCampusPropertiesToPropertyFormat(campusProperties);
}

/**
 * Get campus properties in Property format
 * This function is used for client-side rendering
 */
export function getCampusPropertiesAsProperties(): Partial<Property>[] {
  const campusProperties = getCampusProperties();
  return convertCampusPropertiesToPropertyFormat(campusProperties);
}

/**
 * Get campus properties with keyFeatures formatted for the UI
 */
export function getCampusPropertiesWithKeyFeatures() {
  const properties = getCampusProperties();
  
  return properties.map(property => {
    // Skip properties with missing required data
    if (!property.title || !property.minPrice) {
      return null;
    }
    
    // Format price range with rounded values
    const minPrice = Math.floor(property.minPrice);
    const maxPrice = Math.ceil(property.maxPrice || minPrice);
    
    // Create keyFeatures object with campus property data
    const keyFeatures = {
      isCampusProperty: true,
      priceRange: property.priceRange,
      pricingOptions: property.pricingOptions || [],
      catering: property.catering || 'Not specified',
      bathroomType: property.bathroomType || 'Not specified',
      maxPrice: maxPrice
    };
    
    return {
      id: `campus-${property.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      title: property.title,
      url: property.url || '',
      images: property.imageUrl ? [property.imageUrl] : [],
      price: minPrice,
      location: `Loughborough University Campus - ${property.location || ''}`,
      rooms: 1, // Default to 1 room for campus properties
      bathrooms: 1, // Default to 1 bathroom for campus properties
      amenities: [`On Campus`, `University Accommodation`, property.catering || 'Not specified', property.bathroomType || 'Not specified'],
      keyFeatures,
      isNearCampus: true,
      distanceToCampus: 0,
      source: 'lboro-university',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }).filter(Boolean);
} 