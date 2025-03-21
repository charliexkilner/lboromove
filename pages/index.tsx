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
import PropertyModal from '../components/PropertyModal';
import ErrorBoundary from '../components/ErrorBoundary';
import { fetchAPI } from '../utils/api';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { usePropertyStore } from '../stores/usePropertyStore';
import { getPropertyIdFromSlug } from '@/utils/url';
import SearchFilterBar from '../components/SearchFilterBar';
import { getCampusPropertiesAsProperties, getCampusPropertiesWithKeyFeatures } from '../utils/campusProperties';
import CampusPropertyModal from '../components/CampusPropertyModal';
import CampusPropertyCard from '../components/CampusPropertyCard';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

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

  const {
    data,
    isLoading,
    error: queryError,
  }: {
    data: any;
    isLoading: boolean;
    error: unknown;
  } = useQuery({
    queryKey: ['properties', filters],
    queryFn: async () => {
      try {
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

        const response = await fetchAPI(
          `/api/properties?${queryParams.toString()}`
        );
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
    const handleRouteChange = (url: string) => {
      const propertyMatch = url.match(/\/house\/(.*?)$/);
      if (propertyMatch) {
        const propertyId = getPropertyIdFromSlug(propertyMatch[1]);
        setSelectedProperty(propertyId);
      }
    };

    // Check initial URL
    handleRouteChange(router.asPath);

    // Listen for route changes
    router.events.on('routeChangeComplete', handleRouteChange);
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
    };
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
          // Check if price property exists and is a number
          if (typeof p.price !== 'number') return false;
          // Filter for price less than or equal to max price
          return p.price <= newFilters.maxPrice;
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

    // Filter properties based on the selected tab
    let filtered;
    switch (tabName) {
      case 'all-houses':
        filtered = properties;
        break;
      case 'golden-triangle':
        filtered = properties.filter((p) => p.isGoldenTriangle === true);
        break;
      case 'great-value':
        filtered = properties.filter((p) => p.price <= 135);
        break;
      case 'solo-living':
        filtered = properties.filter((p) => p.rooms === 1);
        break;
      case 'large-houses':
        filtered = properties.filter((p) => p.rooms >= 5);
        break;
      case 'near-campus':
        // First filter properties that have coordinates
        const propertiesWithCoordinates = properties.filter(
          (p) => p.latitude && p.longitude
        );
        
        // Then filter properties that are close to university
        filtered = propertiesWithCoordinates.filter((p) => isCloseToUniversity(p));
        
        console.log('Near Campus filtered properties:', filtered.length, 'out of', propertiesWithCoordinates.length);
        break;
      case 'on-campus':
        // Filter properties that are on campus using keyFeatures
        filtered = properties.filter((p: Property) => {
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
        filtered = properties.filter((p: Property) => {
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
        filtered = properties.filter((p: Property) => {
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
        
        filtered = properties.filter((p: Property) => {
          // Check if createdAt exists and is a valid date string
          if (!p.createdAt) return false;
          
          // Parse the date string
          const createdDate = new Date(p.createdAt);
          
          // Check if the property was created in the last two weeks
          return createdDate >= twoWeeksAgo;
        });
        
        console.log('Recently Added filtered properties:', filtered.length, 'out of', properties.length);
        break;
      default:
        filtered = properties;
    }

    console.log(`Tab ${tabName} filtered properties: ${filtered.length} out of ${properties.length}`);
    
    // Update the local state with filtered properties
    setLocalFilteredProperties(filtered);
    
    // Important: Clear any existing filters to avoid conflicts
    setFilters({
      bedrooms: undefined,
      bathrooms: undefined,
      maxPrice: undefined,
    });
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

  // Add this to PropertyCard hover handler
  const handlePropertyHover = (property: Property) => {
    prefetchProperty(property.id);
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

  // Add this useEffect to handle URL changes and show the property modal
  useEffect(() => {
    // Check if the URL contains a property slug
    const { pathname } = router;
    if (pathname.startsWith('/house/')) {
      const slug = pathname.replace('/house/', '');
      setSelectedProperty(slug);
    } else {
      setSelectedProperty(null);
    }
  }, [router.pathname]);

  // Determine which modal to show based on the property type
  const renderPropertyModal = () => {
    if (!selectedProperty) return null;
    
    const property = properties.find(p => p.id.toString() === selectedProperty);
    
    // Check if it's a campus property using keyFeatures
    const isCampusProperty = property && property.keyFeatures && 
      typeof property.keyFeatures === 'object' && 
      (property.keyFeatures as any).isCampusProperty;
    
    if (isCampusProperty) {
      return (
        <PropertyModal
          slug={selectedProperty}
          onClose={() => setSelectedProperty(null)}
          isCampusProperty={true}
        />
      );
    }
    
    // Regular property modal
    return (
      <PropertyModal
        slug={selectedProperty}
        onClose={() => setSelectedProperty(null)}
      />
    );
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
          // Force immediate re-render of properties to ensure fresh image loading
          const timestamp = Date.now();
          const propertiesToShow = localFilteredProperties.length > 0 
            ? localFilteredProperties 
            : properties;
          
          // Create new property objects with fresh keys
          const updatedProperties = propertiesToShow.map(property => ({
            ...property,
            _viewKey: timestamp, // Add a unique key for this view transition
            images: Array.isArray(property.images) 
              ? [...property.images] 
              : property.images
          }));
          
          // Update properties state with new references
          setProperties(updatedProperties);
          
          // After a short delay, start preloading images
          setTimeout(() => {
            updatedProperties.slice(0, 12).forEach(property => {
              if (property.images && Array.isArray(property.images)) {
                property.images.slice(0, 2).forEach(imgUrl => {
                  if (typeof imgUrl === 'string' && imgUrl) {
                    const img = new window.Image();
                    img.src = imgUrl;
                  }
                });
              }
            });
          }, 50);
          
          // Ensure smooth scroll position
          requestAnimationFrame(() => {
            window.scrollTo({
              top: window.scrollY,
              behavior: 'auto'
            });
          });
        } else { // Switching to map view
          // When switching to map view, ensure the map renders properly
          setTimeout(() => {
            const mapElement = document.querySelector('.mapboxgl-map');
            if (mapElement) {
              window.dispatchEvent(new Event('resize'));
            }
          }, 300);
        }
      } catch (error) {
        console.error('Error during view transition:', error);
      }
    };
    
    // Execute the view transition
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
                id: 'driveway-parking',
                icon: '🚗',
                label: 'DRIVEWAY PARKING',
              },
              {
                id: 'rare-finds',
                icon: '✨',
                label: t('tabs.rareFinds'),
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

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-50">
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
                    initialPrice={undefined}
                    initialBedrooms={undefined}
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
      <div className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section 
          id="hero-section"
          className="bg-white relative z-30"
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
                  initialPrice={filters.maxPrice}
                  initialBedrooms={undefined}
                  onFilterChange={handleFilterChange}
                />
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Single Top Navbar */}
        <motion.nav
          className="fixed top-0 left-0 right-0 z-[998] will-change-transform"
          animate={{ 
            y: 0,
            opacity: 1
          }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 30
          }}
        >
          <div className="bg-white/70 backdrop-filter backdrop-blur-lg border-b w-full">
            <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
              {/* Logo - Hidden on mobile when sticky */}
              <div className={`md:w-48 ${isSticky ? 'hidden md:block' : ''}`}>
                <Link href="/" className="flex items-center">
                  <span className="text-2xl font-bold text-purple-600">
                    LBOROMOVE
                  </span>
                </Link>
              </div>

              {/* Navigation Links or Search Bar */}
              <div className="flex-1 flex justify-center">
                {isSticky ? (
                  <div className="w-full max-w-md mx-auto">
                    <div className="flex items-center bg-white rounded-full shadow-sm border border-gray-200">
                      <div className="flex-1 flex items-center divide-x divide-gray-200">
                        <div className="flex items-center px-3 py-2">
                          <span className="text-base mr-2">🛏️</span>
                          <select
                            value={filters.bedrooms || ''}
                            onChange={(e) => handleFilterChange({ ...filters, bedrooms: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="w-24 bg-transparent border-none focus:ring-0 text-gray-900 text-sm font-medium"
                          >
                            <option value="">Any beds</option>
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                              <option key={num} value={num}>{num} {num === 1 ? 'bed' : 'beds'}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center px-3 py-2">
                          <span className="text-base mr-2">💰</span>
                          <select
                            value={filters.maxPrice || ''}
                            onChange={(e) => handleFilterChange({ ...filters, maxPrice: e.target.value ? parseInt(e.target.value) : undefined })}
                            className="w-24 bg-transparent border-none focus:ring-0 text-gray-900 text-sm font-medium"
                          >
                            <option value="">Any price</option>
                            <option value="95">Up to £95</option>
                            <option value="115">Up to £115</option>
                            <option value="135">Up to £135</option>
                            <option value="155">Up to £155</option>
                            <option value="175">£155+</option>
                          </select>
                        </div>
                      </div>
                      <button
                        onClick={() => handleFilterChange(filters)}
                        className="flex items-center justify-center w-10 h-10 bg-purple-600 hover:bg-purple-700 text-white rounded-full m-1 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="hidden md:flex space-x-8">
                    <Link
                      href="/"
                      className={`px-1 py-2 border-b-2 font-medium ${
                        pathname === '/'
                          ? 'border-purple-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      HOUSES
                    </Link>
                    <Link
                      href="/discussion"
                      className={`px-1 py-2 border-b-2 font-medium ${
                        pathname === '/discussion'
                          ? 'border-purple-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      DISCUSSION
                    </Link>
                    <Link
                      href="/tools"
                      className={`px-1 py-2 border-b-2 font-medium ${
                        pathname === '/tools'
                          ? 'border-purple-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      }`}
                    >
                      TOOLS
                    </Link>
                  </div>
                )}
              </div>

              {/* Language Selector - Hidden on mobile when sticky */}
              <div className={`md:w-48 flex justify-end items-center gap-3 ${isSticky ? 'hidden md:flex' : ''}`}>
                <select
                  value={locale}
                  onChange={(e) => {
                    router.push(router.pathname, router.asPath, {
                      locale: e.target.value,
                    });
                  }}
                  className="border border-gray-300 rounded-md py-1 px-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="en">🇬🇧 English</option>
                  <option value="hi">🇮🇳 हिंदी</option>
                  <option value="zh">🇨🇳 中文</option>
                </select>
              </div>
            </div>
          </div>

          {/* Filter Tabs - Only show when sticky */}
          {isSticky && (
            <motion.div 
              className="bg-white border-t border-gray-100/50"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {renderTabs()}
            </motion.div>
          )}
        </motion.nav>

        {/* Main Content */}
        <motion.main 
          className={`${isSticky ? 'mt-32' : ''} bg-transparent will-change-transform`}
          style={{ 
            position: 'relative',
            zIndex: 20
          }}
          layout="position"
        >
          {/* Tab Navigation - Only show when not sticky */}
          {!isSticky && (
            <div className="relative w-full">
              {renderTabs()}
            </div>
          )}

          {/* Property Grid or Map View */}
          <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
            isSticky ? 'pt-4' : 'pt-6'
          } pb-16 md:pb-8 transition-all duration-200 bg-transparent`}>
            {showMap ? (
              <div 
                id="map-container"
                className="w-full mx-auto" 
                style={{
                  position: 'relative',
                  height: 'calc(100vh - 200px)',
                  minHeight: '600px',
                  display: 'block',
                  overflow: 'hidden',
                  transform: 'translateZ(0)',
                  willChange: 'transform',
                  backfaceVisibility: 'hidden',
                  contain: 'layout paint size'
                }}
              >
                <PropertyMap 
                  key={`map-view-${showMap}-${localFilteredProperties.length}-${Date.now()}`}
                  properties={localFilteredProperties.length > 0 ? localFilteredProperties : properties} 
                  onViewChange={handleViewToggle} 
                />
              </div>
            ) : (
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
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {localFilteredProperties.length > 0 ? (
                        localFilteredProperties.map((property) => {
                          // Check if it's a campus property
                          const isCampusProperty = property.keyFeatures && 
                            typeof property.keyFeatures === 'object' && 
                            (property.keyFeatures as any).isCampusProperty;
                          
                          if (isCampusProperty) {
                            // Use CampusPropertyCard for campus properties
                            return (
                              <CampusPropertyCard
                                key={property.id}
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
                            );
                          }
                          
                          // Use regular PropertyCard for non-campus properties
                          return (
                            <PropertyCard
                              key={property.id}
                              property={property}
                              onMouseEnter={() => handlePropertyHover(property)}
                            />
                          );
                        })
                      ) : (
                        <div className="col-span-full text-center py-12">
                          <p className="text-lg text-gray-500">No properties found matching your criteria.</p>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.main>

        {/* Floating Map Toggle Button - Repositioned based on bottom navbar visibility */}
        <motion.div
          className="fixed z-[90] left-1/2 transform -translate-x-1/2"
          animate={{ 
            bottom: isCurrentlyMobile ? (direction === 'down' && !isAtTop ? 20 : 88) : 20,
            scale: isCurrentlyMobile && direction === 'down' && !isAtTop ? 0.95 : 1
          }}
          transition={{ duration: 0.2 }}
        >
          <button
            onClick={handleViewToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-full shadow-lg border border-gray-200/50 hover:bg-white/95 transition-all"
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
        </motion.div>

        {/* Property Modal */}
        {renderPropertyModal()}
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
    case 'great-value':
      // Log the count to debug
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
