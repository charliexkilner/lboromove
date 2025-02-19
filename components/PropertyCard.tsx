import Image from 'next/image';
import { useState } from 'react';
import { Property } from '@prisma/client';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { Heart, ChevronLeft, ChevronRight } from 'react-feather';
import { formatPriceWithCurrency } from '../utils/currency';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { useProtectedAction } from '@/hooks/useProtectedAction';

interface PropertyCardProps {
  property: Property;
  onMouseEnter?: () => void;
}

const DEFAULT_IMAGE =
  'https://resource.rentcafe.com/image/upload/q_auto,f_auto/s3uk/2/82438/Loughborough_StudentAccommodation.jpg';

const MAX_VISIBLE_DOTS = 6;
const LBOROMOVE_PURPLE = '#4F46E5';

export default function PropertyCard({
  property,
  onMouseEnter,
}: PropertyCardProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const { locale } = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const runProtectedAction = useProtectedAction();

  const images = Array.isArray(property.images)
    ? property.images
    : [property.images?.[0] || DEFAULT_IMAGE];

  const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>
  ) => {
    e.currentTarget.src = DEFAULT_IMAGE;
  };

  const handleClick = () => {
    const formattedTitle = property.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    const url = `/house/${property.id}`;
    router.push(url, undefined, { shallow: true });
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleClick();
  };

  const formatTitle = (title: string) => {
    return title;
  };

  const prefetchPropertyData = () => {
    // Prefetch the property data
    queryClient.prefetchQuery({
      queryKey: ['property', `/p/${property.id}`],
      queryFn: async () => {
        const res = await fetch(`/api/properties/${property.id}`);
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
    <div
      className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden cursor-pointer"
      onClick={handleClick}
      onMouseEnter={() => {
        onMouseEnter?.();
        prefetchPropertyData();
      }}
    >
      {/* Image Gallery */}
      <div className="relative aspect-[4/3] overflow-hidden">
        <div className="relative w-full h-full">
          {property.images && property.images.length > 0 ? (
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

              <Image
                src={property.images[currentImageIndex]}
                alt={`${property.title} property image ${
                  currentImageIndex + 1
                }`}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
                priority={currentImageIndex < 4}
              />

              {/* Navigation Dots - Only show on hover and when not showing view property overlay */}
              {currentImageIndex < 5 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {property.images.slice(0, 6).map((_, idx) => (
                    <button
                      key={idx}
                      className={`w-2 h-2 rounded-full ${
                        currentImageIndex === idx ? 'bg-white' : 'bg-white/60'
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setCurrentImageIndex(idx);
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Left/Right Navigation Arrows - Only show on hover and when not showing view property overlay */}
              {currentImageIndex < 5 && (
                <div className="absolute inset-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === 0 ? property.images.length - 1 : prev - 1
                      );
                    }}
                    className="p-1 m-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronLeftIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setCurrentImageIndex((prev) =>
                        prev === property.images.length - 1 ? 0 : prev + 1
                      );
                    }}
                    className="p-1 m-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                  >
                    <ChevronRightIcon className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* View More Photos Overlay */}
              {property.images.length > 6 && currentImageIndex === 5 && (
                <div
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleClick();
                  }}
                >
                  <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    View Property
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
              <PhotoIcon className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Property Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">
          {formatTitle(property.title)}
        </h3>

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
  );
}
