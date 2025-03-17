import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { PhotoIcon } from '@heroicons/react/24/outline';
import { useProtectedAction } from '@/hooks/useProtectedAction';

interface CampusPropertyCardProps {
  property: {
    id?: number;
    title: string;
    url: string;
    imageUrl: string;
    images?: string[];
    priceRange: string;
    pricingOptions: string[];
    location: string;
    catering: string;
    bathroomType: string;
  };
  onMouseEnter?: () => void;
}

const DEFAULT_IMAGE =
  'https://resource.rentcafe.com/image/upload/q_auto,f_auto/s3uk/2/82438/Loughborough_StudentAccommodation.jpg';

const CampusPropertyCard: React.FC<CampusPropertyCardProps> = ({ property, onMouseEnter }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [imageError, setImageError] = useState(false);
  const queryClient = useQueryClient();
  const protectedAction = useProtectedAction();

  // Get all available images
  const images = property.images && property.images.length > 0 
    ? property.images 
    : property.imageUrl ? [property.imageUrl] : [];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    e.currentTarget.src = DEFAULT_IMAGE;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Navigate to property detail page or open modal
    window.open(property.url, '_blank');
  };

  const handleViewMore = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(property.url, '_blank');
  };

  const formatTitle = (title: string) => {
    return title.length > 30 ? title.substring(0, 30) + '...' : title;
  };

  // Format price range to show only the numbers
  const formatPriceRange = (priceRange: string) => {
    // Extract numbers from format like "£124.19-203.44 per week"
    const match = priceRange.match(/£(\d+(?:\.\d+)?)-(\d+(?:\.\d+)?) per week/);
    if (match) {
      const minPrice = Math.round(parseFloat(match[1]));
      const maxPrice = Math.round(parseFloat(match[2]));
      return `£${minPrice}-${maxPrice}`;
    }
    
    // Handle single price format
    const singleMatch = priceRange.match(/£(\d+(?:\.\d+)?) per week/);
    if (singleMatch) {
      const price = Math.round(parseFloat(singleMatch[1]));
      return `£${price}`;
    }
    
    return priceRange;
  };

  const prefetchPropertyData = () => {
    // This would be used to prefetch data if needed
    if (onMouseEnter) {
      onMouseEnter();
    }
  };

  const handleFavoriteClick = () => {
    protectedAction(() => {
      setIsFavorite(!isFavorite);
      // Here you would call an API to save the favorite status
    });
  };

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (images.length > 1) {
      setCurrentImageIndex((prevIndex) => (prevIndex === 0 ? images.length - 1 : prevIndex - 1));
    }
  };

  return (
    <div
      className="relative bg-white rounded-lg shadow-md overflow-hidden h-full flex flex-col"
      onMouseEnter={prefetchPropertyData}
    >
      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          handleFavoriteClick();
        }}
        className="absolute top-4 right-4 z-10 bg-white rounded-full p-1.5 shadow-md"
        aria-label="Add to favorites"
      >
        <Heart className={`w-5 h-5 ${isFavorite ? 'text-red-500 fill-red-500' : 'text-gray-400'}`} />
      </button>

      {/* Property image */}
      <div className="relative h-48 w-full">
        {images.length > 0 && !imageError ? (
          <>
            <Image
              src={images[currentImageIndex]}
              alt={property.title}
              fill
              className="object-cover"
              onError={handleImageError}
            />
            
            {/* Image navigation controls - only show if there are multiple images */}
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between">
                <button
                  onClick={prevImage}
                  className="p-1 m-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="p-1 m-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            )}
            
            {/* Image indicator dots */}
            {images.length > 1 && (
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.slice(0, 5).map((_, idx) => (
                  <button
                    key={idx}
                    className={`w-2 h-2 rounded-full ${
                      currentImageIndex === idx ? 'bg-white' : 'bg-white/60'
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(idx);
                    }}
                  />
                ))}
                {images.length > 5 && (
                  <span className="text-xs text-white">+{images.length - 5}</span>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <PhotoIcon className="h-12 w-12 text-gray-400" />
          </div>
        )}
      </div>
      
      {/* Property details */}
      <div className="p-4 flex flex-col flex-grow" onClick={handleClick}>
        <h3 className="text-lg font-semibold mb-1 text-gray-900 text-center">{formatTitle(property.title)}</h3>
        
        <div className="text-sm text-gray-600 mb-2">
          <p>{property.location}</p>
          <p>{property.catering}</p>
          <p>{property.bathroomType}</p>
        </div>
      </div>
      
      {/* Price range */}
      <div className="p-4 pt-0 text-center">
        <p className="text-lg font-semibold text-gray-900">{formatPriceRange(property.priceRange)}</p>
        <p className="text-sm text-gray-500">per week</p>
      </div>
    </div>
  );
};

export default CampusPropertyCard; 