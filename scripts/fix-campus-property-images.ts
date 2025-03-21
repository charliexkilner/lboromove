// Fix campus property images
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define interface for JSON property
interface CampusProperty {
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

const prisma = new PrismaClient();

async function fixCampusPropertyImages() {
  try {
    console.log('Starting campus property images fix...');
    
    // Read campus properties from JSON file
    const filePath = path.join(process.cwd(), 'data', 'campus-properties.json');
    
    if (!fs.existsSync(filePath)) {
      console.log('Campus properties JSON file not found');
      return;
    }
    
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const campusProperties = JSON.parse(fileContents) as CampusProperty[];
    
    console.log(`Found ${campusProperties.length} campus properties in JSON file`);
    
    if (campusProperties.length === 0) {
      console.log('No campus properties found in JSON file');
      return;
    }
    
    // Get all campus properties from the database
    const dbCampusProperties = await prisma.property.findMany({
      where: {
        keyFeatures: {
          path: ['isCampusProperty'],
          equals: true
        }
      }
    });
    
    console.log(`Found ${dbCampusProperties.length} campus properties in database`);
    
    let updatedCount = 0;
    
    // Update each property in the database with images from the JSON file
    for (const dbProperty of dbCampusProperties) {
      // Find matching property in JSON file
      const jsonProperty = campusProperties.find((p: CampusProperty) => p.title === dbProperty.title);
      
      if (jsonProperty) {
        const images = jsonProperty.images && jsonProperty.images.length > 0 
          ? jsonProperty.images 
          : (jsonProperty.imageUrl ? [jsonProperty.imageUrl] : []);
        
        if (images.length > 0) {
          // Update property with images
          await prisma.property.update({
            where: {
              id: dbProperty.id,
            },
            data: {
              images: images,
              updatedAt: new Date(),
            },
          });
          updatedCount++;
          console.log(`Updated images for campus property: ${dbProperty.title} (${images.length} images)`);
        } else {
          console.log(`No images found for property: ${dbProperty.title}`);
        }
      } else {
        console.log(`No matching JSON property found for: ${dbProperty.title}`);
      }
    }
    
    console.log(`Image fix complete. Updated ${updatedCount} campus properties.`);
  } catch (error) {
    console.error('Error fixing campus property images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the fix function
fixCampusPropertyImages()
  .then(() => console.log('Done'))
  .catch((error) => {
    console.error('Fix failed:', error);
    process.exit(1);
  }); 