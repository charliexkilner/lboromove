import { create } from 'zustand';
import { isCloseToUniversity } from '../utils/distance';
import { Property } from '@prisma/client';

interface PropertyStore {
  properties: Property[];
  filteredProperties: Property[];
  searchTerm: string;
  activeTab: string;
  setProperties: (properties: Property[]) => void;
  setSearchTerm: (term: string) => void;
  setActiveTab: (tab: string) => void;
}

export const usePropertyStore = create<PropertyStore>((set, get) => ({
  properties: [],
  filteredProperties: [],
  searchTerm: '',
  activeTab: 'all-houses',

  setProperties: (properties) => {
    console.log('Setting properties:', properties?.length || 0);
    // Ensure properties is always an array
    const validProperties = Array.isArray(properties) ? properties : [];
    set((state) => {
      return {
        properties: validProperties,
        // Keep the existing filtered properties or initialize with valid properties
        filteredProperties: state.filteredProperties.length > 0 
          ? state.filteredProperties 
          : validProperties,
      };
    });
  },

  setSearchTerm: (term) => {
    set((state) => {
      const filtered = filterProperties(
        state.properties,
        state.activeTab,
        term
      );
      return {
        searchTerm: term,
        filteredProperties: filtered,
      };
    });
  },

  setActiveTab: (tab) => {
    console.log('Setting active tab:', tab);
    set((state) => {
      // Only update the active tab, don't filter properties
      // This allows the tab filtering in the component to control what's displayed
      return {
        activeTab: tab,
        // Keep the existing filtered properties
        filteredProperties: state.filteredProperties,
      };
    });
  },
}));

function filterProperties(
  properties: Property[],
  activeTab: string,
  searchTerm: string
): Property[] {
  console.log('Filtering for tab:', activeTab);

  return properties.filter((property) => {
    // Basic search filter
    if (
      searchTerm &&
      !property.street?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Tab filters
    switch (activeTab) {
      case 'all-houses':
        return true;

      case 'golden-triangle':
        console.log('Golden Triangle check:', {
          street: property.street,
          isGoldenTriangle: property.isGoldenTriangle,
          propertyData: property,
        });
        return property.isGoldenTriangle === true;

      case 'great-value':
        console.log('Great Value check:', {
          street: property.street,
          weeklyPrice: property.price,
          isGreatValue: property.price <= 135,
        });
        return property.price <= 135;

      case 'solo-living':
        return property.rooms === 1;

      case 'near-campus':
        if (!property.latitude || !property.longitude) {
          return false;
        }
        const isClose = isCloseToUniversity(property);
        console.log('Near Campus check:', property.street, isClose);
        return isClose;

      case 'en-suite':
        if (!property.amenities) return false;
        return property.amenities.some((a) => {
          const amenity = a.toLowerCase();
          return amenity.includes('en-suite') || amenity.includes('ensuite');
        });

      case 'bills-included':
        if (!property.amenities) return false;
        return property.amenities.some((a) => {
          const amenity = a.toLowerCase();
          return (
            amenity.includes('bills included') ||
            amenity.includes('all bills included')
          );
        });

      case 'driveway-parking':
        if (!property.amenities) return false;
        return property.amenities.some((a) => {
          const amenity = a.toLowerCase();
          return amenity.includes('parking') || amenity.includes('driveway');
        });

      case 'rare-finds':
        // Implement proper rare finds logic - properties with unique features
        if (property.bathrooms && property.bathrooms >= 4) return true;
        
        // Check for rare amenities
        if (property.amenities) {
          return property.amenities.some(amenity => {
            const a = amenity.toLowerCase();
            return a.includes('gym') || 
                   a.includes('swimming pool') || 
                   a.includes('cinema room') ||
                   a.includes('games room');
          });
        }
        return false;

      default:
        return true;
    }
  });
}
