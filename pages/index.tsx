import { AdjustmentsHorizontalIcon, MapIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { GetServerSideProps } from 'next/types';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { isCloseToUniversity } from '../utils/distance';
import Navbar from '../components/Navbar';
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

export default function Home({ campusProperties = [] }: HomeProps) {
  const { t } = useTranslation('common');
  const router = useRouter();
  const { locale } = router;
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
  const [localFilteredProperties, setLocalFilteredProperties] = useState<
    Property[]
  >([]);
  const [showMap, setShowMap] = useState(false);
  
  // Add scroll position state
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isSticky, setIsSticky] = useState(false);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const {
    properties,
    filteredProperties,
    setProperties,
    setActiveTab,
    activeTab,
  } = usePropertyStore();

  // Add debounce function
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  // Handle scroll events with optimizations
  const handleScroll = useCallback(() => {
    const position = window.pageYOffset;
    setScrollPosition(position);
    
    if (heroSectionRef.current) {
      const heroBottom = heroSectionRef.current.offsetTop + heroSectionRef.current.clientHeight;
      // Only update isSticky state if it actually changes
      const shouldBeSticky = position > heroBottom - 80;
      if (shouldBeSticky !== isSticky) {
        setIsSticky(shouldBeSticky);
      }
    }
  }, [isSticky]);
  
  // Optimized scroll handler for map view
  const debouncedHandleScroll = useCallback(
    debounce(() => {
      if (showMap) {
        // Use more aggressive debouncing for map view
        const position = window.pageYOffset;
        
        // Only update scroll position if it's changed significantly to reduce rerenders
        if (Math.abs(position - scrollPosition) > 5) {
          setScrollPosition(position);
        }
        
        if (heroSectionRef.current) {
          const heroBottom = heroSectionRef.current.offsetTop + heroSectionRef.current.clientHeight;
          // Only update isSticky state if it actually changes
          const shouldBeSticky = position > heroBottom - 80;
          if (shouldBeSticky !== isSticky) {
            setIsSticky(shouldBeSticky);
          }
        }
      } else {
        handleScroll();
      }
    }, showMap ? 20 : 0),
    [handleScroll, showMap, scrollPosition, isSticky]
  );

  // Add scroll event listener with the optimized handler
  useEffect(() => {
    window.addEventListener('scroll', debouncedHandleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [debouncedHandleScroll]);

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
    setShowMap(!showMap);
    console.log('Toggling between map and list view');
    
    // Reset any performance optimizations that might be affecting map display
    if (!showMap) {
      // Wait for the state to update before attempting to resize the map
      setTimeout(() => {
        const mapElement = document.querySelector('.mapboxgl-map');
        if (mapElement) {
          // Force a resize event on the map
          window.dispatchEvent(new Event('resize'));
          console.log('Triggered window resize for map');
        }
      }, 300);
    }
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
        className={`relative flex items-center ${
          isSticky ? 'bg-white/70 backdrop-filter backdrop-blur-lg' : 'bg-white'
        }`}
      >
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
        {/* Scroll Indicator with glassmorphic effect */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-white/70 via-white/50 to-transparent backdrop-blur-sm pl-8 pr-2">
          <button
            onClick={() => scroll('right')}
            className="p-2 rounded-full hover:bg-white/80 bg-white/50 shadow-sm backdrop-blur-sm"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
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

          <FloatingViewToggleButton />
          {renderPropertyModal()}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        {/* Sticky header that appears when scrolling */}
        <div 
          className={`fixed top-0 left-0 right-0 z-[40] transition-transform duration-300 transform will-change-transform ${
            isSticky ? 'translate-y-0' : '-translate-y-full'
          } ${isSticky ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          style={{ 
            transitionProperty: 'transform, opacity',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          <div className="bg-white/70 backdrop-filter backdrop-blur-lg shadow-md border-b border-gray-200/50">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-center py-2 px-4 sm:px-6 lg:px-8">
                {/* Logo on left */}
                <div className="mr-4">
                  <span className="text-xl font-bold text-purple-600">LboroMove</span>
                </div>
                
                {/* Compact SearchFilterBar in the middle */}
                <div className="flex-grow max-w-xl mx-auto">
                  <SearchFilterBar 
                    initialPrice={filters.maxPrice}
                    initialBedrooms={filters.bedrooms}
                    onFilterChange={handleFilterChange}
                    isCompact={true}
                  />
                </div>
                
                {/* Toggle Map/List View Button */}
                <div className="ml-2 md:ml-4 flex-shrink-0">
                  <button
                    onClick={handleViewToggle}
                    className="flex items-center gap-1 px-2 py-1.5 sm:px-3 bg-white/70 backdrop-blur-sm rounded-lg border border-gray-200/70 hover:bg-white/90 transition-colors shadow-sm"
                  >
                    {showMap ? (
                      <>
                        <span className="text-lg">📋</span>
                        <span className="font-medium text-xs text-black uppercase tracking-wide hidden sm:inline">List</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg">🗺️</span>
                        <span className="font-medium text-xs text-black uppercase tracking-wide hidden sm:inline">Map</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              
              {/* Tabs in sticky header */}
              <div ref={tabsRef} className="border-t border-gray-100/50">
                {renderTabs()}
              </div>
            </div>
          </div>
        </div>
        
        {/* Original Navbar */}
        <Navbar />
        
        {/* Hero Section with SearchFilterBar */}
        <div className="bg-white" ref={heroSectionRef}>
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
                  initialPrice={filters.maxPrice}
                  initialBedrooms={filters.bedrooms}
                  onFilterChange={handleFilterChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main 
          className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 transition-all duration-300 ${isSticky ? 'mt-10 sm:mt-12' : ''}`}
          style={{ 
            contain: showMap ? 'paint layout' : 'none',
            willChange: showMap ? 'transform' : 'auto'
          }}  
        >
          {/* Tab Navigation - Original location that will be replaced by sticky tabs when scrolling */}
          <div className={`relative -mx-4 sm:-mx-6 lg:-mx-8 ${isSticky ? 'invisible h-0 overflow-hidden' : 'visible'}`}>
            {renderTabs()}
          </div>

          {/* Property Grid or Map View */}
          <div className={`${isSticky ? 'pt-2' : 'pt-6'} transition-padding duration-200`}>
            {showMap ? (
              <div 
                id="map-container"
                className="max-w-full mx-auto h-[80vh]" 
                style={{
                  position: 'relative',
                  minHeight: '600px',
                  display: 'block',
                  overflow: 'hidden'
                }}
              >
                <PropertyMap 
                  key={`map-view-${showMap}-${properties.length}`}
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
        </main>

        {/* Show the floating view toggle button */}
        <FloatingViewToggleButton />
        {renderPropertyModal()}
      </div>
    </ErrorBoundary>
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
