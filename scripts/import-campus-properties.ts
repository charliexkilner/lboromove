import { PrismaClient } from '@prisma/client';
import { getCampusProperties } from '../utils/campusProperties';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function importCampusProperties() {
  try {
    console.log('Starting campus properties import...');
    
    // Get campus properties from JSON file
    const campusProperties = getCampusProperties();
    console.log(`Found ${campusProperties.length} campus properties to import`);
    
    if (campusProperties.length === 0) {
      console.log('No campus properties found. Run the scrape-campus-properties.ts script first.');
      return;
    }
    
    // Import each property into the CampusProperty table
    let importedCount = 0;
    let updatedCount = 0;
    
    for (const property of campusProperties) {
      // Check if property already exists by title
      const existingProperty = await prisma.campusProperty.findFirst({
        where: {
          title: property.title,
        },
      });
      
      if (existingProperty) {
        // Update existing property
        await prisma.campusProperty.update({
          where: {
            id: existingProperty.id,
          },
          data: {
            title: property.title,
            url: property.url,
            imageUrl: property.imageUrl,
            priceRange: property.priceRange,
            minPrice: property.minPrice,
            maxPrice: property.maxPrice,
            pricingOptions: property.pricingOptions,
            location: property.location,
            catering: property.catering,
            bathroomType: property.bathroomType,
            updatedAt: new Date(),
          },
        });
        updatedCount++;
        console.log(`Updated campus property: ${property.title}`);
      } else {
        // Create new property
        await prisma.campusProperty.create({
          data: {
            title: property.title,
            url: property.url,
            imageUrl: property.imageUrl,
            priceRange: property.priceRange,
            minPrice: property.minPrice,
            maxPrice: property.maxPrice,
            pricingOptions: property.pricingOptions,
            location: property.location,
            catering: property.catering,
            bathroomType: property.bathroomType,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        importedCount++;
        console.log(`Imported campus property: ${property.title}`);
      }
    }
    
    console.log(`Import complete. Imported ${importedCount} new properties and updated ${updatedCount} existing properties.`);
  } catch (error) {
    console.error('Error importing campus properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the import function
importCampusProperties()
  .then(() => console.log('Done'))
  .catch((error) => {
    console.error('Import failed:', error);
    process.exit(1);
  }); 