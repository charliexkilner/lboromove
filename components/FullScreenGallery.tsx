import { Dialog, Transition } from '@headlessui/react';
import { Fragment, useState } from 'react';
import Image from 'next/image';
import {
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

interface FullScreenGalleryProps {
  images: string[];
  initialIndex: number;
  onClose: () => void;
}

export default function FullScreenGallery({
  images,
  initialIndex,
  onClose,
}: FullScreenGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const next = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const previous = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  return (
    <Transition.Root show={true} as={Fragment}>
      <Dialog
        as="div"
        className="fixed inset-0 z-[60] overflow-hidden"
        onClose={onClose}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-95 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="relative w-full h-full max-w-7xl transform overflow-hidden transition-all">
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute right-4 top-4 z-10 p-2 text-white hover:text-gray-300"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>

                {/* Main image */}
                <div className="relative h-full flex items-center justify-center">
                  <div className="relative h-[80vh] w-full">
                    <Image
                      src={images[currentIndex]}
                      alt={`Gallery image ${currentIndex + 1}`}
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>

                  {/* Navigation buttons */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={previous}
                        className="absolute left-4 p-2 text-white hover:text-gray-300"
                      >
                        <ChevronLeftIcon className="h-8 w-8" />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-4 p-2 text-white hover:text-gray-300"
                      >
                        <ChevronRightIcon className="h-8 w-8" />
                      </button>
                    </>
                  )}
                </div>

                {/* Image counter */}
                <div className="absolute bottom-4 left-0 right-0 text-center text-white">
                  <p className="text-sm">
                    {currentIndex + 1} / {images.length}
                  </p>
                </div>

                {/* Image dots */}
                <div className="absolute bottom-12 left-0 right-0">
                  <div className="flex justify-center gap-2 px-4">
                    {images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          currentIndex === index ? 'bg-white' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
