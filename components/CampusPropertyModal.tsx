import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { X, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoIcon } from '@heroicons/react/24/outline';
import FallbackImage from './FallbackImage';

interface CampusPropertyModalProps {
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
  onClose: () => void;
}

const DEFAULT_IMAGE =
  'https://resource.rentcafe.com/image/upload/q_auto,f_auto/s3uk/2/82438/Loughborough_StudentAccommodation.jpg';

const CampusPropertyModal: React.FC<CampusPropertyModalProps> = ({ property, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Process and validate images
  const images = useMemo(() => {
    // Get all available images with proper fallback
    const imageArray = property.images && property.images.length > 0 
      ? [...property.images] 
      : property.imageUrl ? [property.imageUrl] : [];
      
    // Filter out any invalid URLs
    const validImages = imageArray.filter(img => img && typeof img === 'string' && img.trim() !== '');
    
    // Return the valid images or a default if none
    return validImages.length > 0 ? validImages : [DEFAULT_IMAGE];
  }, [property.images, property.imageUrl]);

  // Reset current image index when property changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [property.id]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(property.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-semibold">{property.title}</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={copyToClipboard}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Share"
            >
              <Share2 className="w-5 h-5" />
              {copied && (
                <span className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded">
                  Copied!
                </span>
              )}
            </button>
            <button 
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="overflow-y-auto flex-grow">
          {/* Property image carousel */}
          <div className="relative h-64 w-full">
            <FallbackImage
              src={images[currentImageIndex]}
              alt={property.title}
              fill
              className="object-cover"
              fallbackSrc={DEFAULT_IMAGE}
            />
            
            {/* Image navigation controls - only show if there are multiple images */}
            {images.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between">
                <button
                  onClick={prevImage}
                  className="p-2 ml-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="p-2 mr-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
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
          </div>
          
          {/* Property details */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Details</h3>
                <div className="space-y-2">
                  <p><span className="font-medium">Location:</span> {property.location}</p>
                  <p><span className="font-medium">Catering:</span> {property.catering}</p>
                  <p><span className="font-medium">Bathroom:</span> {property.bathroomType}</p>
                  <p><span className="font-medium">Price Range:</span> {property.priceRange}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-4">Pricing Options</h3>
                <ul className="space-y-2">
                  {property.pricingOptions.map((option, index) => (
                    <li key={index} className="text-sm">{option}</li>
                  ))}
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex space-x-4">
              <a 
                href={property.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                View on University Website
              </a>
              <button
                onClick={onClose}
                className="inline-block border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampusPropertyModal; 