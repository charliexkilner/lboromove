import Image from 'next/image';
import { useState, useMemo, useEffect, useRef } from 'react';
import { Property, Prisma } from '@prisma/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Heart, ChevronLeft, ChevronRight } from 'react-feather';
import { formatPriceWithCurrency } from '../utils/currency';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { useProtectedAction } from '@/hooks/useProtectedAction';
import { generatePropertySlug } from '@/utils/url';
import FallbackImage from './FallbackImage';

type PropertyWithOptionalFields = Prisma.PropertyGetPayload<{}> & {
  propertyType?: string;
  furnished?: boolean;
  available?: boolean;
  imageUrl?: string;
  slug?: string;
  _imageKey?: number;
};

interface PropertyCardProps {
  property: PropertyWithOptionalFields;
  onMouseEnter?: () => void;
  onSelect?: () => void;
}

const DEFAULT_IMAGE =
  'https://resource.rentcafe.com/image/upload/q_auto,f_auto/s3uk/2/82438/Loughborough_StudentAccommodation.jpg';

const MAX_VISIBLE_DOTS = 6;
const LBOROMOVE_PURPLE = '#4F46E5';

export default function PropertyCard({
  property,
  onMouseEnter,
  onSelect,
}: PropertyCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const { locale } = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [isTransitioning, setIsTransitioning] = useState(false);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const runProtectedAction = useProtectedAction();

  // Ensure we have a valid array of images or use a fallback
  const images = useMemo(() => {
    if (!property.images) return [DEFAULT_IMAGE];
    
    const validImages = Array.isArray(property.images) 
      ? property.images.filter(img => typeof img === 'string' && img)
      : [property.images].filter(Boolean);
    
    return validImages.length > 0 ? validImages : [DEFAULT_IMAGE];
  }, [property.images]);

  // Get visible images (limit to 6)
  const visibleImages = useMemo(() => {
    return images.slice(0, 6);
  }, [images]);

  // Reset image index when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [property.id]);

  // Preload images
  useEffect(() => {
    if (!images.length) return;
    
    const preloadImages = async () => {
      const imagesToLoad = images.slice(0, 2); // Preload first two images
      
      for (const imgUrl of imagesToLoad) {
        if (typeof imgUrl === 'string' && !Array.from(loadedImages).includes(imgUrl)) {
          try {
            const img = new window.Image();
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = imgUrl;
            });
            setLoadedImages(prev => new Set([...Array.from(prev), imgUrl]));
          } catch (error) {
            console.error('Failed to preload image:', imgUrl);
          }
        }
      }
    };

    preloadImages();
  }, [images, loadedImages]);

  // Handle image navigation
  const navigateImage = (direction: 'next' | 'prev') => {
    setIsTransitioning(true);
    const newIndex = direction === 'next'
      ? (currentImageIndex + 1) % visibleImages.length
      : (currentImageIndex - 1 + visibleImages.length) % visibleImages.length;
    
    // Preload the next image in sequence if within visible range
    if (newIndex < 5) {
      const nextImage = new window.Image();
      nextImage.src = visibleImages[(newIndex + 1) % visibleImages.length];
    }
    
    setCurrentImageIndex(newIndex);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = DEFAULT_IMAGE;
  };

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If onSelect is provided, use it (for improved modal handling)
    if (onSelect) {
      onSelect();
      return;
    }
    
    // Otherwise, fall back to the original navigation logic
    // Generate the slug and navigate with shallow routing
    const slug = generatePropertySlug(property);
    router.push(`/house/${slug}`, undefined, { 
      shallow: true,
      scroll: false // Prevent scroll reset
    });
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClick(e);
  };

  const formatTitle = (title: string) => {
    return title;
  };

  const prefetchPropertyData = () => {
    // Get the slug for this property
    const slug = generatePropertySlug(property);
    
    // Prefetch the property data
    queryClient.prefetchQuery({
      queryKey: ['property', slug],
      queryFn: async () => {
        // Use the base URL from environment variable or fallback to relative path
        const baseUrl = typeof window !== 'undefined' && window.location.origin 
          ? window.location.origin 
          : '';
        const res = await fetch(`${baseUrl}/api/properties/${property.id}`);
        if (!res.ok) throw new Error('Failed to fetch property');
        return res.json();
      },
    });

    // Also prefetch the page
    router.prefetch(`/p/${property.id}`);
  };

  const handleFavoriteClick = () => {
    runProtectedAction(() => {
      // Add to favorites logic here
      console.log('Adding to favorites:', property.id);
    });
  };

  return (
    <Link
      href={`/house/${generatePropertySlug(property)}`}
      onClick={handleClick}
    >
      <div
        className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
        onMouseEnter={() => {
          onMouseEnter?.();
          prefetchPropertyData();
          // Preload next image on hover
          if (images.length > currentImageIndex + 1) {
            const nextImg = new window.Image();
            nextImg.src = images[currentImageIndex + 1];
          }
        }}
      >
        {/* Image Gallery */}
        <div 
          ref={imageContainerRef}
          className="relative aspect-[4/3] overflow-hidden bg-gray-100"
        >
          <div className="relative w-full h-full">
            {images.length > 0 && (
              <>
                {/* Favorite Button */}
                <button
                  onClick={handleFavoriteClick}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors z-10"
                >
                  <Heart
                    size={20}
                    className={
                      isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
                    }
                  />
                </button>

                <FallbackImage
                  key={`${property.id}-${currentImageIndex}-${visibleImages[currentImageIndex]}`}
                  src={visibleImages[currentImageIndex]}
                  alt={`${property.title} property image ${currentImageIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className={`object-cover transition-opacity duration-300 ${
                    isTransitioning ? 'opacity-0' : 'opacity-100'
                  }`}
                  priority={currentImageIndex === 0}
                  fallbackSrc={DEFAULT_IMAGE}
                />

                {/* Navigation Dots - Always Visible */}
                {visibleImages.length > 1 && (
                  <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 z-10">
                    {visibleImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentImageIndex(index);
                        }}
                        className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                          currentImageIndex === index
                            ? 'bg-white scale-110'
                            : 'bg-white/60 hover:bg-white/80'
                        }`}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                )}

                {/* Navigation Arrows - Visible on Hover */}
                {visibleImages.length > 1 && currentImageIndex < 5 && (
                  <div 
                    className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-hidden="true"
                  >
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigateImage('prev');
                      }}
                      className="ml-2 p-2 rounded-full bg-white/90 text-gray-800 hover:bg-white transition-colors transform -translate-x-2 group-hover:translate-x-0 transition-all duration-200"
                      aria-label="Previous image"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        navigateImage('next');
                      }}
                      className="mr-2 p-2 rounded-full bg-white/90 text-gray-800 hover:bg-white transition-colors transform translate-x-2 group-hover:translate-x-0 transition-all duration-200"
                      aria-label="Next image"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                )}

                {/* View More Photos Overlay */}
                {images.length > 6 && currentImageIndex === 5 && (
                  <div
                    className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center transition-opacity duration-300"
                    onClick={handleViewMore}
                  >
                    <button 
                      className="px-4 py-2 bg-white text-gray-900 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleViewMore(e);
                      }}
                    >
                      View Property
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <div className="p-4">
          {/* Property Title */}
          <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
            {formatTitle(property.title)}
          </h3>

          {/* Property Details */}
          <div className="grid grid-cols-3 gap-4 text-center">
            {/* Price */}
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">£{property.price}</span>
              <span className="text-xs text-gray-500">
                {locale === 'zh'
                  ? '/周'
                  : locale === 'hi'
                  ? '/सप्ताह'
                  : 'per week'}
              </span>
            </div>
            {/* Rooms */}
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{property.rooms}</span>
              <span className="text-xs text-gray-500">
                {locale === 'zh'
                  ? '卧室'
                  : locale === 'hi'
                  ? 'बेडरूम'
                  : property.rooms === 1
                  ? 'bedroom'
                  : 'bedrooms'}
              </span>
            </div>
            {/* Bathrooms */}
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{property.bathrooms}</span>
              <span className="text-xs text-gray-500">
                {locale === 'zh'
                  ? '浴室'
                  : locale === 'hi'
                  ? 'बाथरूम'
                  : property.bathrooms === 1
                  ? 'bathroom'
                  : 'bathrooms'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
