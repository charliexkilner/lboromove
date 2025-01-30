import { GetServerSideProps } from 'next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useRouter } from 'next/router';
import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import HouseDetailsModal from '../../components/HouseDetailsModal';
import { Property } from '../../types/property';
import { useTranslation } from 'next-i18next';
import Image from 'next/image';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import PropertyMap from '../../components/PropertyMap';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface PropertyPageProps {
  property: Property;
}

const MAX_VISIBLE_DOTS = 6;

function PropertyModalSkeleton() {
  return (
    <div className="fixed inset-0 z-50 bg-white md:bg-black md:bg-opacity-50">
      <div className="animate-pulse bg-gray-200 w-full h-screen md:h-[90vh] md:w-[90vw] md:max-w-6xl md:mx-auto md:my-[5vh] md:rounded-lg"></div>
    </div>
  );
}

export default function PropertyPage({
  property: initialProperty,
}: PropertyPageProps) {
  const router = useRouter();
  const { t, i18n } = useTranslation('common');
  const { id } = router.query;

  const queryClient = useQueryClient();

  const { data: propertyData, isLoading } = useQuery({
    queryKey: ['property', router.asPath],
    queryFn: async () => {
      const res = await fetch(`/api/properties/${id}`);
      if (!res.ok) throw new Error('Failed to fetch property');
      return res.json();
    },
    initialData: initialProperty,
    staleTime: 1000 * 60,
  });

  const [isMobile, setIsMobile] = useState(false);

  // Add state for image gallery
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState('about');

  // Handle mobile detection on client side only
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const nextImage = () => {
    if (propertyData?.images) {
      setCurrentImageIndex((prev) =>
        prev === propertyData.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (propertyData?.images) {
      setCurrentImageIndex((prev) =>
        prev === 0 ? propertyData.images.length - 1 : prev - 1
      );
    }
  };

  const closeModal = () => {
    router.push('/', undefined, { shallow: true });
  };

  const formatTitle = (title: string, language: string) => {
    // Return title as-is since the data is now correct
    return title;
  };

  // Add error handling
  if (!propertyData && !isLoading) {
    router.push('/');
    return null;
  }

  // Show loading skeleton while fetching
  if (isLoading) {
    return <PropertyModalSkeleton />;
  }

  // Return loading state until we know if we're on mobile
  if (typeof window === 'undefined') {
    return null;
  }

  return isMobile ? (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      {/* Image Gallery */}
      <div className="relative h-[400px] w-full">
        {/* Close button */}
        <button
          onClick={closeModal}
          className="absolute right-4 top-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
        <Image
          src={propertyData?.images[currentImageIndex] || '/placeholder.jpg'}
          alt={propertyData?.title ?? ''}
          fill
          className="object-cover"
          priority
        />

        {/* Update navigation arrows to match property cards */}
        <button
          onClick={() =>
            setCurrentImageIndex((prev) =>
              propertyData?.images
                ? prev === 0
                  ? propertyData.images.length - 1
                  : prev - 1
                : 0
            )
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
        >
          <ChevronLeftIcon className="h-5 w-5 text-gray-600" />
        </button>
        <button
          onClick={() =>
            setCurrentImageIndex((prev) =>
              propertyData?.images
                ? prev === propertyData.images.length - 1
                  ? 0
                  : prev + 1
                : 0
            )
          }
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
        >
          <ChevronRightIcon className="h-5 w-5 text-gray-600" />
        </button>

        {/* Image dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
          {propertyData?.images.map((_: string, index: number) => (
            <button
              key={index}
              onClick={() => setCurrentImageIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentImageIndex
                  ? 'bg-white'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to image ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Mobile Content */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {formatTitle(propertyData?.title ?? '', i18n.language)}
          </h1>
          <div className="flex items-center gap-4">
            <button className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium">
              Book a viewing
            </button>
            <button className="p-3 border border-gray-300 rounded-lg">
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
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
            <button className="p-3 border border-gray-300 rounded-lg">
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
                  d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <div className="flex space-x-8 overflow-x-auto">
            <button
              className={`px-1 py-4 border-b-2 whitespace-nowrap ${
                activeTab === 'about'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500'
              } font-medium`}
              onClick={() => setActiveTab('about')}
            >
              About
            </button>
            <button
              className="px-1 py-4 text-gray-500 whitespace-nowrap"
              onClick={() => setActiveTab('ratings')}
            >
              Ratings
            </button>
            <button
              className="px-1 py-4 text-gray-500 whitespace-nowrap"
              onClick={() => setActiveTab('nearby')}
            >
              Near-by
            </button>
            <button
              className="px-1 py-4 text-gray-500 whitespace-nowrap"
              onClick={() => setActiveTab('similar')}
            >
              Similar
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'about' && (
          <>
            {/* Description */}
            <p className="text-gray-600 mb-8">{propertyData?.description}</p>

            {/* Details */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Details</h2>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🛏️</span>
                  <div>
                    <div className="font-medium">{propertyData?.rooms}</div>
                    <div className="text-sm text-gray-500">beds</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🚿</span>
                  <div>
                    <div className="font-medium">{propertyData?.bathrooms}</div>
                    <div className="text-sm text-gray-500">bathrooms</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💰</span>
                  <div>
                    <div className="font-medium">£{propertyData?.price}</div>
                    <div className="text-sm text-gray-500">/week</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Amenities */}
            <div className="mb-8">
              <h2 className="text-xl font-bold mb-4">Amenities</h2>
              <div className="grid grid-cols-2 gap-4">
                {propertyData?.amenities?.map(
                  (amenity: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>{amenity}</span>
                    </div>
                  )
                )}
              </div>
            </div>
          </>
        )}

        {/* Add Coming Soon messages for other tabs */}
        {(activeTab === 'ratings' ||
          activeTab === 'nearby' ||
          activeTab === 'similar') && (
          <div className="text-center py-12">
            <h3 className="text-xl font-bold mb-2">Coming Soon</h3>
            <p className="text-gray-600">
              This feature is currently under development
            </p>
          </div>
        )}

        {activeTab === 'map' && (
          <div className="mb-8">
            <PropertyMap
              streetName={propertyData?.title?.replace(' Street', '') ?? ''}
            />
          </div>
        )}
      </div>
    </div>
  ) : (
    <div>
      <Navbar />
      {propertyData && (
        <HouseDetailsModal property={propertyData} onClose={closeModal} />
      )}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async ({
  params,
  locale,
}) => {
  try {
    if (!params?.slug) {
      return {
        notFound: true,
      };
    }

    // Extract the ID from the slug (everything before the first hyphen)
    const id = (params.slug as string).split('-')[0];

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/properties/${id}`
    );

    if (!response.ok) {
      return {
        notFound: true,
      };
    }

    try {
      const property = await response.json();
      console.log('Fetched property:', property);

      if (!property) {
        return {
          notFound: true,
        };
      }

      return {
        props: {
          property,
          ...(await serverSideTranslations(locale ?? 'en', ['common'])),
        },
      };
    } catch (error: any) {
      console.error('Error parsing property:', error?.message);
      return {
        notFound: true,
      };
    }
  } catch (error) {
    console.error('Error in getServerSideProps:', error);
    return {
      notFound: true,
    };
  }
};
