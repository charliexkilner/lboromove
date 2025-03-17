import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const prisma = new PrismaClient();

interface PropertyWithDetails {
  id: number;
  title: string;
  street: string | null;
  url: string | null;
  images: string[] | null;
  externalId: string | null;
  provider: string | null;
  price: number | null;
  rooms: number | null;
  bathrooms: number | null;
}

/**
 * Main function to detect and merge duplicate properties
 */
async function detectDuplicateProperties() {
  try {
    console.log('Starting duplicate property detection...');
    
    // Get all properties with their details
    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        street: true,
        url: true,
        images: true,
        externalId: true,
        price: true,
        rooms: true,
        bathrooms: true,
      },
    }) as PropertyWithDetails[];

    console.log(`Found ${properties.length} properties to check`);

    // Categorize properties by provider
    properties.forEach(property => {
      if (property.url?.includes('top-lets') || property.externalId?.includes('top-lets')) {
        property.provider = 'top-lets';
      } else if (property.url?.includes('loc8me') || property.externalId?.includes('loc8me')) {
        property.provider = 'loc8me';
      } else {
        property.provider = 'other';
      }
    });
    
    // Group properties by street address
    const propertiesByStreet = groupPropertiesByStreet(properties);
    
    // Find potential duplicates
    const potentialDuplicates = findPotentialDuplicates(propertiesByStreet);
    
    console.log(`Found ${potentialDuplicates.length} potential duplicate property groups`);
    
    // Analyze duplicates and suggest merges
    const mergeSuggestions = analyzeDuplicatesAndSuggestMerges(potentialDuplicates);
    
    console.log(`Generated ${mergeSuggestions.length} merge suggestions`);
    
    // Generate a report
    generateReport(potentialDuplicates, mergeSuggestions);
    
    // Ask if user wants to apply the merges
    console.log('To apply these merges, run this script with the --apply flag');
    
    // If --apply flag is provided, apply the merges
    if (process.argv.includes('--apply')) {
      await applyMerges(mergeSuggestions);
    }
    
  } catch (error) {
    console.error('Error in detectDuplicateProperties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Group properties by street address
 */
function groupPropertiesByStreet(properties: PropertyWithDetails[]) {
  const propertiesByStreet: Record<string, PropertyWithDetails[]> = {};
  
  for (const property of properties) {
    if (!property.street) continue;
    
    // Normalize the street name
    const normalizedStreet = normalizeStreetName(property.street);
    
    if (!propertiesByStreet[normalizedStreet]) {
      propertiesByStreet[normalizedStreet] = [];
    }
    
    propertiesByStreet[normalizedStreet].push(property);
  }
  
  return propertiesByStreet;
}

/**
 * Normalize a street name for comparison
 */
function normalizeStreetName(street: string): string {
  return street
    .toLowerCase()
    .replace(/^(\d+)\s+/, '$1 ') // Keep the number but normalize spacing
    .replace(/\s+/g, ' ')        // Normalize spaces
    .replace(/[.,]/g, '')        // Remove punctuation
    .trim();
}

/**
 * Find potential duplicate properties
 */
function findPotentialDuplicates(propertiesByStreet: Record<string, PropertyWithDetails[]>) {
  const potentialDuplicates: PropertyWithDetails[][] = [];
  
  for (const street in propertiesByStreet) {
    const properties = propertiesByStreet[street];
    
    // If there's more than one property with the same street, they might be duplicates
    if (properties.length > 1) {
      // Further check if they have the same number of rooms or similar price
      const propertiesByRooms: Record<number, PropertyWithDetails[]> = {};
      
      for (const property of properties) {
        const rooms = property.rooms || 0;
        
        if (!propertiesByRooms[rooms]) {
          propertiesByRooms[rooms] = [];
        }
        
        propertiesByRooms[rooms].push(property);
      }
      
      // Add groups of properties with the same number of rooms
      for (const rooms in propertiesByRooms) {
        if (propertiesByRooms[rooms].length > 1) {
          potentialDuplicates.push(propertiesByRooms[rooms]);
        }
      }
    }
  }
  
  return potentialDuplicates;
}

/**
 * Analyze duplicates and suggest merges
 */
function analyzeDuplicatesAndSuggestMerges(potentialDuplicates: PropertyWithDetails[][]) {
  const mergeSuggestions: {
    primaryProperty: PropertyWithDetails;
    duplicateProperties: PropertyWithDetails[];
    mergedImages: string[];
  }[] = [];
  
  for (const duplicateGroup of potentialDuplicates) {
    // Sort by completeness of data (more fields filled in)
    const sortedProperties = [...duplicateGroup].sort((a, b) => {
      const aScore = getCompletenessScore(a);
      const bScore = getCompletenessScore(b);
      return bScore - aScore;
    });
    
    const primaryProperty = sortedProperties[0];
    const duplicateProperties = sortedProperties.slice(1);
    
    // Merge images from all properties, removing duplicates
    const allImages = new Set<string>();
    
    // Add images from primary property
    if (primaryProperty.images && Array.isArray(primaryProperty.images)) {
      primaryProperty.images.forEach(img => allImages.add(img));
    }
    
    // Add images from duplicate properties
    for (const duplicate of duplicateProperties) {
      if (duplicate.images && Array.isArray(duplicate.images)) {
        duplicate.images.forEach(img => allImages.add(img));
      }
    }
    
    // Filter images to ensure they match the property address
    const filteredImages = filterImagesByAddress(Array.from(allImages), primaryProperty.street);
    
    mergeSuggestions.push({
      primaryProperty,
      duplicateProperties,
      mergedImages: filteredImages,
    });
  }
  
  return mergeSuggestions;
}

/**
 * Get a score for how complete a property's data is
 */
function getCompletenessScore(property: PropertyWithDetails): number {
  let score = 0;
  
  if (property.title) score += 1;
  if (property.street) score += 2;
  if (property.url) score += 1;
  if (property.images && property.images.length > 0) score += property.images.length;
  if (property.price) score += 1;
  if (property.rooms) score += 1;
  if (property.bathrooms) score += 1;
  
  return score;
}

/**
 * Filter images to ensure they match the property address
 */
function filterImagesByAddress(images: string[], street: string | null): string[] {
  if (!street) return images;
  
  const streetName = street.replace(/^\d+\s+/, '').toLowerCase();
  const streetWords = streetName.split(' ').filter(word => word.length > 3);
  
  // If we can't extract meaningful words from the street name, return all images
  if (streetWords.length === 0) return images;
  
  const validImages = images.filter(image => {
    const imagePath = image.toLowerCase();
    
    // Check if image URL contains part of the street name
    return streetWords.some(word => imagePath.includes(word));
  });
  
  // If we found valid images, return those; otherwise return all images
  return validImages.length > 0 ? validImages : images;
}

/**
 * Apply the suggested merges
 */
async function applyMerges(mergeSuggestions: {
  primaryProperty: PropertyWithDetails;
  duplicateProperties: PropertyWithDetails[];
  mergedImages: string[];
}[]) {
  console.log('Applying merges...');
  
  for (let i = 0; i < mergeSuggestions.length; i++) {
    const { primaryProperty, duplicateProperties, mergedImages } = mergeSuggestions[i];
    
    console.log(`[${i + 1}/${mergeSuggestions.length}] Merging duplicates for ${primaryProperty.title}`);
    
    try {
      // Update the primary property with merged images
      await prisma.property.update({
        where: { id: primaryProperty.id },
        data: { images: mergedImages },
      });
      
      console.log(`  ✓ Updated primary property with ${mergedImages.length} images`);
      
      // Delete the duplicate properties
      for (const duplicate of duplicateProperties) {
        await prisma.property.delete({
          where: { id: duplicate.id },
        });
        
        console.log(`  ✓ Deleted duplicate property: ${duplicate.title} (ID: ${duplicate.id})`);
      }
    } catch (error) {
      console.error(`  ✗ Error merging properties:`, error);
    }
  }
  
  console.log('Merge operation complete!');
}

/**
 * Generate a report of the duplicate detection and merge suggestions
 */
function generateReport(
  potentialDuplicates: PropertyWithDetails[][],
  mergeSuggestions: {
    primaryProperty: PropertyWithDetails;
    duplicateProperties: PropertyWithDetails[];
    mergedImages: string[];
  }[]
) {
  const reportDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir);
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportPath = path.join(reportDir, `duplicate-properties-report-${timestamp}.json`);
  
  const report = {
    timestamp: new Date().toISOString(),
    potentialDuplicatesCount: potentialDuplicates.length,
    mergeSuggestionsCount: mergeSuggestions.length,
    potentialDuplicates: potentialDuplicates.map(group => 
      group.map(p => ({
        id: p.id,
        title: p.title,
        street: p.street,
        provider: p.provider,
        rooms: p.rooms,
        price: p.price
      }))
    ),
    mergeSuggestions: mergeSuggestions.map(suggestion => ({
      primaryProperty: {
        id: suggestion.primaryProperty.id,
        title: suggestion.primaryProperty.title,
        street: suggestion.primaryProperty.street,
        provider: suggestion.primaryProperty.provider
      },
      duplicateProperties: suggestion.duplicateProperties.map(p => ({
        id: p.id,
        title: p.title,
        street: p.street,
        provider: p.provider
      })),
      mergedImagesCount: suggestion.mergedImages.length
    }))
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`Report generated at ${reportPath}`);
}

// Run the function if this script is executed directly
if (require.main === module) {
  detectDuplicateProperties()
    .then(() => console.log('Done'))
    .catch(console.error);
}

export { detectDuplicateProperties }; 