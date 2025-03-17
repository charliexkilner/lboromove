import { PrismaClient } from '@prisma/client';
import { getCampusProperties } from '../utils/campusProperties';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

// Define the CampusProperty interface to match the updated structure
interface CampusProperty {
  id?: number;
  title: string;
  url: string;
  imageUrl: string;
  images?: string[];  // Add the images array property
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  pricingOptions: string[];
  location: string;
  catering: string;
  bathroomType: string;
}

const execPromise = promisify(exec);
const prisma = new PrismaClient();

async function migrateCampusProperties() {
  try {
    console.log('Starting campus properties migration...');
    
    // Run Prisma migration to update the schema
    console.log('Running Prisma migration...');
    try {
      await execPromise('npx prisma migrate dev --name add_campus_property_fields');
      console.log('Prisma migration completed successfully');
    } catch (error) {
      console.error('Error running Prisma migration:', error);
      console.log('Continuing with migration script...');
    }
    
    // Get campus properties from JSON file
    const campusProperties = getCampusProperties();
    console.log(`Found ${campusProperties.length} campus properties to migrate`);
    
    if (campusProperties.length === 0) {
      console.log('No campus properties found. Run the scrape-campus-properties.ts script first.');
      return;
    }
    
    // Import each property into the Property table
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const property of campusProperties) {
      // Skip properties with missing required data
      if (!property.title || !property.minPrice) {
        console.log(`Skipping property with missing data: ${property.title || 'Unknown'}`);
        continue;
      }
      
      // Format price range with rounded values
      const minPrice = Math.floor(property.minPrice || 0);
      const maxPrice = Math.ceil(property.maxPrice || minPrice);
      const formattedPriceRange = `£${minPrice}-${maxPrice} per week`;
      
      // Check if property already exists by title and location
      const existingProperty = await prisma.property.findFirst({
        where: {
          title: property.title,
          location: { contains: property.location || '' },
          keyFeatures: {
            path: ['isCampusProperty'],
            equals: true
          }
        },
      });
      
      // Create keyFeatures object with campus property data
      const keyFeatures = {
        isCampusProperty: true,
        priceRange: formattedPriceRange,
        pricingOptions: property.pricingOptions || [],
        catering: property.catering || 'Not specified',
        bathroomType: property.bathroomType || 'Not specified',
        maxPrice: maxPrice
      };
      
      if (existingProperty) {
        // Update existing property
        await prisma.property.update({
          where: {
            id: existingProperty.id,
          },
          data: {
            title: property.title,
            url: property.url || '',
            images: property.images && property.images.length > 0 ? property.images : (property.imageUrl ? [property.imageUrl] : []),
            price: minPrice,
            location: `Loughborough University Campus - ${property.location || ''}`,
            rooms: 1, // Default to 1 room for campus properties
            bathrooms: 1, // Default to 1 bathroom for campus properties
            amenities: [`On Campus`, `University Accommodation`, property.catering || 'Not specified', property.bathroomType || 'Not specified'],
            keyFeatures: keyFeatures,
            updatedAt: new Date(),
          },
        });
        updatedCount++;
        console.log(`Updated campus property: ${property.title}`);
      } else {
        // Create a unique hash for the property
        const hash = `campus-${property.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now()}`;
        
        // Create new property
        await prisma.property.create({
          data: {
            title: property.title,
            url: property.url || '',
            images: property.images && property.images.length > 0 ? property.images : (property.imageUrl ? [property.imageUrl] : []),
            price: minPrice,
            location: `Loughborough University Campus - ${property.location || ''}`,
            rooms: 1, // Default to 1 room for campus properties
            bathrooms: 1, // Default to 1 bathroom for campus properties
            amenities: [`On Campus`, `University Accommodation`, property.catering || 'Not specified', property.bathroomType || 'Not specified'],
            scrapedFrom: 'lboro-university',
            externalId: `campus-${property.id || Date.now()}`,
            hash: hash,
            description: `${property.title} - ${property.catering || 'Not specified'} - ${property.bathroomType || 'Not specified'}`,
            isNearCampus: true,
            distanceToCampus: 0,
            source: 'lboro-university',
            keyFeatures: keyFeatures,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        importedCount++;
        console.log(`Imported campus property: ${property.title}`);
      }
    }
    
    console.log(`Migration complete. Imported ${importedCount} new properties and updated ${updatedCount} existing properties.`);
  } catch (error) {
    console.error('Error migrating campus properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration function
migrateCampusProperties()
  .then(() => console.log('Done'))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 