import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fetchExchangeRates, formatPriceWithCurrency } from '../utils/currency';
import { useRouter } from 'next/router';
import { Dialog } from '@headlessui/react';

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    bedrooms?: number;
    bathrooms?: number;
    maxPrice?: number;
  };
  onFilterChange: (newFilters: any) => void;
}

export default function FilterPopover({
  isOpen,
  onFilterChange,
  initialFilters,
  onClose,
}: FilterPopoverProps) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const [filters, setFilters] = useState({
    bedrooms: initialFilters?.bedrooms || 1,
    bathrooms: initialFilters?.bathrooms || 1,
    maxPrice: initialFilters?.maxPrice || 350,
  });

  // Fetch exchange rates when component mounts
  useEffect(() => {
    fetchExchangeRates();
  }, []);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: parseInt(value),
    }));
  };

  const handleBedroomChange = (increment: boolean) => {
    setFilters((prev) => ({
      ...prev,
      bedrooms: increment
        ? Math.min(prev.bedrooms + 1, 10)
        : Math.max(prev.bedrooms - 1, 1),
    }));
  };

  const handleBathroomChange = (increment: boolean) => {
    setFilters((prev) => ({
      ...prev,
      bathrooms: increment
        ? Math.min(prev.bathrooms + 1, 5)
        : Math.max(prev.bathrooms - 1, 1),
    }));
  };

  const handleApplyFilters = () => {
    onFilterChange({
      maxPrice: filters.maxPrice,
      bedrooms: filters.bedrooms,
      bathrooms: filters.bathrooms,
    });
    onClose();
  };

  const hasActiveFilters = () => {
    return (
      filters.bedrooms !== 1 ||
      filters.bathrooms !== 1 ||
      filters.maxPrice !== 350
    );
  };

  const handleReset = () => {
    setFilters({
      bedrooms: 1,
      bathrooms: 1,
      maxPrice: 350,
    });
    onFilterChange({});
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      {/* The backdrop, rendered as a fixed sibling to the panel container */}
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      {/* Full-screen container to center the panel */}
      <div className="fixed inset-0 flex items-center justify-center p-12">
        <Dialog.Panel className="mx-auto max-w-sm rounded-lg bg-white p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold">
              Filter Properties
            </Dialog.Title>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Price Range */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3 uppercase">
                💰 {t('filters.priceRangeTitle')}
              </h4>
              <div className="space-y-4">
                <div className="px-2">
                  <input
                    type="range"
                    name="maxPrice"
                    min="0"
                    max="350"
                    value={filters.maxPrice}
                    onChange={handlePriceChange}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-600 mt-1">
                    <span>£0</span>
                    <span>£350+</span>
                  </div>
                  <div className="text-center text-sm text-gray-700 mt-2">
                    <span className="font-bold text-2xl">
                      {formatPriceWithCurrency(
                        filters.maxPrice,
                        locale || 'en'
                      )}
                      {filters.maxPrice >= 350 && '+'}
                    </span>
                    <br />
                    <span className="text-gray-600 lowercase">
                      {t('filters.maxPriceLabel')}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bedrooms and Bathrooms */}
            <div className="grid grid-cols-2 gap-6">
              {/* Bedrooms */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 uppercase">
                  🛌 {t('filters.bedroomsTitle')}
                </h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleBedroomChange(false)}
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <MinusIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="text-lg font-medium w-8 text-center">
                    {filters.bedrooms}
                  </span>
                  <button
                    onClick={() => handleBedroomChange(true)}
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <PlusIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {/* Bathrooms */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3 uppercase">
                  🚿 {t('filters.bathroomsTitle')}
                </h4>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleBathroomChange(false)}
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <MinusIcon className="h-5 w-5 text-gray-600" />
                  </button>
                  <span className="text-lg font-medium w-8 text-center">
                    {filters.bathrooms}
                  </span>
                  <button
                    onClick={() => handleBathroomChange(true)}
                    className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <PlusIcon className="h-5 w-5 text-gray-600" />
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Filters */}
            {hasActiveFilters() && (
              <button
                onClick={handleReset}
                className="w-full text-purple-600 text-sm underline hover:text-purple-700 mb-2"
              >
                {t('filters.resetFilters')}
              </button>
            )}

            {/* Apply Button */}
            <button
              onClick={handleApplyFilters}
              className="w-full px-6 py-3 text-base font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              {t('filters.apply')}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
