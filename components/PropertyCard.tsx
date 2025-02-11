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
    const url = `/house/${formattedTitle}-${property.id}`;
    router.push(url, undefined, { shallow: true });
  };

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
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

  return (
    <div
      onMouseEnter={() => {
        prefetchPropertyData();
        onMouseEnter?.();
      }}
      onClick={handleClick}
      className="border rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer bg-white"
    >
      <div className="relative h-48">
        <Image
          src={images[currentImageIndex]}
          alt={property.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          onError={handleImageError}
        />
        {/* Favorite button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-2 right-2 p-2 rounded-full bg-white shadow hover:bg-gray-100 transition-colors z-10"
        >
          <Heart
            size={20}
            className={
              isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'
            }
          />
        </button>

        {/* Navigation arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full bg-black/50 text-white opacity-0 hover:opacity-100 transition-opacity"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </>
        )}

        {/* Image navigation dots or view more button */}
        <div className="absolute inset-0 flex items-center justify-center">
          {images.length > MAX_VISIBLE_DOTS &&
          currentImageIndex >= MAX_VISIBLE_DOTS ? (
            <>
              {/* Blur overlay */}
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
              {/* Button */}
              <button
                onClick={handleViewMore}
                className="relative z-10 px-4 py-2 bg-[#4F46E5] text-white text-xs font-semibold rounded-full hover:bg-[#4338CA] transition-colors transform hover:scale-105 duration-200 shadow-lg"
              >
                VIEW MORE INFORMATION
              </button>
            </>
          ) : (
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
              {images.slice(0, MAX_VISIBLE_DOTS).map((_, index) => (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImageIndex(index);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    currentImageIndex === index ? 'bg-white' : 'bg-white/60'
                  }`}
                />
              ))}
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
