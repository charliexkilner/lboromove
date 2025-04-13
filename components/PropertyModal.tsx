/// <reference types="react" />
/// <reference types="react-dom" />

import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ClipboardIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { formatPriceWithCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import FullScreenGallery from './FullScreenGallery';
import { calculateWalkingTime, calculateDistance } from '../utils/distance';
import { getPropertyIdFromSlug } from '@/utils/url';
import PropertyMap from './PropertyMap';
import FallbackImage from './FallbackImage';
import { useRouter } from 'next/router';
import { createPortal } from 'react-dom';
import PropertyCard from './PropertyCard';
import { generatePropertySlug } from '@/utils/url';

// Update the amenity icons mapping
const AMENITY_ICONS: Record<string, string> = {
  'En-suite': '🚿',
  'Bills Included': '💡',
  'Large Kitchen': '🍳',
  Garden: '🌳',
  Dishwasher: '🍽️',
  Driveway: '🚗',
  'Washing Machine': '🧺',
  'Fast WiFi': '📶',
  Bedrooms: '🛏️',
  'Price per week': '💰',
  Bathrooms: '🚽',
};

interface PropertyModalProps {
  slug: string;
  onClose: () => void;
  isCampusProperty?: boolean;
  isMobile?: boolean;
  preventReload?: boolean;
  property?: any; // Add property prop to accept pre-fetched data
}

export default function PropertyModal({ 
  slug, 
  onClose, 
  isCampusProperty = false, 
  isMobile = false,
  preventReload = false,
  property: propProperty = null
}: PropertyModalProps) {
  const router = useRouter();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Mount check for SSR compatibility
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle close with improved UX
  const handleModalClose = () => {
    if (preventReload) {
      // Just call the parent's onClose to handle state changes
      onClose();
    } else {
      // Use the router to navigate back with shallow routing
      router.push('/', undefined, { 
        shallow: true,
        scroll: false
      })
        .then(() => {
          // After the URL is updated, call the parent's onClose
          onClose();
          
          // Restore scroll position if needed (parent might handle this too)
          if (window.history.state?.scrollPos) {
            requestAnimationFrame(() => {
              window.scrollTo({
                top: window.history.state.scrollPos,
                behavior: 'auto'
              });
            });
          }
        });
    }
  };

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  // Use the directly passed property if available
  const { data: property, isLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: async () => {
      // Prioritize propProperty if provided
      if (propProperty) return propProperty;
      
      const id = getPropertyIdFromSlug(slug);
      if (!id) return null;
      
      // Use the base URL from environment variable or fallback to relative path
      const baseUrl = typeof window !== 'undefined' && window.location.origin 
        ? window.location.origin 
        : '';
      const res = await fetch(`${baseUrl}/api/properties/${id}`);
      if (!res.ok) throw new Error('Failed to fetch property');
      return res.json();
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: Boolean(slug && slug.length > 0 && !propProperty), // Skip query if property already provided
  });

  // Debug property coordinates
  useEffect(() => {
    if (property) {
      console.log('Property for nearby search:', {
        id: property.id,
        hasCoordinates: Boolean(property.latitude && property.longitude),
        latitude: property.latitude,
        longitude: property.longitude
      });
    }
  }, [property]);

  // Fetch nearby properties
  const { data: nearbyProperties, isLoading: nearbyLoading } = useQuery<any[]>({
    queryKey: ['nearbyProperties', property?.id, property?.latitude, property?.longitude],
    queryFn: async () => {
      if (!property?.latitude || !property?.longitude) {
        console.log('No coordinates available for property:', property?.id);
        return [];
      }
      
      console.log('Fetching nearby properties for coordinates:', {
        lat: property.latitude,
        lng: property.longitude
      });
      
      // Use the base URL from environment variable or fallback to relative path
      const baseUrl = typeof window !== 'undefined' && window.location.origin 
        ? window.location.origin 
        : '';
      // Use a dedicated endpoint for nearby properties
      const res = await fetch(`${baseUrl}/api/properties/nearby?latitude=${property.latitude}&longitude=${property.longitude}&limit=4&excludeId=${property.id}`);
      
      if (!res.ok) {
        // Fallback to the general properties endpoint if the nearby one doesn't exist
        console.log('Nearby properties endpoint not available, falling back to general API');
        const fallbackRes = await fetch(`${baseUrl}/api/properties`);
        if (!fallbackRes.ok) throw new Error('Failed to fetch properties');
        const properties = await fallbackRes.json();
        
        // Calculate distance for each property
        const propertiesWithDistance = properties
          .filter((p: any) => p.id !== property.id && p.latitude && p.longitude)
          .map((p: any) => ({
            ...p,
            distance: calculateDistance(
              property.latitude,
              property.longitude,
              p.latitude,
              p.longitude
            )
          }));
        
        // Log found properties
        console.log(`Found ${propertiesWithDistance.length} properties with coordinates`);
        
        // Sort by distance and take the 4 closest
        return propertiesWithDistance
          .sort((a: any, b: any) => a.distance - b.distance)
          .slice(0, 4);
      }
      
      // If the nearby endpoint exists, use its data
      const data = await res.json();
      console.log('Nearby properties data:', data);
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: Boolean(property?.latitude && property?.longitude),
  });

  // Debug nearby properties
  useEffect(() => {
    if (nearbyProperties) {
      console.log("Nearby properties debug:", {
        count: Array.isArray(nearbyProperties) ? nearbyProperties.length : 0,
        isArray: Array.isArray(nearbyProperties),
        firstProperty: Array.isArray(nearbyProperties) && nearbyProperties.length > 0 ? {
          id: nearbyProperties[0]?.id,
          title: nearbyProperties[0]?.title,
          hasCoordinates: Boolean(nearbyProperties[0]?.latitude && nearbyProperties[0]?.longitude)
        } : null
      });
    }
  }, [nearbyProperties]);

  // Fetch similar properties (same bedrooms and similar price)
  const { data: similarProperties, isLoading: similarLoading } = useQuery<any[]>({
    queryKey: ['similarProperties', property?.id, property?.rooms, property?.price],
    queryFn: async () => {
      if (!property?.rooms || typeof property.price !== 'number') {
        console.log('No room or price info available for property:', property?.id);
        return [];
      }
      
      console.log('Fetching similar properties for:', {
        rooms: property.rooms,
        price: property.price
      });
      
      // Use the base URL from environment variable or fallback to relative path
      const baseUrl = typeof window !== 'undefined' && window.location.origin 
        ? window.location.origin 
        : '';
      
      // Fetch all properties and filter for similar ones
      const res = await fetch(`${baseUrl}/api/properties`);
      
      if (!res.ok) throw new Error('Failed to fetch properties');
      const data = await res.json();
      const properties = data.properties || [];
      
      // Calculate price difference for each property
      const propertiesWithSimilarity = properties
        .filter((p: any) => 
          p.id !== property.id && // Not the same property
          p.rooms === property.rooms && // Same number of bedrooms
          p.price > 0 // Valid price
        )
        .map((p: any) => ({
          ...p,
          priceDiff: Math.abs(p.price - property.price)
        }));
      
      // Sort by price similarity and take the 4 most similar
      console.log(`Found ${propertiesWithSimilarity.length} properties with ${property.rooms} bedrooms`);
      return propertiesWithSimilarity
        .sort((a: any, b: any) => a.priceDiff - b.priceDiff)
        .slice(0, 4);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    enabled: Boolean(property?.rooms && property?.price),
  });

  // Debug similar properties
  useEffect(() => {
    if (similarProperties) {
      console.log("Similar properties debug:", {
        count: Array.isArray(similarProperties) ? similarProperties.length : 0,
        isArray: Array.isArray(similarProperties),
        firstProperty: Array.isArray(similarProperties) && similarProperties.length > 0 ? {
          id: similarProperties[0]?.id,
          title: similarProperties[0]?.title,
          bedrooms: similarProperties[0]?.rooms,
          price: similarProperties[0]?.price,
          priceDiff: similarProperties[0]?.priceDiff
        } : null
      });
    }
  }, [similarProperties]);

  // Process the images - ensure we have valid images
  const processedImages = useMemo(() => {
    if (!property) return [];
    
    const images = Array.isArray(property.images) ? property.images : [property.images];
    return images.filter((img: string) => img && typeof img === 'string');
  }, [property]);

  // Ensure current image index is valid
  useEffect(() => {
    if (processedImages.length > 0 && currentImageIndex >= processedImages.length) {
      setCurrentImageIndex(0);
    }
  }, [processedImages.length, currentImageIndex]);

  const prevImage = () => {
    if (!property || !processedImages.length) return;
    setCurrentImageIndex((prev) => (prev === 0 ? processedImages.length - 1 : prev - 1));
  };

  const nextImage = () => {
    if (!property || !processedImages.length) return;
    setCurrentImageIndex((prev) => (prev === processedImages.length - 1 ? 0 : prev + 1));
  };

  const openGallery = () => {
    if (!property || !processedImages.length) return;
    setIsGalleryOpen(true);
  };

  const closeGallery = () => {
    setIsGalleryOpen(false);
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (processedImages.length > 0) {
      setIsGalleryOpen(true);
    }
  };

  // Calculate walking times only if property exists and has coordinates
  const walkToTown = property ? calculateWalkingTime(property, 'town') : 0;
  const walkToCampus = property ? calculateWalkingTime(property, 'campus') : 0;

  const getAgencyEmoji = (property: any) => {
    if (
      property.url?.includes('loc8me') ||
      property.externalId?.includes('loc8me')
    ) {
      return '🟠'; // Loc8me emoji remains orange
    } else if (
      property.url?.includes('top-lets') ||
      property.externalId?.includes('top-lets')
    ) {
      return '🔴'; // Changed from 🟠 to 🔴 for Top Lets
    } else {
      return '🏠'; // Default emoji
    }
  };

  // Render campus property details
  const renderCampusPropertyDetails = () => {
    if (!property) return null;
    
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Location</h3>
          <p>{property.location}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Catering</h3>
          <p>{property.catering || 'Not specified'}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Bathroom Type</h3>
          <p>{property.bathroomType || 'Not specified'}</p>
        </div>
        
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-2">Price Range</h3>
          <p>{property.priceRange || formatPriceWithCurrency(property.price, 'en') + ' per week'}</p>
        </div>
      </div>
    );
  };

  // Render pricing options for campus properties
  const renderPricingOptions = () => {
    if (!property || !property.pricingOptions || property.pricingOptions.length === 0) return null;
    
    return (
      <div className="mt-6">
        <h3 className="font-semibold text-gray-700 mb-2">Pricing Options</h3>
        <ul className="list-disc pl-5 space-y-1">
          {(property.pricingOptions as string[]).map((option: string, index: number) => (
            <li key={index} className="text-gray-600">{option}</li>
          ))}
        </ul>
      </div>
    );
  };

  // Handle browser back button
  useEffect(() => {
    const handlePopState = () => {
      // Close the modal when user presses back button
      if (typeof window !== 'undefined' && window.location.pathname === '/') {
        onClose();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

  // Handle escape key
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalClose();
      }
    };

    window.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.removeEventListener('keydown', handleEscapeKey);
    };
  }, []);

  // Update the modalContent to handle visibility without adding a background
  const modalContent = (
    <Transition.Root show={Boolean(slug && slug.length > 0)} as={Fragment}>
      <Dialog as="div" className="relative z-[60]" onClose={handleModalClose} static>
        <div className="fixed inset-0 z-50 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm pointer-events-auto" onClick={handleModalClose} />
          <div className="flex min-h-full items-center justify-center p-0 text-center sm:p-0 pointer-events-none">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-200" 
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-150"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={`
                  relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all pointer-events-auto
                  ${isMobile 
                    ? 'fixed bottom-0 rounded-t-xl w-full max-h-[90vh]' 
                    : 'rounded-lg w-[90vw] max-w-[1200px] mx-auto my-8 max-h-[90vh]'}
                `}
              >
                {/* Close button */}
                <button
                  type="button"
                  className="absolute top-4 right-4 z-50 bg-white rounded-full p-2 shadow-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500"
                  onClick={handleModalClose}
                  aria-label="Close modal"
                >
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>

                {isLoading ? (
                  <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : property ? (
                  <div className="flex flex-col md:flex-row h-[90vh] max-h-[90vh] overflow-hidden">
                    {/* Mobile image gallery */}
                    <div className="md:hidden w-full h-72 relative mb-4">
                      {processedImages.length > 0 ? (
                        <button 
                          className="w-full h-full cursor-pointer block" 
                          onClick={handleImageClick}
                        >
                          <FallbackImage
                            src={processedImages[currentImageIndex]}
                            alt={property.title}
                            fill
                            className="object-cover"
                            fallbackSrc="/images/property-placeholder.jpg"
                          />
                        </button>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <PhotoIcon className="h-12 w-12 text-gray-400" />
                        </div>
                      )}

                      {/* Image navigation controls */}
                      {processedImages.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              prevImage();
                            }}
                            className="ml-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors pointer-events-auto"
                          >
                            <ChevronLeftIcon className="h-5 w-5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              nextImage();
                            }}
                            className="mr-2 p-1 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors pointer-events-auto"
                          >
                            <ChevronRightIcon className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Left Content */}
                    <div className="md:w-1/2 p-6 overflow-y-auto h-full">
                      <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold">{property.title}</h2>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setIsFavorite(!isFavorite)}
                            className="p-2 rounded-md hover:bg-gray-100 bg-gray-50 hover:text-black"
                          >
                            {isFavorite ? (
                              <HeartSolidIcon className="h-6 w-6 text-red-500" />
                            ) : (
                              <HeartIcon className="h-6 w-6 text-gray-400" />
                            )}
                          </button>
                          <button
                            onClick={copyToClipboard}
                            className="p-2 rounded-md hover:bg-gray-100 bg-gray-50"
                          >
                            <ClipboardIcon className="h-6 w-6 text-gray-400" />
                          </button>
                        </div>
                      </div>

                      <button className="w-full bg-purple-600 text-white py-3 rounded-lg mb-6 hover:bg-purple-700 transition-colors">
                        Book a viewing
                      </button>

                      {/* Tabs */}
                      <div className="border-b border-gray-200 mb-6">
                        <nav className="-mb-px flex space-x-8">
                          {[
                            { name: 'About', current: true },
                            { name: 'Map', current: false },
                            { name: 'Ratings', current: false },
                            { name: 'Nearby', current: false },
                            { name: 'Similar', current: false },
                          ].map((tab) => (
                            <button
                              key={tab.name}
                              onClick={() =>
                                setActiveTab(tab.name.toLowerCase())
                              }
                              className={`${
                                activeTab === tab.name.toLowerCase()
                                  ? 'text-purple-600 border-purple-600'
                                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                              } border-b-2 py-4 px-1 text-sm font-medium`}
                            >
                              {tab.name}
                            </button>
                          ))}
                        </nav>
                      </div>

                      {/* Tab content with consistent height */}
                      <div className="min-h-[350px] w-full">
                        {/* About Tab Content */}
                        {activeTab === 'about' && (
                          <div className="h-full">
                            {/* First row */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              {/* Price per week */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start">
                                  <p className="text-sm text-gray-500 uppercase text-left w-full">
                                    Price per week
                                  </p>
                                </div>
                                <p className="text-lg font-medium mt-1 flex items-center">
                                  <span className="mr-2">💰</span>£
                                  {property.price}
                                </p>
                              </div>

                              {/* Bedrooms */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start">
                                  <p className="text-sm text-gray-500 uppercase text-left w-full">
                                    Bedrooms
                                  </p>
                                </div>
                                <p className="text-lg font-medium mt-1 flex items-center">
                                  <span className="mr-2">🛏️</span>
                                  {property.rooms}
                                </p>
                              </div>

                              {/* Bathrooms */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start">
                                  <p className="text-sm text-gray-500 uppercase text-left w-full">
                                    Bathrooms
                                  </p>
                                </div>
                                <p className="text-lg font-medium mt-1 flex items-center">
                                  <span className="mr-2">🚽</span>
                                  {property.bathrooms}
                                </p>
                              </div>
                            </div>

                            {/* Second row */}
                            <div className="grid grid-cols-3 gap-4 mb-6">
                              {/* Listed By */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start">
                                  <p className="text-sm text-gray-500 uppercase text-left w-full">
                                    Listed By
                                  </p>
                                </div>
                                <p className="text-lg font-medium mt-1 flex items-center">
                                  <span className="mr-2">
                                    {getAgencyEmoji(property)}
                                  </span>
                                  {property?.scrapedFrom || 'Unknown'}
                                </p>
                              </div>

                              {/* Walk to Town */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start">
                                  <p className="text-sm text-gray-500 uppercase text-left w-full">
                                    Walk to Town
                                  </p>
                                </div>
                                <p className="text-lg font-medium mt-1 flex items-center">
                                  {property?.latitude ? walkToTown : '-'}
                                  <span className="text-sm text-gray-500 ml-1">
                                    {property?.latitude ? 'mins' : 'N/A'}
                                  </span>
                                </p>
                              </div>

                              {/* Walk to Campus */}
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-start">
                                  <p className="text-sm text-gray-500 uppercase text-left w-full">
                                    Walk to Campus
                                  </p>
                                </div>
                                <p className="text-lg font-medium mt-1 flex items-center">
                                  {property?.latitude ? walkToCampus : '-'}
                                  <span className="text-sm text-gray-500 ml-1">
                                    {property?.latitude ? 'mins' : 'N/A'}
                                  </span>
                                </p>
                              </div>
                            </div>

                            <p className="text-gray-600 mb-6">
                              {property.description}
                            </p>

                            {/* Show different details based on property type */}
                            {isCampusProperty ? (
                              <>
                                {renderCampusPropertyDetails()}
                                {renderPricingOptions()}
                              </>
                            ) : (
                              <>
                                {/* Regular property details */}
                                {/* ... existing details code ... */}
                              </>
                            )}
                          </div>
                        )}

                        {activeTab === 'map' && (
                          <div className="h-full">
                            {property.latitude && property.longitude ? (
                              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="h-[350px] w-full rounded-lg overflow-hidden" style={{ position: 'relative', isolation: 'isolate', contain: 'strict' }}>
                                  <div className="absolute inset-0 z-0">
                                    <div className="relative w-full h-full" style={{ contain: 'paint layout size' }}>
                                      <PropertyMap
                                        properties={[property]}
                                        singlePropertyMode={true}
                                        centerLat={property.latitude}
                                        centerLng={property.longitude}
                                      />
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <p className="text-sm text-gray-500">
                                    {property.address || property.title} is located {property?.latitude ? `${walkToTown} mins walk from town and ${walkToCampus} mins from campus` : 'in Loughborough'}
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="h-[350px] w-full rounded-lg flex items-center justify-center bg-gray-100">
                                  <p className="text-gray-500">Map location not available for this property.</p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Placeholder content for empty tabs */}
                        {activeTab === 'ratings' && (
                          <div className="h-full">
                            <div className="bg-gray-50 p-4 rounded-lg mb-6">
                              <div className="h-[350px] w-full rounded-lg flex items-center justify-center bg-gray-100">
                                <p className="text-gray-500">No ratings available for this property yet.</p>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {activeTab === 'nearby' && (
                          <div className="h-full overflow-y-auto">
                            {nearbyLoading ? (
                              <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                              </div>
                            ) : Array.isArray(nearbyProperties) && nearbyProperties.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                {nearbyProperties.map((nearbyProperty: any) => (
                                  <div key={nearbyProperty.id} className="transform transition-transform hover:scale-[1.02]">
                                    <PropertyCard
                                      property={nearbyProperty}
                                      onSelect={() => {
                                        // Navigate to the property
                                        const slug = generatePropertySlug(nearbyProperty);
                                        router.push(`/house/${slug}`, undefined, { 
                                          shallow: true,
                                          scroll: false 
                                        });
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="h-64 w-full rounded-lg flex flex-col items-center justify-center bg-gray-100">
                                  <div className="text-3xl mb-4">📍</div>
                                  <p className="text-gray-500 font-medium">No nearby properties found.</p>
                                  <p className="text-gray-400 text-sm mt-2">
                                    {(!property || !property.latitude || !property.longitude) ? 
                                      "This property doesn't have coordinates available." : 
                                      "There are no other properties with coordinates in this area."}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {activeTab === 'similar' && (
                          <div className="h-full overflow-y-auto">
                            {similarLoading ? (
                              <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                              </div>
                            ) : Array.isArray(similarProperties) && similarProperties.length > 0 ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                                {similarProperties.map((similarProperty: any) => (
                                  <div key={similarProperty.id} className="transform transition-transform hover:scale-[1.02]">
                                    <PropertyCard
                                      property={similarProperty}
                                      onSelect={() => {
                                        // Navigate to the property
                                        const slug = generatePropertySlug(similarProperty);
                                        router.push(`/house/${slug}`, undefined, { 
                                          shallow: true,
                                          scroll: false 
                                        });
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                                <div className="h-64 w-full rounded-lg flex flex-col items-center justify-center bg-gray-100">
                                  <div className="text-3xl mb-4">🏡</div>
                                  <p className="text-gray-500 font-medium">No similar properties found.</p>
                                  <p className="text-gray-400 text-sm mt-2">
                                    {(!property || !property.rooms) 
                                      ? "Unable to find similar properties for this listing."
                                      : `No other ${property.rooms}-bedroom properties with similar pricing available.`
                                    }
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Image Gallery - Desktop only with full height */}
                    <div className="hidden md:block md:w-1/2 relative h-full">
                      {processedImages.length > 0 ? (
                        <>
                          <button 
                            className="w-full h-full cursor-pointer block" 
                            onClick={handleImageClick}
                          >
                            <FallbackImage
                              src={processedImages[currentImageIndex]}
                              alt={property.title}
                              fill
                              className="object-cover"
                              fallbackSrc="/images/property-placeholder.jpg"
                            />
                          </button>

                          {/* Image navigation controls */}
                          {processedImages.length > 1 && (
                            <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  prevImage();
                                }}
                                className="ml-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors pointer-events-auto"
                              >
                                <ChevronLeftIcon className="h-6 w-6" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  nextImage();
                                }}
                                className="mr-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors pointer-events-auto"
                              >
                                <ChevronRightIcon className="h-6 w-6" />
                              </button>
                            </div>
                          )}

                          {/* Image indicators */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1 max-w-[90%]">
                            {processedImages.map(
                              (_: string, index: number) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    currentImageIndex === index
                                      ? 'bg-white'
                                      : 'bg-white/50'
                                  }`}
                                />
                              )
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <PhotoIcon className="h-20 w-20 text-gray-400" />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <p className="text-gray-500">Property not found</p>
                  </div>
                )}

                {/* Add FullScreenGallery */}
                {isGalleryOpen && processedImages.length > 0 && (
                  <div className="z-[100]">
                    <FullScreenGallery
                      images={processedImages}
                      initialIndex={currentImageIndex}
                      onClose={closeGallery}
                    />
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );

  // Only render if mounted
  if (!mounted) return null;
  
  // Always return the portal, let the Transition handle visibility
  return createPortal(modalContent, document.body);
}