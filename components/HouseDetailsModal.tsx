import React, { useState } from 'react';
import { Property } from '../types/property';
import Image from 'next/image';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Heart } from 'react-feather';
import { Toaster } from 'react-hot-toast';

interface HouseDetailsModalProps {
  property: Property;
  onClose: () => void;
}

const DETAIL_ICONS: { [key: string]: string } = {
  bedrooms: '🛏️',
  bathrooms: '🚿',
  price: '💰',
};

const AMENITY_EMOJIS: { [key: string]: string } = {
  'En-suite': '🚿',
  'Bills Included': '💡',
  'Large Kitchen': '🍽️',
  Driveway: '🚗',
  Garden: '🌳',
  'Washing Machine': '🧺',
  Dishwasher: '🍽️',
  'Fast WiFi': '📡',
};

const tabs = [
  { id: 'about', label: 'About' },
  { id: 'ratings', label: 'Ratings' },
  { id: 'nearby', label: 'Near-by' },
  { id: 'similar', label: 'Similar' },
];

const ComingSoonMessage = () => (
  <div className="flex items-center justify-center h-full text-gray-500">
    <div className="text-center">
      <p className="text-xl font-semibold mb-2">Coming Soon</p>
      <p className="text-sm">This feature is currently under development</p>
    </div>
  </div>
);

export default function HouseDetailsModal({
  property,
  onClose,
}: HouseDetailsModalProps) {
  const [activeTab, setActiveTab] = useState('about');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);

  const copyLink = () => {
    const slug = `${property.id}-${property.title
      .toLowerCase()
      .replace(/\s+/g, '-')}`;
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success(
      () => (
        <div className="flex items-center gap-2">
          <Heart
            className="h-5 w-5 text-red-500"
            fill={isFavorited ? 'none' : 'currentColor'}
          />
          <span>House added to favourites</span>
        </div>
      ),
      { duration: 2000 }
    );
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
    toast.success(
      (t) => (
        <div className="flex items-center gap-2">
          <Heart
            className="h-5 w-5 text-red-500"
            fill={isFavorited ? 'none' : 'currentColor'}
          />
          <span>House added to favourites</span>
        </div>
      ),
      { duration: 2000 }
    );
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white shadow-lg"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="flex h-full">
          {/* Left Section */}
          <div className="w-1/2 p-6 overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold mb-4">{property.title}</h2>
              <div className="flex gap-4">
                <button className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">
                  Book a viewing
                </button>
                <div className="flex gap-2">
                  <button
                    onClick={toggleFavorite}
                    className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <svg
                      className="w-6 h-6"
                      fill={isFavorited ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={copyLink}
                    className="border border-gray-300 p-2 rounded-lg hover:bg-gray-50"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="flex space-x-8">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 min-h-0 overflow-y-auto">
              <div className="h-[500px] overflow-y-auto">
                {activeTab === 'about' && (
                  <div>
                    <p className="text-gray-600 mb-6">
                      Beautiful student house located in the heart of the
                      student area. Recently renovated with modern appliances
                      and furnishings throughout.
                    </p>

                    <h3 className="font-semibold text-lg mb-4">Details</h3>
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{DETAIL_ICONS.bedrooms}</span>
                        <span className="font-medium">
                          {property.rooms} beds
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">
                          {DETAIL_ICONS.bathrooms}
                        </span>
                        <span className="font-medium">
                          {property.bathrooms} bathrooms
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{DETAIL_ICONS.price}</span>
                        <span className="font-medium">
                          £{property.price} /week
                        </span>
                      </div>
                    </div>

                    <h3 className="font-semibold text-lg mb-4">Amenities</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {Object.entries(AMENITY_EMOJIS).map(
                        ([amenity, emoji]) => (
                          <div
                            key={amenity}
                            className="flex items-center gap-2"
                          >
                            <span className="text-xl">{emoji}</span>
                            <span>{amenity}</span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
                {activeTab === 'ratings' && <ComingSoonMessage />}
                {activeTab === 'nearby' && <ComingSoonMessage />}
                {activeTab === 'similar' && <ComingSoonMessage />}
              </div>
            </div>
          </div>

          {/* Right Section - Image Gallery */}
          <div className="w-1/2">
            <div
              className="relative h-full cursor-pointer"
              onClick={() => setIsFullscreen(true)}
            >
              <Image
                src={property.images[currentImageIndex]}
                alt={property.title}
                fill
                className="object-cover"
              />
              {/* Navigation arrows */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) =>
                    prev === 0 ? property.images.length - 1 : prev - 1
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
              >
                ←
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) =>
                    prev === property.images.length - 1 ? 0 : prev + 1
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full"
              >
                →
              </button>

              {/* Image Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                {property.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      currentImageIndex === index
                        ? 'bg-white scale-125'
                        : 'bg-white/60 hover:bg-white/80'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Fullscreen Gallery */}
        {isFullscreen && (
          <div className="fixed inset-0 bg-black z-[60] flex items-center justify-center">
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="relative w-full h-full">
              <Image
                src={property.images[currentImageIndex]}
                alt={property.title}
                fill
                className="object-contain"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) =>
                    prev === 0 ? property.images.length - 1 : prev - 1
                  );
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentImageIndex((prev) =>
                    prev === property.images.length - 1 ? 0 : prev + 1
                  );
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 hover:bg-white/20"
              >
                <svg
                  className="w-6 h-6 text-white"
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
              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-2 rounded-full">
                {currentImageIndex + 1} / {property.images.length}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
