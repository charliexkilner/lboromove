import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

async function removeDuplicateCampusProperties() {
  try {
    console.log('Starting duplicate campus property removal...');
    
    // Step 1: Get all properties with campus property flag
    const campusProperties = await prisma.property.findMany({
      where: {
        keyFeatures: {
          path: ['isCampusProperty'],
          equals: true
        }
      },
      orderBy: {
        updatedAt: 'desc' // Order by most recently updated first
      }
    });
    
    console.log(`Found ${campusProperties.length} total campus properties`);
    
    // Step 2: Group properties by title (or another unique identifier)
    const propertyGroups = new Map();
    
    campusProperties.forEach(property => {
      // Use title as the identifying factor (we could use slug or another field)
      const key = property.title.trim().toLowerCase();
      
      if (!propertyGroups.has(key)) {
        propertyGroups.set(key, []);
      }
      
      propertyGroups.get(key).push(property);
    });
    
    console.log(`Grouped into ${propertyGroups.size} unique properties`);
    
    // Step 3: For each group with more than one property, keep the most recent and delete others
    const deletePromises: Promise<any>[] = [];
    let keepCount = 0;
    let deleteCount = 0;
    
    // Convert Map entries to array to avoid MapIterator issue
    Array.from(propertyGroups.entries()).forEach(([title, properties]) => {
      if (properties.length > 1) {
        console.log(`Found ${properties.length} duplicates for "${title}"`);
        
        // Keep the most recent one (already sorted by updatedAt desc)
        const toKeep = properties[0];
        keepCount++;
        
        // Delete the rest
        for (let i = 1; i < properties.length; i++) {
          const toDelete = properties[i];
          console.log(`  Deleting property ID ${toDelete.id} (${toDelete.title}) - Updated at ${toDelete.updatedAt}`);
          deletePromises.push(
            prisma.property.delete({
              where: { id: toDelete.id }
            })
          );
          deleteCount++;
        }
      } else {
        // Only one property found, so keep it
        keepCount++;
      }
    });
    
    // Execute all delete operations
    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(`Successfully deleted ${deleteCount} duplicate properties`);
    } else {
      console.log('No duplicates found to delete');
    }
    
    console.log(`Keeping ${keepCount} unique campus properties`);
    console.log('Cleanup completed successfully!');
    
  } catch (error) {
    console.error('Error removing duplicate campus properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
removeDuplicateCampusProperties()
  .then(() => console.log('Done'))
  .catch(console.error); 