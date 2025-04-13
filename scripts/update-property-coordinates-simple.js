const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Default coordinates for Loughborough (center of town)
const DEFAULT_LOUGHBOROUGH = { lat: 52.7721, lng: -1.2060 };

// Known locations in Loughborough
const LOUGHBOROUGH_AREAS = [
  { name: 'golden triangle', lat: 52.7705, lng: -1.2126 },
  { name: 'kingfisher', lat: 52.7602, lng: -1.2203 },
  { name: 'forest road', lat: 52.7644, lng: -1.2163 },
  { name: 'ashby road', lat: 52.7687, lng: -1.2149 },
  { name: 'university', lat: 52.7650, lng: -1.2277 },
  { name: 'campus', lat: 52.7650, lng: -1.2277 },
  { name: 'epinal way', lat: 52.7664, lng: -1.2224 },
  { name: 'college', lat: 52.7701, lng: -1.2206 },
  { name: 'radmoor', lat: 52.7666, lng: -1.2198 },
  { name: 'loughborough town', lat: 52.7721, lng: -1.2060 },
  { name: 'burleigh', lat: 52.7529, lng: -1.2212 },
  { name: 'thorpe acre', lat: 52.7575, lng: -1.2479 },
  { name: 'nanpantan', lat: 52.7519, lng: -1.2457 },
  { name: 'leicester road', lat: 52.7780, lng: -1.2016 },
  { name: 'market street', lat: 52.7719, lng: -1.2085 },
  { name: 'station street', lat: 52.7705, lng: -1.2126 },
  { name: 'paget street', lat: 52.7685, lng: -1.2125 },
  { name: 'leopold street', lat: 52.7715, lng: -1.2145 },
  { name: 'regent street', lat: 52.7710, lng: -1.2145 },
  { name: 'loughborough', lat: 52.7721, lng: -1.2060 },
];

// Small random offset to avoid all properties at the same point
function getSmallRandomOffset() {
  return (Math.random() - 0.5) * 0.01; // ±0.005 degrees (roughly 500m)
}

async function updatePropertyCoordinatesSimple() {
  try {
    // Get all properties without coordinates
    const properties = await prisma.property.findMany({
      where: {
        OR: [{ latitude: null }, { longitude: null }],
      },
      select: {
        id: true,
        title: true,
        location: true,
        street: true,
        isGoldenTriangle: true,
      },
    });

    console.log(`Found ${properties.length} properties without coordinates`);

    if (properties.length === 0) {
      console.log('No properties need coordinate updates.');
      return;
    }

    let updatedCount = 0;

    for (const property of properties) {
      try {
        let coordinates = { ...DEFAULT_LOUGHBOROUGH };
        
        // Handle Golden Triangle properties
        if (property.isGoldenTriangle) {
          coordinates = { 
            lat: LOUGHBOROUGH_AREAS.find(a => a.name === 'golden triangle').lat + getSmallRandomOffset(), 
            lng: LOUGHBOROUGH_AREAS.find(a => a.name === 'golden triangle').lng + getSmallRandomOffset() 
          };
        } 
        // Try to match area from property information
        else {
          // Combine all text fields for matching
          const combinedText = `${property.title} ${property.location} ${property.street || ''}`.toLowerCase();
          
          // Find a matching area
          for (const area of LOUGHBOROUGH_AREAS) {
            if (combinedText.includes(area.name)) {
              coordinates = { 
                lat: area.lat + getSmallRandomOffset(), 
                lng: area.lng + getSmallRandomOffset() 
              };
              break;
            }
          }
        }

        // Update the property with the coordinates
        await prisma.property.update({
          where: { id: property.id },
          data: {
            latitude: coordinates.lat,
            longitude: coordinates.lng,
          },
        });

        updatedCount++;
        console.log(
          `✓ Updated coordinates for ${property.title}: ${coordinates.lat}, ${coordinates.lng}`
        );
        
      } catch (error) {
        console.error(
          `Error updating coordinates for property ${property.title}:`,
          error
        );
      }
    }

    console.log(`Finished updating coordinates for ${updatedCount} properties`);
  } catch (error) {
    console.error('Error in updatePropertyCoordinatesSimple:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updatePropertyCoordinatesSimple()
  .then(() => console.log('Done'))
  .catch(console.error); 