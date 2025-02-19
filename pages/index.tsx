import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { isCloseToUniversity } from '../utils/distance';
import Navbar from '../components/Navbar';
import { useRouter } from 'next/router';
import { useEffect, useState, useRef } from 'react';
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

export default function Home() {
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
        setSelectedProperty(propertyMatch[1]);
      } else {
        setSelectedProperty(null);
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
    setFilters(newFilters);
  };

  const handleTabChange = (tabName: string) => {
    console.log('Tab changed to:', tabName);
    setActiveTab(tabName);
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
  const getTabCount = (tabName: string) => {
    switch (tabName) {
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
      case 'near-campus':
        return allProperties.filter((p: Property) => isCloseToUniversity(p))
          .length;
      case 'en-suite':
        return allProperties.filter((p: Property) =>
          p.amenities?.some((a: string) => a.toLowerCase().includes('en-suite'))
        ).length;
      case 'bills-included':
        return allProperties.filter((p) =>
          p.amenities.some(
            (a) =>
              a.toLowerCase().includes('bills included') ||
              a.toLowerCase().includes('all bills included')
          )
        ).length;
      case 'driveway-parking':
        return allProperties.filter((p) =>
          p.amenities.some(
            (a) =>
              a.toLowerCase().includes('parking') ||
              a.toLowerCase().includes('driveway')
          )
        ).length;
      case 'rare-finds':
        // Implement your rare finds logic here
        return 0;
      default:
        return allProperties.length;
    }
  };

  // Add this effect instead to handle initial data load
  useEffect(() => {
    if (allProperties.length > 0) {
      setProperties(allProperties);
    }
  }, [allProperties, setProperties]);

  // Add this effect to set initial tab
  useEffect(() => {
    setActiveTab('all-houses');
  }, []); // Run once on mount

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          {/* Hero Section */}
          <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
              <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
                  {t('hero.title')}
                </h1>
                <p className="max-w-xl mt-4 mx-auto text-lg text-gray-500">
                  {t('hero.subtitle')}
                </p>
                <div className="flex justify-center mt-8">
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium ${
                      Object.values(filters).some((v) => v !== undefined)
                        ? 'text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100'
                        : 'text-gray-700 bg-white hover:bg-gray-50'
                    } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors`}
                  >
                    <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                    {getActiveFiltersText()}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter Modal */}
          <FilterPopover
            isOpen={isFilterOpen}
            onClose={() => setIsFilterOpen(false)}
            filters={filters}
            onFilterChange={handleFilterChange}
          />

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Location Tabs with Navigation */}
            <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
              <div className="relative flex items-center">
                <div
                  ref={scrollContainerRef}
                  className="flex space-x-4 overflow-x-auto scrollbar-hide border-b border-gray-200 px-4 sm:px-6 lg:px-8"
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
                      id: 'near-campus',
                      icon: '🎓',
                      label: t('tabs.nearCampus'),
                    },
                    {
                      id: 'rare-finds',
                      icon: '✨',
                      label: t('tabs.rareFinds'),
                    },
                    { id: 'en-suite', icon: '🚿', label: t('tabs.enSuite') },
                    {
                      id: 'bills-included',
                      icon: '💡',
                      label: t('tabs.billsIncluded'),
                    },
                    {
                      id: 'driveway-parking',
                      icon: '🚗',
                      label: t('tabs.drivewayParking'),
                    },
                    {
                      id: 'solo-living',
                      icon: '🏃',
                      label: t('tabs.soloLiving'),
                    },
                  ].map((tab, index, array) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative inline-flex flex-col items-center px-1 pt-3 pb-2.5
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
                          {getTabCount(tab.id)} properties
                        </span>
                      )}
                      {activeTab === tab.id && (
                        <span className="absolute bottom-0 inset-x-0 h-0.5 bg-purple-600" />
                      )}
                    </button>
                  ))}
                </div>
                {/* Scroll Indicator */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-white via-white to-transparent pl-8 pr-2">
                  <button
                    onClick={() => scroll('right')}
                    className="p-2 rounded-full hover:bg-gray-100"
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
            </div>

            {/* Property Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                  <p className="text-gray-600">Loading properties...</p>
                </div>
              ) : queryError ? (
                <div className="text-center text-red-500 py-12">
                  <p className="text-lg font-medium">
                    {queryError instanceof Error
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
                    {filteredProperties.map((property) => (
                      <PropertyCard
                        key={property.id}
                        property={property}
                        onMouseEnter={() => handlePropertyHover(property)}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </main>

          {selectedProperty && (
            <PropertyModal
              slug={selectedProperty}
              onClose={() => {
                router.push('/', undefined, { shallow: true });
                setSelectedProperty(null);
              }}
            />
          )}
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        {/* Hero Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl tracking-tight">
                {t('hero.title')}
              </h1>
              <p className="max-w-xl mt-4 mx-auto text-lg text-gray-500">
                {t('hero.subtitle')}
              </p>
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setIsFilterOpen(true)}
                  className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-full shadow-sm text-sm font-medium ${
                    Object.values(filters).some((v) => v !== undefined)
                      ? 'text-purple-700 border-purple-300 bg-purple-50 hover:bg-purple-100'
                      : 'text-gray-700 bg-white hover:bg-gray-50'
                  } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors`}
                >
                  <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
                  {getActiveFiltersText()}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Modal */}
        <FilterPopover
          isOpen={isFilterOpen}
          onClose={() => setIsFilterOpen(false)}
          filters={filters}
          onFilterChange={handleFilterChange}
        />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2">
          {/* Location Tabs with Navigation */}
          <div className="relative -mx-4 sm:-mx-6 lg:-mx-8">
            <div className="relative flex items-center">
              <div
                ref={scrollContainerRef}
                className="flex space-x-4 overflow-x-auto scrollbar-hide border-b border-gray-200 px-4 sm:px-6 lg:px-8"
              >
                {[
                  { id: 'all-houses', icon: '🏠', label: t('tabs.allHouses') },
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
                    id: 'near-campus',
                    icon: '🎓',
                    label: t('tabs.nearCampus'),
                  },
                  { id: 'rare-finds', icon: '✨', label: t('tabs.rareFinds') },
                  { id: 'en-suite', icon: '🚿', label: t('tabs.enSuite') },
                  {
                    id: 'bills-included',
                    icon: '💡',
                    label: t('tabs.billsIncluded'),
                  },
                  {
                    id: 'driveway-parking',
                    icon: '🚗',
                    label: t('tabs.drivewayParking'),
                  },
                  {
                    id: 'solo-living',
                    icon: '🏃',
                    label: t('tabs.soloLiving'),
                  },
                ].map((tab, index, array) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative inline-flex flex-col items-center px-1 pt-3 pb-2.5
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
                        {getTabCount(tab.id)} properties
                      </span>
                    )}
                    {activeTab === tab.id && (
                      <span className="absolute bottom-0 inset-x-0 h-0.5 bg-purple-600" />
                    )}
                  </button>
                ))}
              </div>
              {/* Scroll Indicator */}
              <div className="absolute right-0 top-0 bottom-0 flex items-center bg-gradient-to-l from-white via-white to-transparent pl-8 pr-2">
                <button
                  onClick={() => scroll('right')}
                  className="p-2 rounded-full hover:bg-gray-100"
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
          </div>

          {/* Property Grid */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
                <p className="text-gray-600">Loading properties...</p>
              </div>
            ) : queryError ? (
              <div className="text-center text-red-500 py-12">
                <p className="text-lg font-medium">
                  {queryError instanceof Error
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
                  {filteredProperties.map((property) => (
                    <PropertyCard
                      key={property.id}
                      property={property}
                      onMouseEnter={() => handlePropertyHover(property)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </main>

        {selectedProperty && (
          <PropertyModal
            slug={selectedProperty}
            onClose={() => {
              router.push('/', undefined, { shallow: true });
              setSelectedProperty(null);
            }}
          />
        )}
      </div>
    </ErrorBoundary>
  );
}

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale ?? 'en', ['common'])),
    },
  };
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
    case 'near-campus':
      return allProperties.filter((p) => isCloseToUniversity(p)).length;
    case 'en-suite':
      return allProperties.filter((p) =>
        p.amenities?.some((a: string) => {
          const amenity = a.toLowerCase();
          return amenity.includes('en-suite') || amenity.includes('ensuite');
        })
      ).length;
    case 'bills-included':
      return allProperties.filter((p) =>
        p.amenities?.some((a: string) => {
          const amenity = a.toLowerCase();
          return (
            amenity.includes('bills included') ||
            amenity.includes('all bills included')
          );
        })
      ).length;
    case 'driveway-parking':
      return allProperties.filter((p) =>
        p.amenities?.some((a: string) => {
          const amenity = a.toLowerCase();
          return amenity.includes('parking') || amenity.includes('driveway');
        })
      ).length;
    default:
      return allProperties.length;
  }
}
