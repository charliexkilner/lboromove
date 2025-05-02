import { AdjustmentsHorizontalIcon, MapIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { GetServerSideProps } from 'next/types';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { isCloseToUniversity } from '../utils/distance';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback } from 'react';
import PropertyCard from '../components/PropertyCard';
import { Property } from '@prisma/client';
import DiscussionCard from '../components/DiscussionCard';
import { Discuession } from '../types/discussion';
import React from 'react';
import FilterPopover from '../components/FilterPopover';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import ErrorBoundary from '../components/ErrorBoundary';
import { fetchAPI } from '../utils/api';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { usePropertyStore } from '../stores/usePropertyStore';
import { getPropertyIdFromSlug, generatePropertySlug } from '@/utils/url';
import SearchFilterBar from '../components/SearchFilterBar';
import { getCampusPropertiesAsProperties, getCampusPropertiesWithKeyFeatures } from '../utils/campusProperties';
import CampusPropertyModal from '../components/CampusPropertyModal';
import CampusPropertyCard from '../components/CampusPropertyCard';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useFavorites } from '@/hooks/useFavorites';
import Head from 'next/head';

// Import PropertyMap with dynamic import to prevent SSR issues
const PropertyMap = dynamic(() => import('../components/PropertyMap'), { 
  ssr: false, 
  loading: () => (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
      <p className="text-gray-700">Loading map view...</p>
    </div>
  )
});

// Import PropertyModal with dynamic import to reduce hydration flicker
const PropertyModal = dynamic(() => import('../components/PropertyModal'), { 
  ssr: false 
});

// Define a type for serialized properties with string dates
type SerializedProperty = Omit<Partial<Property>, 'createdAt' | 'updatedAt'> & {
  createdAt: string | null;
  updatedAt: string | null;
};

interface HomeProps {
  campusProperties: SerializedProperty[];
}

type ScrollDirection = 'up' | 'down';

interface ScrollInfo {
  isSticky: boolean;
  direction: ScrollDirection;
  progress: number;
  isAtTop: boolean;
  isScrolling: boolean;
}

// Add a custom hook for scroll behavior
const useScrollBehavior = (threshold: number): ScrollInfo => {
  const [scrollInfo, setScrollInfo] = useState<ScrollInfo>(() => ({
    isSticky: false,
    direction: 'up',
    progress: 0,
    isAtTop: true,
    isScrolling: false
  }));
  const lastScrollY = useRef<number>(0);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const direction: ScrollDirection = currentScrollY > lastScrollY.current ? 'down' : 'up';
      const heroSection = document.querySelector('#hero-section');
      const heroBottom = heroSection?.getBoundingClientRect().bottom ?? 0;
      const isAtTop = currentScrollY < 10;
      const shouldBeSticky = heroBottom < threshold;
      
      // Calculate scroll progress for smooth transitions
      const progress = Math.min(1, Math.max(0, (currentScrollY - (heroBottom - threshold)) / 100));

      setScrollInfo({
        isSticky: shouldBeSticky,
        direction,
        progress,
        isAtTop,
        isScrolling: true
      });

      lastScrollY.current = currentScrollY;

      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      scrollTimeout.current = setTimeout(() => {
        setScrollInfo(prev => ({
          ...prev,
          isScrolling: false
        }));
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [threshold]);

  return scrollInfo;
};

interface ExtendedProperty extends Property {
  _viewKey?: number;
}

export default function Home({ campusProperties = [] }: HomeProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale, pathname } = router;
  const [filters, setFilters] = useState<{
    bedrooms?: number;
    bathrooms?: number;
    maxPrice?: number;
  }>({
    bedrooms: undefined,
    bathrooms: undefined,
    maxPrice: undefined,
  });
  const [discussions, setDiscussions] = useState<Discuession[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [localFilteredProperties, setLocalFilteredProperties] = useState<Property[]>([]);
  const [showMap, setShowMap] = useState(false);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);

  // Use the scroll behavior hook
  const scrollInfo = useScrollBehavior(80);
  const { isSticky, direction, progress, isAtTop } = scrollInfo;
  
  // Handle window resize for mobile detection
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isCurrentlyMobile = windowWidth < 768;

  const {
    properties,
    filteredProperties,
    setProperties,
    setActiveTab,
    activeTab,
  } = usePropertyStore();

  // Add a ref to track previous pathname 
  const previousPathRef = useRef<string>('');

  // Add proper scroll position tracking and restoration
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());

  // Add refs to store state before modal opens
  const preModalStateRef = useRef<{
    activeTab: string | null;
    showMap: boolean;
    filters: {
      bedrooms?: number;
      bathrooms?: number;
      maxPrice?: number;
    }
  }>({
    activeTab: null,
    showMap: false,
    filters: {}
  });

  // Add state tracking refs
  const scrollRef = useRef<number>(0);
  const stateRef = useRef({ tab: activeTab, filters });

  // Add state preservation functions
  const saveScroll = () => {
    scrollRef.current = window.scrollY;
    stateRef.current = { tab: activeTab, filters };
  };

  const restoreScroll = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: scrollRef.current });
    });
    setActiveTab(stateRef.current.tab);
    setFilters(stateRef.current.filters);
  };

  // Replace existing router path effect with improved version that prevents unnecessary rerenders
  useEffect(() => {
    const match = router.asPath.match(/\/house\/(.*?)$/);
    const newSlug = match?.[1];
    if (newSlug && newSlug !== selectedProperty) {
      setSelectedProperty(newSlug);
    } else if (!newSlug) {
      setSelectedProperty(null);
    }
  }, [router.asPath]);

  // Update useQuery to prevent refetching when modal is open
  const {
    data,
    isLoading,
    error: queryError,
  }: {
    data: { properties: Property[] } | null | undefined;
    isLoading: boolean;
    error: unknown;
  } = useQuery({
    queryKey: ['properties', filters],
    queryFn: async (): Promise<{ properties: Property[] }> => {
      try {
        // Skip data fetching if modal is open and we have data
        if (selectedProperty && data) {
          return data;
        }

        const queryParams = new URLSearchParams();
        if (filters.bedrooms) {
          queryParams.append('bedrooms', filters.bedrooms.toString());
        }
        if (filters.bathrooms) {
          queryParams.append('bathrooms', filters.bathrooms.toString());
        }
        if (filters.maxPrice) {
          queryParams.append('maxPrice', filters.maxPrice.toString());
        }

        const response = await fetchAPI(`/api/properties?${queryParams.toString()}`) as { properties: Property[] };
        if (response.properties) {
          setProperties(response.properties);
        }
        return response;
      } catch (error) {
        console.error('Error fetching properties:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: !selectedProperty, // Don't refetch when modal is open
  });

  // Update allProperties definition
  const allProperties = data?.properties || [];

  // Set default tab and initialize filtered properties when data is loaded
  useEffect(() => {
    if (data?.properties && data.properties.length > 0) {
      // Set the properties in the store
      setProperties(data.properties);
      
      // Initialize the filtered properties based on the active tab
      // Only apply tab filtering on initial load
      if (!localFilteredProperties.length) {
        if (activeTab) {
          handleTabChange(activeTab);
        } else {
          // If no active tab, set to all-houses
          handleTabChange('all-houses');
        }
      }
    }
  }, [data?.properties]); // Only depend on data.properties, not activeTab

  useEffect(() => {
    // Prefetch all main navigation routes
    const routes = ['/discussion', '/tools', '/student-move-in-checklist'];
    routes.forEach((route) => {
      router.prefetch(route);
    });
  }, [router]);

  useEffect(() => {
    console.log('Properties loaded:', {
      total: properties.length,
      filtered: filteredProperties.length,
      sample: properties[0],
    });
  }, [properties, filteredProperties]);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 200;
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  const handleFilterChange = (newFilters: any) => {
    console.log('Filter changed:', newFilters);
    
    // Only update if filters actually changed
    if (
      filters.bedrooms !== newFilters.bedrooms ||
      filters.maxPrice !== newFilters.maxPrice
    ) {
      // Update the filters state
      setFilters({
        ...filters,
        bedrooms: newFilters.bedrooms,
        maxPrice: newFilters.maxPrice,
      });
      
      // Apply filters to properties
      let filtered = [...properties]; // Create a copy to avoid mutation
      
      if (newFilters.bedrooms !== undefined) {
        filtered = filtered.filter((p) => {
          // Check if rooms property exists and is a number
          if (typeof p.rooms !== 'number') return false;
          // Filter for EXACTLY the number of bedrooms selected
          return p.rooms === newFilters.bedrooms;
        });
      }
      
      if (newFilters.maxPrice !== undefined) {
        filtered = filtered.filter((p) => {
          if (typeof p.price !== 'number') return false;
          return p.price <= (newFilters.maxPrice as number);
        });
      }
      
      console.log(`Filtered properties: ${filtered.length} out of ${properties.length}`);
      
      // Update the local state with filtered properties
      setLocalFilteredProperties(filtered);
      
      // Set the active tab to 'all-houses' when searching
      setActiveTab('all-houses');
    }
  };

  const handleTabChange = (tabName: string) => {
    console.log('Tab changed to:', tabName);
    
    // Update the active tab in the store
    setActiveTab(tabName);

    // Apply filters to properties based on the selected tab and existing filters
    let filtered = [...properties]; // Create a copy to avoid mutation
    
    // First apply price and bedroom filters if they exist
    if (filters.bedrooms !== undefined) {
      filtered = filtered.filter((p) => {
        if (typeof p.rooms !== 'number') return false;
        return p.rooms === filters.bedrooms;
      });
    }
    
    if (filters.maxPrice !== undefined) {
      filtered = filtered.filter((p) => {
        if (typeof p.price !== 'number') return false;
        return p.price <= filters.maxPrice;
      });
    }
    
    // Then apply tab-specific filters
    switch (tabName) {
      case 'all-houses':
        // No additional filtering needed
        break;
      case 'golden-triangle':
        filtered = filtered.filter((p) => p.isGoldenTriangle === true);
        break;
      case 'silver-square':
        filtered = filtered.filter((p) => {
          const silverSquareStreets = [
            'burleigh road',
            'york road',
            'william street',
            'seward street',
            'radmoor road',
            'arthur street',
            'curzon street',
            'heathcoat street',
            'caldwell street',
            'frederick street'
          ];
          
          // Check both location and street fields
          const location = (p.location || '').toLowerCase();
          const street = (p.street || '').toLowerCase();
          const title = (p.title || '').toLowerCase();
          
          return silverSquareStreets.some(streetName => 
            location.includes(streetName) || 
            street.includes(streetName) || 
            title.includes(streetName)
          );
        });
        break;
      case 'great-value':
        filtered = filtered.filter((p) => p.price <= 135);
        break;
      case 'solo-living':
        filtered = filtered.filter((p) => p.rooms === 1);
        break;
      case 'large-houses':
        filtered = filtered.filter((p) => p.rooms >= 5);
        break;
      case 'near-campus':
        // First filter properties that have coordinates
        filtered = filtered.filter((p) => p.latitude && p.longitude)
          .filter((p) => isCloseToUniversity(p));
        
        console.log('Near Campus filtered properties:', filtered.length);
        break;
      case 'on-campus':
        // Filter properties that are on campus using keyFeatures
        filtered = filtered.filter((p: Property) => {
          // Check if it's a campus property using keyFeatures
          const isCampusProperty = p.keyFeatures && 
            typeof p.keyFeatures === 'object' && 
            (p.keyFeatures as any).isCampusProperty;
          
          // Also check amenities for "on campus" properties
          const hasOnCampusAmenity = p.amenities && p.amenities.some(a => {
            const amenity = a.toLowerCase();
            return amenity.includes('on campus') || 
                   amenity.includes('university accommodation') || 
                   amenity.includes('student halls');
          });
          
          return isCampusProperty || hasOnCampusAmenity;
        });
        break;
      case 'driveway-parking':
        // Count properties with driveway or parking
        filtered = filtered.filter((p: Property) => {
          if (!p.amenities) return false;
          return p.amenities.some((a) => {
            const amenity = a.toLowerCase();
            return amenity.includes('parking') || 
                   amenity.includes('driveway') || 
                   amenity.includes('garage');
          });
        });
        break;
      case 'rare-finds':
        // Implement proper rare finds logic - properties with unique features
        filtered = filtered.filter((p: Property) => {
          // For now, we'll define rare finds as properties with 4+ bathrooms or very specific amenities
          if (p.bathrooms && p.bathrooms >= 4) return true;
          
          // Check for rare amenities
          if (p.amenities) {
            return p.amenities.some(amenity => {
              const a = amenity.toLowerCase();
              return a.includes('gym') || 
                     a.includes('swimming pool') || 
                     a.includes('cinema room') ||
                     a.includes('games room');
            });
          }
          return false;
        });
        break;
      case 'recently-added':
        // Filter properties added in the last two weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        filtered = filtered.filter((p: Property) => {
          // Check if createdAt exists and is a valid date string
          if (!p.createdAt) return false;
          
          // Parse the date string
          const createdDate = new Date(p.createdAt);
          
          // Check if the property was created in the last two weeks
          return createdDate >= twoWeeksAgo;
        });
        
        console.log('Recently Added filtered properties:', filtered.length);
        break;
      default:
        // No additional filtering
        break;
    }

    console.log(`Tab ${tabName} filtered properties: ${filtered.length} out of ${properties.length}`);
    
    // Update the local state with filtered properties
    setLocalFilteredProperties(filtered);
    
    // DO NOT clear existing filters - this allows combining filters with tabs
  };

  // Update the getActiveFiltersText function
  const getActiveFiltersText = () => {
    // Check if any filters are active
    const hasActiveFilters = Object.values(filters).some(
      (v) => v !== undefined
    );

    if (!hasActiveFilters) {
      return 'FILTER BY';
    }

    const parts = ['FILTER'];

    if (filters.bedrooms) {
      parts.push(
        `${filters.bedrooms} ${filters.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`
      );
    }

    if (filters.bathrooms) {
      parts.push(
        `${filters.bathrooms} ${
          filters.bathrooms === 1 ? 'bathroom' : 'bathrooms'
        }`
      );
    }

    if (filters.maxPrice) {
      parts.push(`£${filters.maxPrice}${filters.maxPrice >= 350 ? '+' : ''}`);
    }

    return parts.join(' | ');
  };

  // Add prefetch function for property data
  const prefetchProperty = (propertyId: number) => {
    queryClient.prefetchQuery({
      queryKey: ['property', propertyId],
      queryFn: async () => {
        const res = await fetch(`/api/properties/${propertyId}`);
        if (!res.ok) throw new Error('Failed to fetch property');
        return res.json();
      },
    });
  };

  // Update the handlePropertyHover function to save property data
  const handlePropertyHover = (property: any) => {
    // Preload property data
    console.log('Hovering property:', property.id);
  };

  // Update the getTabCount function
  const getTabCount = (tabId: string) => {
    switch (tabId) {
      case 'all-houses':
        return allProperties.length;
      case 'golden-triangle':
        return allProperties.filter(
          (p: Property) => p.isGoldenTriangle === true
        ).length;
      case 'silver-square':
        return allProperties.filter((p: Property) => {
          const silverSquareStreets = [
            'burleigh road',
            'york road',
            'william street',
            'seward street',
            'radmoor road',
            'arthur street',
            'curzon street',
            'heathcoat street',
            'caldwell street',
            'frederick street'
          ];
          
          // Check both location and street fields
          const location = (p.location || '').toLowerCase();
          const street = (p.street || '').toLowerCase();
          const title = (p.title || '').toLowerCase();
          
          return silverSquareStreets.some(streetName => 
            location.includes(streetName) || 
            street.includes(streetName) || 
            title.includes(streetName)
          );
        }).length;
      case 'great-value':
        const greatValueCount = allProperties.filter(
          (p: Property) => p.price <= 135
        ).length;
        console.log('Great Value tab count:', greatValueCount);
        return greatValueCount;
      case 'solo-living':
        return allProperties.filter((p: Property) => p.rooms === 1).length;
      case 'large-houses':
        return allProperties.filter((p: Property) => p.rooms >= 5).length;
      case 'near-campus':
        // Check if properties have coordinates before filtering
        const propertiesWithCoordinates = allProperties.filter(
          (p: Property) => p.latitude && p.longitude
        );
        
        // Count properties that are close to university
        const nearCampusCount = propertiesWithCoordinates.filter(
          (p: Property) => isCloseToUniversity(p)
        ).length;
        
        console.log('Near Campus tab count:', nearCampusCount, 'out of', propertiesWithCoordinates.length, 'properties with coordinates');
        return nearCampusCount;
      case 'on-campus':
        // Count properties that are on campus using keyFeatures
        return allProperties.filter((p: Property) => {
          // Check if it's a campus property using keyFeatures
          const isCampusProperty = p.keyFeatures && 
            typeof p.keyFeatures === 'object' && 
            (p.keyFeatures as any).isCampusProperty;
          
          // Also check amenities for "on campus" properties
          const hasOnCampusAmenity = p.amenities && p.amenities.some(a => {
            const amenity = a.toLowerCase();
            return amenity.includes('on campus') || 
                   amenity.includes('university accommodation') || 
                   amenity.includes('student halls');
          });
          
          return isCampusProperty || hasOnCampusAmenity;
        }).length;
      case 'driveway-parking':
        // Count properties with driveway or parking
        return allProperties.filter((p: Property) => {
          if (!p.amenities) return false;
          return p.amenities.some((a) => {
            const amenity = a.toLowerCase();
            return amenity.includes('parking') || 
                   amenity.includes('driveway') || 
                   amenity.includes('garage');
          });
        }).length;
      case 'en-suite':
        return allProperties.filter((p: Property) =>
          p.amenities?.some((a: string) => a.toLowerCase().includes('en-suite'))
        ).length;
      case 'bills-included':
        return allProperties.filter((p: Property) =>
          p.amenities?.some(
            (a: string) =>
              a.toLowerCase().includes('bills included') ||
              a.toLowerCase().includes('all bills included')
          )
        ).length;
      case 'rare-finds':
        // Count properties with rare features
        return allProperties.filter((p: Property) => {
          // For now, we'll define rare finds as properties with 4+ bathrooms or very specific amenities
          if (p.bathrooms && p.bathrooms >= 4) return true;
          
          // Check for rare amenities
          if (p.amenities) {
            return p.amenities.some(amenity => {
              const a = amenity.toLowerCase();
              return a.includes('gym') || 
                     a.includes('swimming pool') || 
                     a.includes('cinema room') ||
                     a.includes('games room');
            });
          }
          return false;
        }).length;
      case 'recently-added':
        // Count properties added in the last two weeks
        const twoWeeksAgo = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        
        const recentlyAddedCount = allProperties.filter((p: Property) => {
          // Check if createdAt exists and is a valid date string
          if (!p.createdAt) return false;
          
          // Parse the date string
          const createdDate = new Date(p.createdAt);
          
          // Check if the property was created in the last two weeks
          return createdDate >= twoWeeksAgo;
        }).length;
        
        console.log('Recently Added tab count:', recentlyAddedCount);
        return recentlyAddedCount;
      default:
        return allProperties.length;
    }
  };

  // Update the handlePropertySelect function to save state
  const handlePropertySelect = (property: Property) => {
    // Save scroll and state before showing the modal
    saveScroll();
    
    // Prevent any data refetching by cancelling active queries
    queryClient.cancelQueries({queryKey: ['properties']});
    
    // Generate the property slug and update the URL
    const slug = generatePropertySlug(property);
    router.push(`/house/${slug}`, undefined, { 
      shallow: true,
      scroll: false // Prevent scroll reset
    });
    
    // Direct state update to ensure immediate UI response
    setSelectedProperty(slug);
  };

  // Update the handleCloseModal function
  const handleCloseModal = () => {
    // Update URL without reload using shallow routing
    router.push('/', undefined, { shallow: true, scroll: false })
      .then(() => {
        // After URL is updated, clear the selected property
        setSelectedProperty(null);
        
        // Restore state and scroll position
        restoreScroll();
      })
      .catch((error) => {
        console.error('Error during modal close:', error);
        // Fallback: directly clear selection if router fails
        setSelectedProperty(null);
        restoreScroll();
      });
  };

  // Function to handle map button click
  const handleViewToggle = () => {
    // If already showing the view user wants, do nothing
    const targetView = !showMap;
    console.log(`Toggling view from ${showMap ? 'map' : 'list'} to ${targetView ? 'map' : 'list'}`);
    
    // When switching views, ensure smooth transition
    const performViewTransition = async () => {
      try {
        // First, update the view state
        setShowMap(targetView);
        
        if (!targetView) { // Switching to list view
          // Keep existing properties state to maintain image loading
          const propertiesToShow = localFilteredProperties.length > 0 
            ? localFilteredProperties 
            : properties;
          
          // Create a new array of properties with preserved image state from existing properties
          // This avoids the type issues with direct state updates
          const updatedProperties = propertiesToShow.map(property => {
            // Find existing property to get its images if available
            const existingProperty = properties.find(p => p.id === property.id);
            return {
              ...property,
              _viewKey: (property as ExtendedProperty)._viewKey || Date.now(),
              images: existingProperty ? existingProperty.images : property.images
            };
          });
          
          // Update properties with the new array (avoiding the linter issues)
          setProperties(updatedProperties as any);
        }
        
        // Ensure smooth scroll position
        requestAnimationFrame(() => {
          window.scrollTo({
            top: window.scrollY,
            behavior: 'auto'
          });
        });
      } catch (error) {
        console.error('Error during view transition:', error);
      }
    };
    
    performViewTransition();
  };

  // Floating Button Component to toggle between map and list view
  const FloatingViewToggleButton = () => (
    <button
      onClick={handleViewToggle}
      className="fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 z-[200] flex items-center gap-1 px-3 py-1.5 bg-white/70 backdrop-filter backdrop-blur-lg rounded-lg shadow-lg border border-gray-200/50 hover:bg-white/95 transition-all"
      aria-label={showMap ? "Switch to list view" : "Switch to map view"}
    >
      {showMap ? (
        <>
          <span className="text-lg">📋</span>
          <span className="font-medium text-sm text-black uppercase tracking-wide">List</span>
        </>
      ) : (
        <>
          <span className="text-lg">🗺️</span>
          <span className="font-medium text-sm text-black uppercase tracking-wide">Map</span>
        </>
      )}
    </button>
  );
  
  // Render the tabs for location filtering
  const renderTabs = () => {
    return (
      <div 
        className="relative w-full border-b border-gray-200/50"
      >
        <div className="max-w-7xl mx-auto">
          <div
            ref={scrollContainerRef}
            className="flex space-x-4 overflow-x-auto scrollbar-hide px-4 sm:px-6 lg:px-8 py-3"
          >
            {[
              {
                id: 'all-houses',
                icon: '🏠',
                label: t('tabs.allHouses'),
              },
              {
                id: 'golden-triangle',
                icon: '🏆',
                label: t('tabs.goldenTriangle'),
              },
              {
                id: 'silver-square',
                icon: '🩶',
                label: 'SILVER SQUARE',
              },
              {
                id: 'great-value',
                icon: '💰',
                label: t('tabs.greatValue'),
              },
              {
                id: 'recently-added',
                icon: '🆕',
                label: 'RECENTLY ADDED',
              },
              {
                id: 'near-campus',
                icon: '🎓',
                label: t('tabs.nearCampus'),
              },
              {
                id: 'on-campus',
                icon: '📚',
                label: 'ON CAMPUS',
              },
              {
                id: 'solo-living',
                icon: '🏃',
                label: t('tabs.soloLiving'),
              },
              {
                id: 'large-houses',
                icon: '🏰',
                label: 'Large Houses',
              },
            ].map((tab, index, array) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group relative inline-flex flex-col items-center px-1 pt-3 pb-2.5
                  min-w-[120px] ${
                    index === array.length - 1 ? 'mr-8' : ''
                  } ${
                  activeTab === tab.id
                    ? 'text-purple-600 font-bold'
                    : 'text-gray-500 hover:text-gray-700 font-medium'
                }
                `}
              >
                <span className="text-2xl mb-1.5">{tab.icon}</span>
                <span className="text-xs whitespace-nowrap px-2 uppercase tracking-tight">
                  {tab.label}
                </span>
                {activeTab === tab.id && (
                  <span className="text-xs text-gray-500 mt-0.5 px-2 normal-case">
                    {getTabCount(tab.id)} {tab.id === 'all-houses' ? 'houses' : 'properties'}
                  </span>
                )}
                {activeTab === tab.id ? (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-purple-600" />
                ) : (
                  <span className="absolute bottom-0 inset-x-0 h-0.5 bg-transparent group-hover:bg-gray-300 transition-colors" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add this near the top of the component with other state variables
  const [searchBarKey, setSearchBarKey] = useState<number>(0);

  const { favorites, isFavorite } = useFavorites();

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
          <Head>
            <title>Lboro Move | Student Housing Made Easy</title>
            <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
          </Head>
          {/* Hero Section */}
          <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
                  {t('hero.title')}
                </h1>
                <p className="max-w-xl mt-4 mx-auto text-lg text-gray-500">
                  {t('hero.subtitle')}
                </p>
                
                {/* SearchFilterBar */}
                <div className="mt-8 mb-4">
                  <SearchFilterBar 
                    key={`search-bar-loading-${searchBarKey}`}
                    initialPrice={filters.maxPrice}
                    initialBedrooms={filters.bedrooms}
                    onFilterChange={handleFilterChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Loading State */}
            <div className="flex flex-col items-center justify-center py-24">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mb-6"></div>
              <p className="text-xl text-gray-600">Loading properties...</p>
            </div>
          </main>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen">
        <Head>
          <title>Lboro Move | Student Housing Made Easy</title>
          <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🏡</text></svg>" />
        </Head>
        {/* Hero Section */}
        <section 
          id="hero-section"
          className={`bg-white relative z-30 ${showMap ? 'hidden' : ''}`}
        >
          <motion.div 
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8"
            animate={{ 
              opacity: isSticky ? 0 : 1,
              y: isSticky ? -20 : 0
            }}
            transition={{ 
              type: "spring",
              stiffness: 200,
              damping: 30,
              mass: 0.5,
              duration: 0.3
            }}
            layout="position"
          >
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
                {t('hero.title')}
              </h1>
              <p className="max-w-xl mt-4 mx-auto text-lg text-gray-500">
                {t('hero.subtitle')}
              </p>
              
              {/* SearchFilterBar */}
              <motion.div 
                className="mt-8 mb-4"
                layout="position"
                layoutId="search-bar"
              >
                <SearchFilterBar 
                  key={`search-bar-hero-${searchBarKey}`}
                  initialPrice={filters.maxPrice}
                  initialBedrooms={filters.bedrooms}
                  onFilterChange={handleFilterChange}
                />
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Sticky Search Bar */}
        <motion.div
          className={`fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 ${
            isSticky && !showMap ? 'block' : 'hidden'
          }`}
          initial={false}
          animate={{ 
            opacity: isSticky && !showMap ? 1 : 0,
            y: isSticky && !showMap ? 0 : -20
          }}
          transition={{ duration: 0.2 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <SearchFilterBar 
              key={`search-bar-sticky-${searchBarKey}`}
              initialPrice={filters.maxPrice}
              initialBedrooms={filters.bedrooms}
              onFilterChange={handleFilterChange}
            />
          </div>
        </motion.div>

        {/* Filter tabs - Moved outside hero section */}
        <div className={`bg-white ${showMap ? 'fixed top-16 left-0 right-0 z-40 border-b border-gray-200 shadow-sm' : 'relative'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <nav className="flex space-x-4 overflow-x-auto py-4 scrollbar-hide" aria-label="Filter tabs">
              {renderTabs()}
            </nav>
          </div>
        </div>

        {/* Property Grid or Map View - Always render, regardless of modal state */}
        <AnimatePresence mode="wait">
          {showMap ? (
            <motion.div
              key="map-view"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 top-[160px] bottom-0 z-20 h-[calc(100vh-160px)] overflow-hidden"
              style={{ height: 'calc(100vh - 160px)' }}
            >
              <div 
                id="map-container"
                className="w-full h-full relative"
              >
                <PropertyMap 
                  key={`map-view-${showMap}-${localFilteredProperties.length}-${Date.now()}`}
                  properties={localFilteredProperties}
                  onViewChange={handleViewToggle}
                  onPropertySelect={(property) => {
                    if (property && property.id) {
                      handlePropertySelect(property as Property);
                    }
                  }}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="list-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
                isSticky ? 'pt-4' : 'pt-6'
              } pb-16 md:pb-8 bg-transparent`}
            >
              <div className="max-w-7xl mx-auto">
                {queryError ? (
                  <div className="text-center text-red-500 py-12">
                    <p className="text-lg font-medium">
                      {(queryError as unknown) instanceof Error
                        ? (queryError as Error).message
                        : 'An error occurred'}
                    </p>
                    <button
                      onClick={() => window.location.reload()}
                      className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    {localFilteredProperties.length > 0 ? (
                      localFilteredProperties.map((property) => {
                        // Check if it's a campus property
                        const isCampusProperty = property.keyFeatures && 
                          typeof property.keyFeatures === 'object' && 
                          (property.keyFeatures as any).isCampusProperty;
                        
                        if (isCampusProperty) {
                          // Use CampusPropertyCard for campus properties
                          return (
                            <motion.div
                              key={property.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                            >
                              <CampusPropertyCard
                                property={{
                                  id: property.id,
                                  title: property.title,
                                  url: property.url || '',
                                  imageUrl: Array.isArray(property.images) && property.images.length > 0 ? property.images[0] : '',
                                  images: Array.isArray(property.images) ? property.images : [],
                                  priceRange: (property.keyFeatures as any).priceRange || `£${property.price} per week`,
                                  pricingOptions: (property.keyFeatures as any).pricingOptions || [],
                                  location: (property.keyFeatures as any).location || property.location || '',
                                  catering: (property.keyFeatures as any).catering || '',
                                  bathroomType: (property.keyFeatures as any).bathroomType || '',
                                }}
                                onMouseEnter={() => handlePropertyHover(property)}
                              />
                            </motion.div>
                          );
                        }
                        
                        // Use regular PropertyCard for non-campus properties
                        return (
                          <motion.div
                            key={property.id}
                            layout
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.2 }}
                          >
                            <PropertyCard
                              property={property}
                              isFavorite={isFavorite(property.id)}
                              onFavoriteChange={(propertyId, isFavorite) => {
                                // Optional: Add any additional UI updates here
                              }}
                              onMouseEnter={() => handlePropertyHover(property)}
                              onSelect={() => handlePropertySelect(property)}
                            />
                          </motion.div>
                        );
                      })
                    ) : (
                      <motion.div 
                        layout
                        className="col-span-full text-center py-12"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="max-w-2xl mx-auto">
                          <h2 className="text-2xl font-bold text-gray-900 mb-8">No properties found</h2>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Increase budget suggestion */}
                            <button
                              onClick={() => {
                                const newMaxPrice = (filters.maxPrice !== undefined ? filters.maxPrice : 190) + 50;
                                handleFilterChange({
                                  ...filters,
                                  maxPrice: newMaxPrice
                                });
                              }}
                              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4"
                            >
                              <div className="w-12 h-12 flex items-center justify-center text-3xl">
                                💰
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">Increase your budget</h3>
                                <p className="text-gray-500">Try £{((filters.maxPrice !== undefined ? filters.maxPrice : 190) + 50).toFixed(0)} per week</p>
                              </div>
                            </button>
                            
                            {/* Any bedrooms suggestion */}
                            <button
                              onClick={() => {
                                handleFilterChange({
                                  ...filters,
                                  bedrooms: undefined
                                });
                              }}
                              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4"
                            >
                              <div className="w-12 h-12 flex items-center justify-center text-3xl">
                                🛌
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">Any number of bedrooms</h3>
                                <p className="text-gray-500">See more options</p>
                              </div>
                            </button>
                          </div>
                          
                          {/* Reset all filters */}
                          <button
                            onClick={() => {
                              // First reset all filter state values
                              setFilters({
                                bedrooms: undefined,
                                bathrooms: undefined,
                                maxPrice: undefined
                              });
                              
                              // Then set active tab to all houses and force a reload of properties
                              setActiveTab('all-houses');
                              
                              // Update local filtered properties with all properties
                              setLocalFilteredProperties(properties);
                              
                              // Increment key to force re-render of search bars
                              setSearchBarKey(prev => prev + 1);
                            }}
                            className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4 w-full max-w-md mx-auto"
                          >
                            <div className="w-12 h-12 flex items-center justify-center text-3xl">
                              🔄
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg text-gray-900">Reset all filters</h3>
                              <p className="text-gray-500">Start a new search</p>
                            </div>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Map Toggle Button - Always show regardless of modal state */}
        <motion.div
          className="fixed z-[90] left-1/2 transform -translate-x-1/2"
          initial={false}
          animate={{ 
            bottom: isCurrentlyMobile ? (direction === 'down' && !isAtTop ? 20 : 88) : 20,
            scale: isCurrentlyMobile && direction === 'down' && !isAtTop ? 0.95 : 1
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <motion.button
            onClick={handleViewToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-full shadow-lg border border-gray-200/50 hover:bg-white/95 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={showMap ? "Switch to list view" : "Switch to map view"}
          >
            <motion.span 
              initial={false}
              animate={{ 
                rotate: showMap ? 180 : 0,
                scale: showMap ? 0.8 : 1
              }}
              transition={{ duration: 0.3 }}
              className="text-lg"
            >
              {showMap ? '📋' : '🗺️'}
            </motion.span>
            <motion.span 
              className="font-medium text-sm text-black uppercase tracking-wide"
              initial={false}
              animate={{ 
                opacity: 1,
                x: 0
              }}
              transition={{ duration: 0.2 }}
            >
              {showMap ? 'List' : 'Map'}
            </motion.span>
          </motion.button>
        </motion.div>

        {/* Modal Backdrop - Only render when modal is active, but preserve background */}
        {selectedProperty && (
          <motion.div 
            className="fixed inset-0 z-50 pointer-events-auto bg-black bg-opacity-50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2 }}
            onClick={handleCloseModal}
          />
        )}

        {/* Property Modal - Only render when active, with proper styling */}
        <div className="pointer-events-none">
          {selectedProperty ? (
            <PropertyModal
              key={selectedProperty}
              slug={selectedProperty}
              onClose={handleCloseModal}
              isCampusProperty={
                Boolean(properties.find(p => 
                  (generatePropertySlug(p) === selectedProperty || p.id.toString() === selectedProperty) && 
                  p.keyFeatures && 
                  typeof p.keyFeatures === 'object' && 
                  (p.keyFeatures as any).isCampusProperty
                ))
              }
              preventReload={true}
              property={properties.find(p => generatePropertySlug(p) === selectedProperty || p.id.toString() === selectedProperty)}
            />
          ) : null}
        </div>
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  locale,
}: {
  locale?: string;
}) => {
  try {
    // Get campus properties from JSON file with keyFeatures
    const campusProperties = getCampusPropertiesWithKeyFeatures();
    
    return {
      props: {
        ...(await serverSideTranslations(locale || 'en', ['common'])),
        campusProperties,
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      props: {
        ...(await serverSideTranslations(locale || 'en', ['common'])),
        campusProperties: [],
      },
    };
  }
};

function getPropertyCount(
  allProperties: Property[],
  activeTab: string
): number {
  if (!allProperties) return 0;

  switch (activeTab) {
    case 'all-houses':
      return allProperties.length;
    case 'golden-triangle':
      return allProperties.filter((p: Property) => p.isGoldenTriangle === true)
        .length;
    case 'silver-square':
      return allProperties.filter((p: Property) => {
        const silverSquareStreets = [
          'burleigh road',
          'york road',
          'william street',
          'seward street',
          'radmoor road',
          'arthur street',
          'curzon street',
          'heathcoat street',
          'caldwell street',
          'frederick street'
        ];
        
        // Check both location and street fields
        const location = (p.location || '').toLowerCase();
        const street = (p.street || '').toLowerCase();
        const title = (p.title || '').toLowerCase();
        
        return silverSquareStreets.some(streetName => 
          location.includes(streetName) || 
          street.includes(streetName) || 
          title.includes(streetName)
        );
      }).length;
    case 'great-value':
      const greatValueCount = allProperties.filter(
        (p) => p.price <= 135
      ).length;
      console.log('Great Value properties count:', greatValueCount);
      return greatValueCount;
    case 'solo-living':
      return allProperties.filter((p) => p.rooms === 1).length;
    case 'large-houses':
      return allProperties.filter((p) => p.rooms >= 5).length;
    case 'near-campus':
      return allProperties.filter((p) => isCloseToUniversity(p)).length;
    case 'on-campus':
      // Implement your on-campus logic here
      return 0;
    case 'driveway-parking':
      // Implement your driveway parking logic here
      return 0;
    case 'en-suite':
      return allProperties.filter((p: Property) =>
        p.amenities?.some((a: string) => {
          const amenity = a.toLowerCase();
          return amenity.includes('en-suite') || amenity.includes('ensuite');
        })
      ).length;
    case 'bills-included':
      return allProperties.filter((p: Property) =>
        p.amenities?.some(
          (a: string) =>
            a.toLowerCase().includes('bills included') ||
            a.toLowerCase().includes('all bills included')
        )
      ).length;
    default:
      return allProperties.length;
  }
}
