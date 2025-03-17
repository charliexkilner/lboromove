import React, { useState } from 'react';
import Image from 'next/image';
import { X, Share2, ChevronLeft, ChevronRight } from 'lucide-react';
import { PhotoIcon } from '@heroicons/react/24/outline';

interface CampusPropertyModalProps {
  property: {
    id?: number;
    title: string;
    url: string;
    imageUrl: string;
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(property.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = DEFAULT_IMAGE;
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
          {/* Property image */}
          <div className="relative h-64 w-full">
            {property.imageUrl ? (
              <Image
                src={property.imageUrl}
                alt={property.title}
                fill
                className="object-cover"
                onError={handleImageError}
              />
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <PhotoIcon className="h-12 w-12 text-gray-400" />
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