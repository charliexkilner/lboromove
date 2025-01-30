import { Property } from '@prisma/client';
import { X, ChevronLeft, ChevronRight } from 'react-feather';
import Image from 'next/image';
import { useState } from 'react';
import { useRouter } from 'next/router';
import { toast } from 'react-hot-toast';

interface PropertyModalProps {
  property: Property;
  onClose: () => void;
}

export default function PropertyModal({
  property,
  onClose,
}: PropertyModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const router = useRouter();
  const { locale } = router;

  const nextImage = () => {
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const previousImage = () => {
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard', {
        icon: '📋',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (err) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white md:bg-black md:bg-opacity-50">
      {/* Backdrop only visible on desktop */}
      <div className="hidden md:block fixed inset-0" onClick={onClose} />

      <div className="relative min-h-screen md:flex md:items-center md:justify-center md:p-4">
        <div className="relative bg-white w-full md:rounded-lg md:max-w-6xl md:max-h-[90vh] md:overflow-y-auto">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
          >
            <X size={24} />
          </button>

          {/* Image Gallery */}
          <div className="relative w-full aspect-[4/3] md:aspect-video">
            <Image
              src={property.images[currentImageIndex]}
              alt={property.title}
              fill
              className="object-cover"
            />

            {/* Navigation arrows */}
            <button
              onClick={previousImage}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft size={24} className="text-gray-600" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 transition-colors"
            >
              <ChevronRight size={24} className="text-gray-600" />
            </button>

            {/* Image dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {property.images.map((_, index) => (
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

          {/* Content */}
          <div className="p-4 md:p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold mb-1">
                  {property.title}
                </h2>
                <div className="text-lg md:text-xl font-semibold">
                  {formatPriceWithCurrency(property.price, locale ?? 'en')}{' '}
                  /week
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="p-2 md:p-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  aria-label="Copy link"
                >
                  <svg
                    className="w-5 h-5 md:w-6 md:h-6"
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

            {/* Details */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Details</h3>
                <div className="space-y-2">
                  <p>
                    {property.rooms}{' '}
                    {property.rooms === 1 ? 'bedroom' : 'bedrooms'}
                  </p>
                  <p>
                    {property.bathrooms}{' '}
                    {property.bathrooms === 1 ? 'bathroom' : 'bathrooms'}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{property.description}</p>
              </div>

              {/* Map */}
              <div>
                <h3 className="text-lg font-semibold mb-2">Location</h3>
                <PropertyMap streetName={property.location} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
