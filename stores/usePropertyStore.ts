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
    console.log('Setting properties:', properties.length);
    set((state) => {
      const filtered = filterProperties(
        properties,
        state.activeTab,
        state.searchTerm
      );
      console.log('Filtered properties:', filtered.length);
      return {
        properties,
        filteredProperties: filtered,
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
    set((state) => {
      const filtered = filterProperties(
        state.properties,
        tab,
        state.searchTerm
      );
      return {
        activeTab: tab,
        filteredProperties: filtered,
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
        // Implement your rare finds logic here
        return false;

      default:
        return true;
    }
  });
}
