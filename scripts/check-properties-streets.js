const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkPropertiesStreets() {
  try {
    // Get a sample of properties
    const properties = await prisma.property.findMany({
      take: 10,
      select: {
        id: true,
        title: true,
        street: true,
        location: true,
        url: true
      }
    });
    
    console.log('Sample Properties:');
    properties.forEach(property => {
      console.log(`\nID: ${property.id}`);
      console.log(`Title: ${property.title}`);
      console.log(`Street: ${property.street || 'null'}`);
      console.log(`Location: ${property.location || 'null'}`);
      console.log(`URL: ${property.url || 'null'}`);
    });
    
    // Count properties with street info
    const withStreetCount = await prisma.property.count({
      where: {
        NOT: {
          street: null
        }
      }
    });
    
    const totalCount = await prisma.property.count();
    
    console.log(`\nProperties with street info: ${withStreetCount} of ${totalCount} (${Math.round(withStreetCount/totalCount*100)}%)`);
    
    // Let's try to identify golden triangle properties by title or location
    const potentialGoldenTriangle = [];
    const GOLDEN_TRIANGLE_KEYWORDS = [
      'golden', 'triangle', 'kingfisher', 'forest road', 'ashby road', 'radmoor',
      'fearon', 'havelock', 'leopold', 'regent', 'broad', 'station street', 'paget'
    ];
    
    for (const property of await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        location: true,
        street: true
      }
    })) {
      const combinedText = `${property.title} ${property.location || ''} ${property.street || ''}`.toLowerCase();
      
      for (const keyword of GOLDEN_TRIANGLE_KEYWORDS) {
        if (combinedText.includes(keyword.toLowerCase())) {
          potentialGoldenTriangle.push({
            id: property.id,
            title: property.title,
            matchedOn: keyword
          });
          break;
        }
      }
    }
    
    console.log(`\nPotential Golden Triangle Properties (by keyword): ${potentialGoldenTriangle.length}`);
    potentialGoldenTriangle.slice(0, 20).forEach(property => {
      console.log(`- ID: ${property.id}, Title: ${property.title}, Matched on: ${property.matchedOn}`);
    });
    
  } catch (error) {
    console.error('Error checking properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
checkPropertiesStreets()
  .then(() => console.log('\nDone checking properties'))
  .catch(console.error); 