const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Function to find properties by URL pattern
async function findPropertiesByUrlPattern(pattern) {
  console.log(`Finding properties with URL pattern: ${pattern}`);
  
  const properties = await prisma.property.findMany({
    where: {
      url: {
        contains: pattern,
        mode: 'insensitive'
      }
    },
    select: {
      id: true,
      title: true,
      url: true,
      scrapedFrom: true
    }
  });
  
  console.log(`Found ${properties.length} properties with URLs containing "${pattern}"`);
  
  if (properties.length > 0) {
    console.log('Sample properties:');
    properties.slice(0, 3).forEach(p => {
      console.log(`- ID: ${p.id}, Title: ${p.title}, ScrapedFrom: ${p.scrapedFrom}`);
    });
  }
  
  return properties;
}

// Function to find properties by scrapedFrom value
async function findPropertiesBySource(source) {
  console.log(`Finding properties with scrapedFrom: ${source}`);
  
  const properties = await prisma.property.findMany({
    where: {
      scrapedFrom: source
    },
    select: {
      id: true,
      title: true,
      url: true,
      scrapedFrom: true
    }
  });
  
  console.log(`Found ${properties.length} properties with scrapedFrom "${source}"`);
  
  if (properties.length > 0) {
    console.log('Sample properties:');
    properties.slice(0, 3).forEach(p => {
      console.log(`- ID: ${p.id}, Title: ${p.title}, URL: ${p.url}`);
    });
  }
  
  return properties;
}

// Function to delete properties by ID
async function deletePropertiesById(ids) {
  if (!ids.length) {
    console.log('No properties to delete');
    return 0;
  }
  
  console.log(`Deleting ${ids.length} properties by ID...`);
  
  const { count } = await prisma.property.deleteMany({
    where: {
      id: {
        in: ids
      }
    }
  });
  
  console.log(`Successfully deleted ${count} properties`);
  return count;
}

// Main function
async function main() {
  try {
    console.log('=== Property Management Script ===');
    
    // 1. Find Loc8me properties
    console.log('\n=== Loc8me Properties ===');
    const loc8meByUrl = await findPropertiesByUrlPattern('loc8me.co.uk');
    const loc8meBySource = await findPropertiesBySource('loc8me.co.uk');
    
    // 2. Find TopLets properties
    console.log('\n=== TopLets Properties ===');
    const topletsByUrl = await findPropertiesByUrlPattern('top-lets.co.uk');
    const topletsBySource = await findPropertiesBySource('top-lets.co.uk');
    
    // 3. Collect IDs for deletion
    const loc8meIds = [...new Set([
      ...loc8meByUrl.map(p => p.id),
      ...loc8meBySource.map(p => p.id)
    ])];
    
    const topletsIds = [...new Set([
      ...topletsByUrl.map(p => p.id),
      ...topletsBySource.map(p => p.id)
    ])];
    
    // 4. Delete properties if found
    console.log('\n=== Deleting Properties ===');
    
    if (loc8meIds.length) {
      console.log(`\nPreparing to delete ${loc8meIds.length} Loc8me properties...`);
      await deletePropertiesById(loc8meIds);
    } else {
      console.log('No Loc8me properties found to delete');
    }
    
    if (topletsIds.length) {
      console.log(`\nPreparing to delete ${topletsIds.length} TopLets properties...`);
      await deletePropertiesById(topletsIds);
    } else {
      console.log('No TopLets properties found to delete');
    }
    
    console.log('\nOperation completed successfully.');
    
  } catch (error) {
    console.error('\nError during operation:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
main(); 