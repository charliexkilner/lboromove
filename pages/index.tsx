import { AdjustmentsHorizontalIcon, MapIcon, ListBulletIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { GetServerSideProps } from 'next/types';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { isCloseToUniversity } from '../utils/distance';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import PropertyCard from '../components/PropertyCard';
import { Property } from '@prisma/client';
import DiscussionCard from '../components/DiscussionCard';
import { Discussion } from '../types/discussion';
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
import { useProperties } from '../hooks/useProperties';
import { getTranslationsProps } from '../lib/i18n-helper';

// Add a type declaration at the top of the file, after imports
// Add TypeScript global Window interface extension
declare global {
  interface Window {
    errorCheckInterval?: NodeJS.Timeout;
  }
}

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
  initialProperties: Property[];
  initialActiveTab: string;
  initialFilters: Record<string, any>;
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

const TAB_FILTERS = {
  'all-houses': {},
  'golden-triangle': { isGoldenTriangle: true },
  'silver-square': { silverSquare: true },
  'great-value': { maxPrice: 135 },
  'solo-living': { bedrooms: 1 },
  'large-houses': { minBedrooms: 5 },
  'near-campus': { nearCampus: true },
  'on-campus': { onCampus: true },
  'driveway-parking': { parking: true },
  'en-suite': { ensuite: true },
  'bills-included': { billsIncluded: true },
  'rare-finds': { rareFinds: true },
  'recently-added': { recentlyAdded: true },
};

const getTabApiParams = (tabId: string): Record<string, any> => {
  const params: Record<string, any> = {};
  switch (tabId) {
    case 'all-houses':
      break;
    case 'golden-triangle':
      params.isGoldenTriangle = true;
      break;
    case 'silver-square':
      params.silverSquare = true;
      break;
    case 'great-value':
      params.maxPrice = 135;
      break;
    case 'solo-living':
      params.bedrooms = 1;
      break;
    case 'large-houses':
      params.minBedrooms = 5;
      break;
    case 'near-campus':
      params.nearCampus = true;
      break;
    case 'on-campus':
      params.onCampus = true;
      break;
    case 'driveway-parking':
      params.parking = true;
      break;
    case 'en-suite':
      params.ensuite = true;
      break;
    case 'bills-included':
      params.billsIncluded = true;
      break;
    case 'rare-finds':
      params.rareFinds = true;
      break;
    case 'recently-added':
      params.recentlyAdded = true;
      break;
    default:
      break;
  }
  return params;
};

export default function Home({
  campusProperties,
  initialProperties,
  initialActiveTab,
  initialFilters
}: HomeProps) {
  const { t, i18n } = useTranslation('common');
  console.log('[Home Component] Render. Locale:', i18n.language, 't(hero.title):', t('hero.title'));
  const router = useRouter();
  const { locale, pathname } = router;
  // Split the filters into visible user filters (shown in search bar) and internal filters (used for querying)
  const [userFilters, setUserFilters] = useState<{
    bedrooms?: number;
    maxPrice?: number;
  }>({
    bedrooms: initialFilters.bedrooms,
    maxPrice: initialFilters.maxPrice
  });
  
  // Internal filters used for actual querying - combines user filters and tab filters
  const [filters, setFilters] = useState<{
    bedrooms?: number;
    maxPrice?: number;
    storedBedrooms?: number;
    storedMaxPrice?: number;
    [key: string]: any;
  }>(initialFilters);
  
  // Stabilize the filters to prevent unnecessary re-renders
  const stableFilters = useMemo(() => {
    return filters;
  }, [JSON.stringify(filters)]);
  
  // Properties list state with infinite scroll
  const {
    properties,
    loading: propertiesLoading,
    hasMore: propertiesHasMore,
    loadMore: propertiesLoadMore,
    error,
    reset: propertiesReset,
    fetchAllForMap,
    allMapProperties
  } = useProperties(filters, initialProperties);
  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [localFilteredProperties, setLocalFilteredProperties] = useState<Property[]>([]);
  const [showMap, setShowMap] = useState(false);
  const [tabCounts, setTabCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchBarKey, setSearchBarKey] = useState<number>(0);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const heroSectionRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const previousPathRef = useRef<string>('');
  const scrollPositionsRef = useRef<Map<string, number>>(new Map());
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
  
  const { favorites, isFavorite } = useFavorites();
  
  // Add the queryClient initialization at the top of the component
  const queryClient = useQueryClient();
  
  // Add a ref to track previous filter values
  const prevUserFiltersRef = useRef<{ bedrooms?: number; maxPrice?: number }>({});
  
  // Fetch counts on mount and when user filters change
  useEffect(() => {
    // Create an abort controller for this effect
    const controller = new AbortController();
    const signal = controller.signal;

    // Define the actual fetching logic inside the effect
    const doFetchTabCounts = async () => {
      setLoadingCounts(true);
      try {
        const tabsToFetch = [
          'all-houses',
          'golden-triangle',
          'silver-square',
          'great-value',
          'solo-living',
          'large-houses',
          'near-campus',
          'on-campus',
          'recently-added'
        ];
        
        const newCounts: Record<string, number> = {};
        const userFilterParams: Record<string, string> = {};
        if (userFilters.bedrooms !== undefined) {
          userFilterParams.bedrooms = String(userFilters.bedrooms);
        }
        if (userFilters.maxPrice !== undefined) {
          userFilterParams.maxPrice = String(userFilters.maxPrice);
        }
        
        await Promise.all(tabsToFetch.map(async (tabId) => {
          if (signal.aborted) return;
          try {
            const tabFilters = getTabApiParams(tabId);
            const tabParamsAsStrings: Record<string, string> = {};
            Object.entries(tabFilters).forEach(([key, value]) => {
              if (value !== undefined && value !== null) {
                tabParamsAsStrings[key] = String(value);
              }
            });
            
            let filteredUserParams = {...userFilterParams};
            if ('bedrooms' in tabParamsAsStrings || 'minBedrooms' in tabParamsAsStrings) {
              delete filteredUserParams.bedrooms;
            }
            if ('maxPrice' in tabParamsAsStrings) {
              delete filteredUserParams.maxPrice;
            }
            
            const query = new URLSearchParams({
              ...filteredUserParams,
              ...tabParamsAsStrings,
              countOnly: 'true'
            });
            
            const res = await fetch(`/api/properties?${query.toString()}`, { signal });
            if (signal.aborted) return;
            if (!res.ok) throw new Error(`Failed to fetch count for ${tabId}`);
            const data = await res.json();
            if (signal.aborted) return;
            newCounts[tabId] = data.total || 0;
          } catch (error) {
            if (!(error instanceof DOMException && error.name === 'AbortError')) {
              console.error(`Error fetching count for ${tabId}:`, error);
            }
          }
        }));
        
        if (!signal.aborted) {
          setTabCounts(newCounts);
        }
      } catch (error) {
        if (!signal.aborted) {
           console.error('Error fetching counts:', error);
        }
      } finally {
        if (!signal.aborted) {
          setLoadingCounts(false);
        }
      }
    };

    doFetchTabCounts();
    
    // Cleanup function to abort fetch if component unmounts or dependencies change
    return () => {
      controller.abort();
    };
  }, [userFilters]); // Only depends on userFilters

  const getTabCount = (tabId: string): number => {
    return tabCounts[tabId] || 0;
  };

  // Create a wrapper for loadMore to track loading state
  const handleLoadMore = useCallback(() => {
    if (!propertiesLoading && !loadingMore && propertiesHasMore) {
      setLoadingMore(true);
      // Call loadMore and handle the Promise if it returns one
      try {
        propertiesLoadMore();
      } catch (error) {
        console.error('Error loading more properties:', error);
      } finally {
        // Always reset loading state
        setTimeout(() => setLoadingMore(false), 500);
      }
    }
  }, [propertiesLoading, loadingMore, propertiesHasMore, propertiesLoadMore]);

  // Update the useEffect for the intersection observer
  useEffect(() => {
    // Skip setting up observer if no target ref or already loading
    if (!observerTarget.current) return;
    
    // Create a new observer that triggers when the target is 300px from the viewport
    const observer = new IntersectionObserver(
      entries => {
        // Only trigger loadMore if we're not already loading and we have more items
        if (entries[0].isIntersecting && propertiesHasMore && !propertiesLoading && !loadingMore) {
          console.log('Intersection observer triggered loadMore');
          handleLoadMore();
        }
      },
      { 
        threshold: 0.1, 
        rootMargin: '300px'  // Increased margin to load earlier
      }
    );

    // Start observing the target element
    observer.observe(observerTarget.current);

    // Cleanup function to disconnect the observer when component unmounts
    return () => {
      observer.disconnect();
    };
  }, [propertiesHasMore, handleLoadMore, propertiesLoading, loadingMore]);
  
  // Update the handleTabChange function to more robustly handle tab switching
  const handleTabChange = (tabName: string) => {
    // Don't do anything if the tab is already active
    if (activeTab === tabName) {
      return;
    }
    
    console.log(`Switching to tab ${tabName} from ${activeTab}`);
    
    // Abort any in-progress fetches
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      // Create a new one for subsequent fetches by useProperties
      abortControllerRef.current = new AbortController(); 
    }
        
    // Update the active tab immediately for better UX
    setActiveTab(tabName);
    
    // Get the tab-specific filters
    const tabFilters = getTabApiParams(tabName);
    
    // Determine user filters to apply, considering tab-specific overrides
    let updatedUserFilters = {...userFilters};

    // If the new tab has specific bedroom requirements, don't use user's bedroom filter
    if (tabFilters.bedrooms !== undefined || tabFilters.minBedrooms !== undefined) {
      updatedUserFilters.bedrooms = undefined; 
    }
    // If the new tab has a specific maxPrice, don't use user's maxPrice filter
    if (tabFilters.maxPrice !== undefined) {
      updatedUserFilters.maxPrice = undefined;
    }
    
    const combinedFilters = {
      ...tabFilters, // Tab filters take precedence
      // Apply remaining user filters if not overridden by tab
      ...(updatedUserFilters.bedrooms !== undefined ? { bedrooms: updatedUserFilters.bedrooms } : {}),
      ...(updatedUserFilters.maxPrice !== undefined ? { maxPrice: updatedUserFilters.maxPrice } : {}),
    };
    
    console.log(`Tab change to ${tabName} - combined filters:`, combinedFilters);
    
    // Reset properties and trigger a new fetch via useProperties hook
    propertiesReset(); 
    setFilters(combinedFilters); // This will trigger the useEffect in useProperties
    
    // Update URL
    const queryForRouter = {
      tab: tabName,
      ...(updatedUserFilters.bedrooms ? { bedrooms: updatedUserFilters.bedrooms } : {}),
      ...(updatedUserFilters.maxPrice ? { maxPrice: updatedUserFilters.maxPrice } : {}),
    };

    router.push(
      {
        pathname: '/',
        query: queryForRouter,
      },
      undefined,
      { 
        shallow: true,
        scroll: false // Prevent page from scrolling to top on tab change
      }
    );
  };

  // Handle window resize for mobile detection
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 0);
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const isCurrentlyMobile = windowWidth < 768;

  const {
    properties: propertiesStore,
    filteredProperties,
    setProperties,
    setActiveTab,
    activeTab,
  } = usePropertyStore();

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

  // Set localFilteredProperties based on the properties from useProperties
  useEffect(() => {
    if (properties.length > 0) {
      setLocalFilteredProperties(properties);
      // Also sync with property store
      setProperties(properties);
    } else if (initialProperties.length > 0 && properties.length === 0) {
      // Fall back to initial properties if no properties loaded yet
      setLocalFilteredProperties(initialProperties);
      setProperties(initialProperties);
    }
  }, [properties, setProperties, initialProperties]);

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

  // Update handleFilterChange to modify userFilters state and immediately apply the changes
  const handleFilterChange = (newFilters: any) => {
    console.log('Filter changed:', newFilters);
    
    // Only update if filters actually changed
    if (
      userFilters.bedrooms !== newFilters.bedrooms ||
      userFilters.maxPrice !== newFilters.maxPrice
    ) {
      const updatedFilters = {
        bedrooms: newFilters.bedrooms,
        maxPrice: newFilters.maxPrice === 500 ? undefined : newFilters.maxPrice
      };
      
      // Update user filters state
      setUserFilters(updatedFilters);
      
      // Set the active tab to 'all-houses' when filter changes
      setActiveTab('all-houses');
      
      // Apply the filters immediately
      setFilters(updatedFilters);
      
      // Update URL to reflect filter changes
      router.push(
        {
          pathname: '/',
          query: {
            tab: 'all-houses',
            ...(updatedFilters.bedrooms ? { bedrooms: updatedFilters.bedrooms } : {}),
            ...(updatedFilters.maxPrice ? { maxPrice: updatedFilters.maxPrice } : {})
          }
        },
        undefined,
        { shallow: true }
      );
      
      console.log('Applied filters immediately:', updatedFilters);
    }
  };
  
  // New function to handle search button click
  const handleSearchClick = () => {
    // Only set loading state for the properties section
    const propertiesSection = document.querySelector('.property-grid-section');
    if (propertiesSection) {
      propertiesSection.classList.add('opacity-50', 'pointer-events-none');
    }
    
    // Set the active tab to 'all-houses' when performing a search
    setActiveTab('all-houses');
    
    // Apply the user filters
    setFilters(userFilters);
    
    // Update URL with a minimal delay to batch state updates
    setTimeout(() => {
      router.push(
        {
          pathname: '/',
          query: {
            tab: 'all-houses',
            ...(userFilters.bedrooms ? { bedrooms: userFilters.bedrooms } : {}),
            ...(userFilters.maxPrice ? { maxPrice: userFilters.maxPrice } : {})
          }
        },
        undefined,
        { shallow: true }
      );
    }, 50);
    
    // Reset loading state after a brief delay (only for the property section)
    setTimeout(() => {
      if (propertiesSection) {
        propertiesSection.classList.remove('opacity-50', 'pointer-events-none');
      }
    }, 500);
    
    // Log the filters we're applying
    console.log('Applied search filters:', userFilters);
  };

  // Update the getActiveFiltersText function
  const getActiveFiltersText = () => {
    // Check if any filters are active
    const hasActiveFilters = Object.values(userFilters).some(
      (v) => v !== undefined
    );

    if (!hasActiveFilters) {
      return 'FILTER BY';
    }

    const parts = ['FILTER'];

    if (userFilters.bedrooms) {
      parts.push(
        `${userFilters.bedrooms} ${userFilters.bedrooms === 1 ? 'bedroom' : 'bedrooms'}`
      );
    }

    if (userFilters.maxPrice) {
      parts.push(`£${userFilters.maxPrice}${userFilters.maxPrice >= 350 ? '+' : ''}`);
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

  // Add back the missing scrollInfo hook
  // Use the scroll behavior hook
  const scrollInfo = useScrollBehavior(80);
  const { isSticky, direction, progress, isAtTop } = scrollInfo;

  // Restore the missing functions
  // Add back the missing property selection functions
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

  // Add back scroll position functions
  const scrollRef = useRef<number>(0);
  const stateRef = useRef({ tab: activeTab, filters });

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

  // Fix view toggle function
  const handleViewToggle = () => {
    // If already showing the view user wants, do nothing
    const targetView = !showMap;
    console.log(`Toggling view from ${showMap ? 'map' : 'list'} to ${targetView ? 'map' : 'list'}`);
    
    // When switching views, ensure smooth transition
    const performViewTransition = async () => {
      try {
        // If switching to map view, fetch all properties first
        if (targetView) {
          console.log('Switching to map view - fetching all properties');
          await fetchAllForMap();
          
          // Update the view state only after data is loaded
          setShowMap(true);
        } else {
          // Switching to list view
          // First update the view state to show list
          setShowMap(false);
          
          // Force a reset and refetch of properties for list view
          console.log('Switching to list view - resetting and refetching properties');
          
          // Small delay to ensure UI updates first
          setTimeout(() => {
            // Force reset properties to trigger a fresh load - always force refetch when coming from map view
            propertiesReset(true);
          }, 50);
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

  // Add back the tabs rendering function
  const renderTabs = () => {
    return (
      <div className="relative w-full border-b border-gray-200/50">
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
                label: t('tabs.silverSquare'),
              },
              {
                id: 'great-value',
                icon: '💰',
                label: t('tabs.greatValue'),
              },
              {
                id: 'recently-added',
                icon: '🆕',
                label: t('tabs.recentlyAdded'),
              },
              {
                id: 'near-campus',
                icon: '🎓',
                label: t('tabs.nearCampus'),
              },
              {
                id: 'on-campus',
                icon: '📚',
                label: t('tabs.onCampus'),
              },
              {
                id: 'solo-living',
                icon: '🏃',
                label: t('tabs.soloLiving'),
              },
              {
                id: 'large-houses',
                icon: '🏰',
                label: t('tabs.largeHouses'),
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

  // Function to clear all filters and reset to default view
  const clearAllFilters = () => {
    // Reset user filters
    setUserFilters({});
    
    // Reset internal filters
    setFilters({});
    
    // Reset to default tab
    setActiveTab('all-houses');
    
    // Reset properties
    propertiesReset();
    
    // Force a SearchFilterBar re-render with incremented key
    setSearchBarKey(prev => prev + 1);
    
    // Reset the URL completely to root path
    router.push('/', undefined, { shallow: true });
    
    // Reset scroll position
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Add a useEffect to fetch all map properties when filters change and we're in map view
  useEffect(() => {
    if (showMap) {
      console.log('Filters changed while in map view - fetching all properties for map');
      fetchAllForMap();
    }
  }, [filters, showMap, fetchAllForMap]);

  // Initialize active tab from server props
  useEffect(() => {
    // Only set from initialActiveTab on first mount if no tab is in URL
    // This prevents overriding URL tab with initial prop on subsequent renders
    if (initialActiveTab && !router.query.tab) {
      setActiveTab(initialActiveTab);
    }
  }, [initialActiveTab]);

  // Sync state with URL query parameters
  useEffect(() => {
    if (!router.isReady) {
      return;
    }

    const { query } = router;

    // --- Derive NEW target state directly from router.query and props ---
    const newUrlTab = query.tab as string | undefined;
    const targetActiveTab = newUrlTab || initialActiveTab || 'all-houses';

    const newUrlBedrooms = query.bedrooms ? Number(query.bedrooms) : undefined;
    const newUrlMaxPrice = query.maxPrice ? Number(query.maxPrice) : undefined;
    
    const targetUserFilters = {
      bedrooms: newUrlBedrooms,
      maxPrice: newUrlMaxPrice,
    };

    const tabSpecificFiltersForTarget = getTabApiParams(targetActiveTab);
    const targetCombinedFilters = {
      ...tabSpecificFiltersForTarget,
      ...(targetUserFilters.bedrooms !== undefined && !tabSpecificFiltersForTarget.bedrooms && !tabSpecificFiltersForTarget.minBedrooms 
          ? { bedrooms: targetUserFilters.bedrooms } 
          : {}),
      ...(targetUserFilters.maxPrice !== undefined && !tabSpecificFiltersForTarget.maxPrice 
          ? { maxPrice: targetUserFilters.maxPrice } 
          : {}),
    };

    // --- Compare and update state ---
    let needsFilterReset = false;

    if (targetActiveTab !== activeTab) {
      console.log(`Syncing activeTab from URL/props: ${targetActiveTab}`);
      setActiveTab(targetActiveTab);
      needsFilterReset = true; // Tab change implies filters might need reset/recalc
    }

    // Compare userFilters by stringifying, as object comparison can be tricky
    if (JSON.stringify(targetUserFilters) !== JSON.stringify(userFilters)) {
      console.log('Syncing userFilters from URL/props:', targetUserFilters);
      setUserFilters(targetUserFilters);
      needsFilterReset = true; // User filters change implies filters might need reset/recalc
    }
    
    // Only update combined filters if targetCombinedFilters is different or a reset was triggered
    if (needsFilterReset || JSON.stringify(targetCombinedFilters) !== JSON.stringify(filters)) {
      console.log("Re-calculating and setting internal filters due to URL/props sync:", targetCombinedFilters);
      propertiesReset(); 
      setFilters(targetCombinedFilters);
    }

  }, [
    router.isReady, 
    router.query, // Main source of truth for changes
    initialActiveTab, // Prop that can change
    // Current state values for comparison:
    activeTab, 
    userFilters, 
    filters     
  ]);

  // Add a useEffect hook to detect and handle retry parameter in URL
  useEffect(() => {
    if (router.isReady && router.query.retry === 'true') {
      console.log('Detected retry=true in URL, performing clean reset and removing retry param');
      
      // Show loading state during retry (optional, if you have such a state)
      // setLoadingMore(true); // Or a general isLoading state
      
      // Force a clean reset of properties
      propertiesReset(true); // true to force refetch
      
      // Remove the retry query parameter to prevent loops
      const newQuery = { ...router.query };
      delete newQuery.retry;
      
      router.replace(
        {
          pathname: router.pathname,
          query: newQuery,
        },
        undefined,
        { shallow: true }
      );
      
      // Reset loading state after a delay if you set it
      // setTimeout(() => setLoadingMore(false), 1000);
    }
  }, [router.isReady, router.query, propertiesReset, router]);

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
                    initialPrice={typeof userFilters.maxPrice === 'number' ? userFilters.maxPrice : undefined}
                    initialBedrooms={userFilters.bedrooms}
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
                {t('hero.title')}
              </h1>
              <p className="max-w-xl mt-4 mx-auto text-lg text-gray-500">
                {t('hero.subtitle')}
              </p>
              
              {/* SearchFilterBar - Hidden on mobile */}
              <div className="max-w-3xl mx-auto mt-12 mb-6">
                <SearchFilterBar 
                  key={searchBarKey}
                  initialPrice={typeof userFilters.maxPrice === 'number' ? userFilters.maxPrice : undefined}
                  initialBedrooms={userFilters.bedrooms}
                  onFilterChange={handleFilterChange}
                  onSearch={handleSearchClick}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Search Bar */}
        <div
          className={`fixed top-16 left-0 right-0 z-40 bg-white border-b border-gray-200 hidden`}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <SearchFilterBar 
              key={searchBarKey}
              initialPrice={typeof userFilters.maxPrice === 'number' ? userFilters.maxPrice : undefined}
              initialBedrooms={userFilters.bedrooms}
              onFilterChange={handleFilterChange}
              onSearch={handleSearchClick}
            />
          </div>
        </div>

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
                  key={`map-view-${showMap}`}
                  properties={allMapProperties}
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
              className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-16 md:pb-8 bg-transparent`}
            >
              <div className="max-w-7xl mx-auto property-grid-section">
                {error ? (
                  <div className="text-center py-12">
                    <p className="text-xl font-medium text-red-500 mb-2">
                      {error.includes('Failed to fetch') ? 'Failed to fetch' : error}
                    </p>
                    <p className="text-gray-500 mb-6">We couldn't load the properties right now</p>
                    <button
                      onClick={() => {
                        // Show loading state during retry
                        setLoadingMore(true);
                        
                        // Force a clean reset which will also clear the error
                        propertiesReset();
                        
                        // Update URL with retry parameter to trigger a clean reload
                        router.push(
                          {
                            pathname: '/',
                            query: {
                              tab: activeTab,
                              retry: 'true',
                              ...(userFilters.bedrooms ? { bedrooms: userFilters.bedrooms } : {}),
                              ...(userFilters.maxPrice ? { maxPrice: userFilters.maxPrice } : {})
                            }
                          },
                          undefined,
                          { shallow: true }
                        );
                        
                        // Reset loading state after a delay
                        setTimeout(() => {
                          setLoadingMore(false);
                        }, 2000);
                      }}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md flex items-center"
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                          <span>Trying...</span>
                        </>
                      ) : (
                        "Try Again"
                      )}
                    </button>
                  </div>
                ) : (
                  <motion.div 
                    layout
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                  >
                    {properties.length > 0 ? (
                      properties.map((property) => {
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
                                const newMaxPrice = (userFilters.maxPrice !== undefined ? userFilters.maxPrice : 190) + 50;
                                const updatedFilters = {
                                  ...userFilters,
                                  maxPrice: newMaxPrice
                                };
                                setUserFilters(updatedFilters);
                                
                                // If we're on "all-houses" tab, directly apply the filter
                                if (activeTab === 'all-houses') {
                                  setFilters(updatedFilters);
                                  propertiesReset();
                                  
                                  // Update URL to reflect new filters
                                  router.push(
                                    {
                                      pathname: '/',
                                      query: {
                                        tab: 'all-houses',
                                        ...(updatedFilters.bedrooms ? { bedrooms: updatedFilters.bedrooms } : {}),
                                        maxPrice: newMaxPrice
                                      }
                                    },
                                    undefined,
                                    { shallow: true }
                                  );
                                }
                              }}
                              className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow text-left flex items-center gap-4"
                            >
                              <div className="w-12 h-12 flex items-center justify-center text-3xl">
                                💰
                              </div>
                              <div>
                                <h3 className="font-semibold text-lg text-gray-900">Increase your budget</h3>
                                <p className="text-gray-500">Try £{((userFilters.maxPrice !== undefined ? userFilters.maxPrice : 190) + 50).toFixed(0)} per week</p>
                              </div>
                            </button>
                            
                            {/* Any bedrooms suggestion */}
                            <button
                              onClick={() => {
                                const updatedFilters = {
                                  ...userFilters,
                                  bedrooms: undefined
                                };
                                setUserFilters(updatedFilters);
                                
                                // If we're on "all-houses" tab, directly apply the filter
                                if (activeTab === 'all-houses') {
                                  setFilters(updatedFilters);
                                  propertiesReset();
                                  
                                  // Update URL to reflect new filters
                                  router.push(
                                    {
                                      pathname: '/',
                                      query: {
                                        tab: 'all-houses',
                                        ...(updatedFilters.maxPrice ? { maxPrice: updatedFilters.maxPrice } : {})
                                      }
                                    },
                                    undefined,
                                    { shallow: true }
                                  );
                                }
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
                            onClick={clearAllFilters}
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
              {loadingMore && (
                <div className="col-span-full flex justify-center py-8">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Map Toggle Button - Always show regardless of modal state */}
        <div
          className="fixed z-[90] left-1/2 transform -translate-x-1/2 bottom-20 md:bottom-8"
        >
          <motion.button
            onClick={handleViewToggle}
            className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-lg rounded-full shadow-lg border border-gray-200/50 hover:bg-white/95 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={showMap ? t('mapView.switchToList', "Switch to list view") : t('mapView.switchToMap', "Switch to map view")}
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
              {showMap ? t('mapView.list', 'LIST') : t('mapView.map', 'MAP')}
            </motion.span>
          </motion.button>
        </div>

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

        <div ref={observerTarget} className="h-4" />
      </div>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  locale, // locale is still available if needed for other things, but not for _nextI18Next
  query,
}: {
  locale?: string;
  query: any;
}) => {
  try {
    // Get view mode (list or map)
    const viewMode = query.view || 'list';
    const activeTab = (query.tab as string) || 'all-houses';
    
    // Parse and prepare filters from query
    const filters: Record<string, any> = {};
    const parametersToCheck = [
      'price',
      'minPrice',
      'maxPrice',
      'bedrooms', 
      'bathrooms', 
      'minBedrooms', 
      'maxBedrooms',
      'isGoldenTriangle',
      'nearCampus'
    ];
    
    parametersToCheck.forEach(param => {
      if (query[param] !== undefined) {
        // Convert numeric params
        if (['price', 'minPrice', 'maxPrice', 'bedrooms', 'bathrooms', 'minBedrooms', 'maxBedrooms'].includes(param)) {
          filters[param] = Number(query[param]);
        } 
        // Convert boolean params
        else if (['isGoldenTriangle', 'nearCampus'].includes(param)) {
          filters[param] = query[param] === 'true';
        }
        // Keep other params as is
        else {
          filters[param] = query[param];
        }
      }
    });
    
    // Get more accurate filters from tab if no filters are specified
    if (Object.keys(filters).length === 0 && activeTab !== 'all-houses') {
      Object.assign(filters, TAB_FILTERS[activeTab as keyof typeof TAB_FILTERS] || {});
    }
    
    // Get campus properties
    const campusProperties = await getCampusPropertiesAsProperties();
    
    // Use the ACTUAL locale for serverSideTranslations
    const i18nProps = await serverSideTranslations(locale || 'en', ['common']);
    
    // Return the props
    return {
      props: {
        ...i18nProps, // Spread the result of serverSideTranslations
        campusProperties: JSON.parse(JSON.stringify(campusProperties)),
        initialProperties: [], // Server-side data loading disabled, load client-side
        initialActiveTab: activeTab,
        initialFilters: filters,
        // Explicitly pass the locale that was determined by next-i18next for client-side use if needed
        // This is separate from _nextI18Next which will now always be 'en' from the server
        currentLocale: locale || 'en', 
      },
    };
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    
    // Still return translations even if there's an error
    return {
      props: {
        ...(await serverSideTranslations(locale || 'en', ['common'])), // Use actual locale here too
        campusProperties: [],
        initialProperties: [],
        initialActiveTab: 'all-houses',
        initialFilters: {},
        currentLocale: locale || 'en', // Provide current locale
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
