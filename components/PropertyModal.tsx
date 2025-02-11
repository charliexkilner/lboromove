import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  HeartIcon,
  ClipboardIcon,
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';
import { useQuery } from '@tanstack/react-query';
import Image from 'next/image';
import { formatPriceWithCurrency } from '../utils/currency';
import toast from 'react-hot-toast';
import FullScreenGallery from './FullScreenGallery';

// Update the amenity icons mapping
const AMENITY_ICONS: Record<string, string> = {
  'En-suite': '🚿',
  'Large Kitchen': '🍳',
  Garden: '🌳',
  Dishwasher: '🍽️',
  'Bills Included': '💡',
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
}

export default function PropertyModal({ slug, onClose }: PropertyModalProps) {
  const propertyId = slug.split('-').pop();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('about');
  const [isFavorite, setIsFavorite] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);

  const copyToClipboard = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', propertyId],
    queryFn: async () => {
      const response = await fetch(`/api/properties/${propertyId}`);
      if (!response.ok) throw new Error('Failed to fetch property');
      return response.json();
    },
  });

  const nextImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) =>
        prev === property.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (property?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? property.images.length - 1 : prev - 1
      );
    }
  };

  const openGallery = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsGalleryOpen(true);
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose} static>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 w-full max-w-6xl">
                <div className="absolute right-0 top-0 pr-4 pt-4 z-10">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center h-96">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                  </div>
                ) : property ? (
                  <div className="flex flex-col md:flex-row h-[90vh] md:h-[80vh]">
                    {/* Image Gallery - Full width on mobile, right side on desktop */}
                    <div className="md:hidden w-full h-72 relative mb-4">
                      <Image
                        src={property.images[currentImageIndex]}
                        alt={property.title}
                        fill
                        className="object-cover cursor-pointer"
                        onClick={openGallery}
                      />
                      {property.images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <ChevronLeftIcon className="h-6 w-6" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                          >
                            <ChevronRightIcon className="h-6 w-6" />
                          </button>
                          {/* Image dots for mobile */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-1">
                            {property.images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-colors ${
                                  currentImageIndex === index
                                    ? 'bg-white'
                                    : 'bg-white/50'
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Left Content */}
                    <div className="md:w-1/2 p-6 overflow-y-auto">
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
                            { name: 'Near-by', current: false },
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

                      {/* About Tab Content */}
                      {activeTab === 'about' && (
                        <div>
                          {/* Key Stats */}
                          <div className="grid grid-cols-2 md:grid-cols-3 auto-rows-fr gap-4 mb-6">
                            {/* Price per week */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-500 uppercase">
                                  Price per week
                                </p>
                              </div>
                              <p className="text-lg font-medium mt-1">
                                <span className="mr-2">💰</span>
                                {formatPriceWithCurrency(property.price)}
                              </p>
                            </div>
                            {/* Bedrooms */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-500 uppercase">
                                  Bedrooms
                                </p>
                              </div>
                              <p className="text-lg font-medium mt-1">
                                <span className="mr-2">🛏️</span>
                                {property.rooms}
                              </p>
                            </div>
                            {/* Bathrooms */}
                            <div className="bg-gray-50 p-4 rounded-lg col-span-2 md:col-span-1">
                              <div className="flex items-center space-x-2">
                                <p className="text-sm text-gray-500 uppercase">
                                  Bathrooms
                                </p>
                              </div>
                              <p className="text-lg font-medium mt-1">
                                <span className="mr-2">🚽</span>
                                {property.bathrooms}
                              </p>
                            </div>
                          </div>

                          <p className="text-gray-600 mb-6">
                            {property.description}
                          </p>

                          <div className="mb-6">
                            <h3 className="text-lg font-semibold mb-4 uppercase">
                              Amenities
                            </h3>
                            <div className="grid grid-cols-2 gap-y-3">
                              {property.amenities?.map((amenity) => (
                                <div
                                  key={amenity}
                                  className="flex items-center space-x-2"
                                >
                                  <span>{AMENITY_ICONS[amenity] || '✓'}</span>
                                  <span className="text-gray-600">
                                    {amenity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Image Gallery - Desktop only */}
                    <div className="hidden md:block md:w-1/2 relative">
                      <div className="h-full relative">
                        <Image
                          src={property.images[currentImageIndex]}
                          alt={property.title}
                          fill
                          className="object-cover rounded-r-lg cursor-pointer"
                          onClick={openGallery}
                        />
                        {property.images.length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                            >
                              <ChevronLeftIcon className="h-6 w-6" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70"
                            >
                              <ChevronRightIcon className="h-6 w-6" />
                            </button>
                            {/* Image dots for desktop */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap justify-center gap-1 max-w-[90%]">
                              {property.images.map((_, index) => (
                                <button
                                  key={index}
                                  onClick={() => setCurrentImageIndex(index)}
                                  className={`w-2 h-2 rounded-full transition-colors ${
                                    currentImageIndex === index
                                      ? 'bg-white'
                                      : 'bg-white/50'
                                  }`}
                                />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <p className="text-gray-500">Property not found</p>
                  </div>
                )}

                {/* Add FullScreenGallery */}
                {isGalleryOpen && property && (
                  <FullScreenGallery
                    images={property.images}
                    initialIndex={currentImageIndex}
                    onClose={() => setIsGalleryOpen(false)}
                  />
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
