import { useState, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import { MinusIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { fetchExchangeRates, formatPriceWithCurrency } from '../utils/currency';
import { useRouter } from 'next/router';
import { Dialog } from '@headlessui/react';
import { usePropertyStore } from '../stores/usePropertyStore';

interface FilterPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  filters: {
    bedrooms?: number;
    bathrooms?: number;
    maxPrice?: number;
  };
  onFilterChange: (filters: any) => void;
  initialFilters?: {
    bedrooms?: number;
    bathrooms?: number;
    maxPrice?: number;
  };
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
    maxPrice: initialFilters?.maxPrice || 250,
  });
  const [propertyCount, setPropertyCount] = useState(0);
  const { properties } = usePropertyStore();

  // Reset filters when the popover opens
  useEffect(() => {
    if (isOpen) {
      setFilters({
        bedrooms: initialFilters?.bedrooms || 1,
        bathrooms: initialFilters?.bathrooms || 1,
        maxPrice: initialFilters?.maxPrice || 250,
      });
    }
  }, [isOpen, initialFilters]);

  // Calculate property count based on current filters
  useEffect(() => {
    if (properties.length > 0) {
      const filteredCount = properties.filter(property => 
        (filters.bedrooms === undefined || property.rooms >= filters.bedrooms) &&
        (filters.bathrooms === undefined || property.bathrooms >= filters.bathrooms) &&
        (filters.maxPrice === undefined || property.price <= filters.maxPrice)
      ).length;
      
      setPropertyCount(filteredCount);
    }
  }, [filters, properties]);

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setFilters({
      ...filters,
      maxPrice: value,
    });
  };

  const handleBedroomChange = (increment: boolean) => {
    setFilters({
      ...filters,
      bedrooms: increment
        ? (filters.bedrooms || 0) + 1
        : Math.max(1, (filters.bedrooms || 0) - 1),
    });
  };

  const handleBathroomChange = (increment: boolean) => {
    setFilters({
      ...filters,
      bathrooms: increment
        ? (filters.bathrooms || 0) + 1
        : Math.max(1, (filters.bathrooms || 0) - 1),
    });
  };

  const handleApplyFilters = () => {
    onFilterChange(filters);
    onClose();
  };

  const hasActiveFilters = () => {
    return (
      filters.bedrooms !== undefined ||
      filters.bathrooms !== undefined ||
      filters.maxPrice !== undefined
    );
  };

  const handleReset = () => {
    const resetFilters = {
      bedrooms: undefined,
      bathrooms: undefined,
      maxPrice: undefined,
    };
    setFilters({
      bedrooms: 1,
      bathrooms: 1,
      maxPrice: 250,
    });
    onFilterChange(resetFilters);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      <div className="flex min-h-screen items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" aria-hidden="true" />

        <div className="relative mx-auto max-w-md w-full bg-white rounded-lg shadow-xl p-8">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>

          <Dialog.Title className="text-3xl font-bold mb-8">
            Filter Properties
          </Dialog.Title>

          {/* Price Range */}
          <div className="mb-8">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-2">💰</span>
              <h3 className="text-xl font-bold uppercase">PRICE PER WEEK</h3>
            </div>
            
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={filters.maxPrice}
              onChange={handlePriceChange}
              className="w-full h-2 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            
            <div className="flex justify-between mt-2 text-gray-600">
              <span>£0</span>
              <span>£500+</span>
            </div>
            
            <div className="text-center mt-6">
              <span className="text-5xl font-bold text-purple-600">
                £{filters.maxPrice}+
              </span>
              <p className="text-gray-500 mt-1">max price per week</p>
            </div>
          </div>

          {/* Bedrooms and Bathrooms */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Bedrooms */}
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🛏️</span>
                <h3 className="text-xl font-bold uppercase">BEDROOMS</h3>
              </div>
              
              <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <button
                  onClick={() => handleBedroomChange(false)}
                  className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-700"
                >
                  −
                </button>
                <span className="text-3xl font-bold">{filters.bedrooms}</span>
                <button
                  onClick={() => handleBedroomChange(true)}
                  className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-700"
                >
                  +
                </button>
              </div>
            </div>

            {/* Bathrooms */}
            <div>
              <div className="flex items-center mb-4">
                <span className="text-2xl mr-2">🚿</span>
                <h3 className="text-xl font-bold uppercase">BATHROOMS</h3>
              </div>
              
              <div className="flex items-center justify-between border border-gray-200 rounded-lg p-4">
                <button
                  onClick={() => handleBathroomChange(false)}
                  className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-700"
                >
                  −
                </button>
                <span className="text-3xl font-bold">{filters.bathrooms}</span>
                <button
                  onClick={() => handleBathroomChange(true)}
                  className="w-10 h-10 flex items-center justify-center text-2xl font-bold text-gray-700"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={handleApplyFilters}
            className="w-full bg-purple-600 text-white py-4 rounded-lg font-medium text-lg hover:bg-purple-700 transition-colors"
          >
            View {propertyCount} Properties
          </button>

          {/* Reset Filters */}
          <button
            onClick={handleReset}
            className="w-full text-gray-500 py-4 mt-4 font-medium hover:text-gray-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </Dialog>
  );
}
