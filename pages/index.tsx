import { AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'next-i18next';
import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
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

export default function Home() {
  const { t: heroT } = useTranslation('common');
  const { t: tabsT } = useTranslation('common');
  const { t: filtersT } = useTranslation('common');
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
  const [activeTab, setActiveTab] = useState('allHouses');
  const [filteredProperties, setFilteredProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);

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
    // Apply current tab's filter to new data
    handleTabChange(activeTab);
  }, [allProperties, activeTab]);

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
    setActiveTab(tabName);

    switch (tabName) {
      case 'allHouses':
        setFilteredProperties(allProperties);
        break;

      case 'soloLiving':
        setFilteredProperties(
          allProperties.filter((p) => {
            return p.rooms === 1 || p.rooms === '1';
          })
        );
        break;

      case 'greatValue':
        setFilteredProperties(
          allProperties.filter((p) => {
            const price =
              typeof p.price === 'string' ? parseFloat(p.price) : p.price;
            return !isNaN(price) && price <= 145;
          })
        );
        break;

      case 'goldenTriangle':
        const goldenTriangleStreets = [
          {
            name: 'Cumberland',
            variants: ['Cumberland Road', 'Cumberland Rd', 'Cumberland Rd.'],
          },
          { name: 'Ashby', variants: ['Ashby Road', 'Ashby Rd', 'Ashby Rd.'] },
          {
            name: 'Fearon',
            variants: ['Fearon Street', 'Fearon St', 'Fearon St.'],
          },
          {
            name: 'Forest',
            variants: ['Forest Road', 'Forest Rd', 'Forest Rd.'],
          },
          {
            name: 'George',
            variants: ['George Street', 'George St', 'George St.'],
          },
          {
            name: 'Storer',
            variants: ['Storer Road', 'Storer Rd', 'Storer Rd.'],
          },
          {
            name: 'Station',
            variants: ['Station Street', 'Station St', 'Station St.'],
          },
          {
            name: 'Havelock',
            variants: ['Havelock Street', 'Havelock St', 'Havelock St.'],
          },
          {
            name: 'Leopold',
            variants: ['Leopold Street', 'Leopold St', 'Leopold St.'],
          },
          {
            name: 'Oxford',
            variants: ['Oxford Street', 'Oxford St', 'Oxford St.'],
          },
          {
            name: 'Radmoor',
            variants: ['Radmoor Road', 'Radmoor Rd', 'Radmoor Rd.'],
          },
          { name: 'York', variants: ['York Road', 'York Rd', 'York Rd.'] },
          {
            name: 'Granville',
            variants: ['Granville Street', 'Granville St', 'Granville St.'],
          },
          {
            name: 'Chestnut',
            variants: ['Chestnut Street', 'Chestnut St', 'Chestnut St.'],
          },
          {
            name: 'Regent',
            variants: ['Regent Street', 'Regent St', 'Regent St.'],
          },
          {
            name: 'Hastings',
            variants: ['Hastings Street', 'Hastings St', 'Hastings St.'],
          },
          {
            name: 'Broad',
            variants: ['Broad Street', 'Broad St', 'Broad St.'],
          },
          {
            name: 'Packe',
            variants: ['Packe Street', 'Packe St', 'Packe St.'],
          },
          {
            name: 'Burleigh',
            variants: ['Burleigh Road', 'Burleigh Rd', 'Burleigh Rd.'],
          },
          {
            name: 'Frederick',
            variants: ['Frederick Street', 'Frederick St', 'Frederick St.'],
          },
          {
            name: 'William',
            variants: ['William Street', 'William St', 'William St.'],
          },
        ];

        setFilteredProperties(
          allProperties.filter((property) => {
            if (!property.location) return false;
            const location = property.location.toLowerCase();
            return goldenTriangleStreets.some((street) =>
              street.variants.some((variant) =>
                location.includes(variant.toLowerCase())
              )
            );
          })
        );
        break;

      case 'largeKitchen':
      case 'enSuite':
      case 'rareFinds':
      case 'nearCampus':
      case 'billsIncluded':
      case 'drivewayParking':
      case 'furnished':
      case 'garden':
        setFilteredProperties([]);
        break;

      default:
        setFilteredProperties(allProperties);
    }
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
      case 'allHouses':
        return allProperties.length;
      case 'soloLiving':
        return allProperties.filter((p) => p.rooms === 1 || p.rooms === '1')
          .length;
      case 'greatValue':
        return allProperties.filter((p) => {
          const price =
            typeof p.price === 'string' ? parseFloat(p.price) : p.price;
          return !isNaN(price) && price <= 145;
        }).length;
      case 'goldenTriangle':
        const goldenTriangleStreets = [
          {
            name: 'Cumberland',
            variants: ['Cumberland Road', 'Cumberland Rd', 'Cumberland Rd.'],
          },
          { name: 'Ashby', variants: ['Ashby Road', 'Ashby Rd', 'Ashby Rd.'] },
          {
            name: 'Fearon',
            variants: ['Fearon Street', 'Fearon St', 'Fearon St.'],
          },
          {
            name: 'Forest',
            variants: ['Forest Road', 'Forest Rd', 'Forest Rd.'],
          },
          {
            name: 'George',
            variants: ['George Street', 'George St', 'George St.'],
          },
          {
            name: 'Storer',
            variants: ['Storer Road', 'Storer Rd', 'Storer Rd.'],
          },
          {
            name: 'Station',
            variants: ['Station Street', 'Station St', 'Station St.'],
          },
          {
            name: 'Havelock',
            variants: ['Havelock Street', 'Havelock St', 'Havelock St.'],
          },
          {
            name: 'Leopold',
            variants: ['Leopold Street', 'Leopold St', 'Leopold St.'],
          },
          {
            name: 'Oxford',
            variants: ['Oxford Street', 'Oxford St', 'Oxford St.'],
          },
          {
            name: 'Radmoor',
            variants: ['Radmoor Road', 'Radmoor Rd', 'Radmoor Rd.'],
          },
          { name: 'York', variants: ['York Road', 'York Rd', 'York Rd.'] },
          {
            name: 'Granville',
            variants: ['Granville Street', 'Granville St', 'Granville St.'],
          },
          {
            name: 'Chestnut',
            variants: ['Chestnut Street', 'Chestnut St', 'Chestnut St.'],
          },
          {
            name: 'Regent',
            variants: ['Regent Street', 'Regent St', 'Regent St.'],
          },
          {
            name: 'Hastings',
            variants: ['Hastings Street', 'Hastings St', 'Hastings St.'],
          },
          {
            name: 'Broad',
            variants: ['Broad Street', 'Broad St', 'Broad St.'],
          },
          {
            name: 'Packe',
            variants: ['Packe Street', 'Packe St', 'Packe St.'],
          },
          {
            name: 'Burleigh',
            variants: ['Burleigh Road', 'Burleigh Rd', 'Burleigh Rd.'],
          },
          {
            name: 'Frederick',
            variants: ['Frederick Street', 'Frederick St', 'Frederick St.'],
          },
          {
            name: 'William',
            variants: ['William Street', 'William St', 'William St.'],
          },
        ];
        return allProperties.filter((property) => {
          if (!property.location) return false;
          const location = property.location.toLowerCase();
          return goldenTriangleStreets.some((street) =>
            street.variants.some((variant) =>
              location.includes(variant.toLowerCase())
            )
          );
        }).length;
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          {/* Hero Section */}
          <div className="bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
              <h1 className="text-4xl font-bold text-center mb-4 pt-8">
                FIND YOUR PERFECT STUDENT HOME.
              </h1>
              <p className="text-gray-600 text-center text-lg mb-8">
                Discover the best Loughborough student houses - all in one
                place.
              </p>
              <div className="flex justify-center">
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
                    { id: 'allHouses', icon: '🏠', label: 'all houses' },
                    {
                      id: 'goldenTriangle',
                      icon: '🏆',
                      label: 'golden triangle',
                    },
                    { id: 'greatValue', icon: '💰', label: 'great value' },
                    { id: 'nearCampus', icon: '🎓', label: 'near campus' },
                    { id: 'rareFinds', icon: '✨', label: 'rare finds' },
                    { id: 'enSuite', icon: '🚿', label: 'en-suite' },
                    { id: 'largeKitchen', icon: '🔍', label: 'large kitchen' },
                    {
                      id: 'billsIncluded',
                      icon: '💡',
                      label: 'bills included',
                    },
                    {
                      id: 'drivewayParking',
                      icon: '🚗',
                      label: 'driveway parking',
                    },
                    { id: 'soloLiving', icon: '🏃', label: 'solo living' },
                    { id: 'furnished', icon: '🛋️', label: 'furnished' },
                    { id: 'garden', icon: '🌳', label: 'garden' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`relative inline-flex flex-col items-center px-1 pt-3 pb-2.5 text-sm
                        ${
                          activeTab === tab.id
                            ? 'text-purple-600 font-semibold'
                            : 'text-gray-500 hover:text-gray-700 font-medium'
                        }
                      `}
                    >
                      <span className="text-2xl mb-1.5">{tab.icon}</span>
                      <span className="text-sm whitespace-nowrap">
                        {tab.label}
                      </span>
                      {activeTab === tab.id && (
                        <span className="text-xs text-gray-500 mt-0.5">
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
                      ? queryError.message
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">
            <h1 className="text-4xl font-bold text-center mb-0 pt-8">
              FIND YOUR PERFECT STUDENT HOME.
            </h1>
            <p className="text-gray-600 text-center text-lg mb-8">
              Discover the best Loughborough student houses - all in one place.
            </p>
            <div className="flex justify-center">
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
                  { id: 'allHouses', icon: '🏠', label: 'all houses' },
                  {
                    id: 'goldenTriangle',
                    icon: '🏆',
                    label: 'golden triangle',
                  },
                  { id: 'greatValue', icon: '💰', label: 'great value' },
                  { id: 'nearCampus', icon: '🎓', label: 'near campus' },
                  { id: 'rareFinds', icon: '✨', label: 'rare finds' },
                  { id: 'enSuite', icon: '🚿', label: 'en-suite' },
                  { id: 'largeKitchen', icon: '🔍', label: 'large kitchen' },
                  {
                    id: 'billsIncluded',
                    icon: '💡',
                    label: 'bills included',
                  },
                  {
                    id: 'drivewayParking',
                    icon: '🚗',
                    label: 'driveway parking',
                  },
                  { id: 'soloLiving', icon: '🏃', label: 'solo living' },
                  { id: 'furnished', icon: '🛋️', label: 'furnished' },
                  { id: 'garden', icon: '🌳', label: 'garden' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`relative inline-flex flex-col items-center px-1 pt-3 pb-2.5 text-sm
                      ${
                        activeTab === tab.id
                          ? 'text-purple-600 font-semibold'
                          : 'text-gray-500 hover:text-gray-700 font-medium'
                      }
                    `}
                  >
                    <span className="text-2xl mb-1.5">{tab.icon}</span>
                    <span className="text-sm whitespace-nowrap">
                      {tab.label}
                    </span>
                    {activeTab === tab.id && (
                      <span className="text-xs text-gray-500 mt-0.5">
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
                    ? queryError.message
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
