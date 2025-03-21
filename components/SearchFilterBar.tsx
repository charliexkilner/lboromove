import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from 'framer-motion';

interface SearchFilterBarProps {
  initialPrice?: number;
  initialBedrooms?: number;
  onFilterChange: (filters: { maxPrice?: number; bedrooms?: number }) => void;
  filteredPropertyCount?: number;
  isCompact?: boolean;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  initialPrice,
  initialBedrooms,
  onFilterChange,
  filteredPropertyCount,
  isCompact = false
}) => {
  const [priceRange, setPriceRange] = useState<number>(initialPrice !== undefined ? initialPrice : 500);
  const [bedrooms, setBedrooms] = useState<number | undefined>(initialBedrooms);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isBedroomsOpen, setIsBedroomsOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);
  const bedroomsRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  
  const isDefaultFilters = priceRange === 500 && bedrooms === undefined;

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (isPriceOpen && priceRef.current && !priceRef.current.contains(event.target as Node)) {
        setIsPriceOpen(false);
      }
      if (isBedroomsOpen && bedroomsRef.current && !bedroomsRef.current.contains(event.target as Node)) {
        setIsBedroomsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isPriceOpen, isBedroomsOpen]);

  const incrementBedrooms = () => {
    const newValue = bedrooms === undefined ? 1 : Math.min(bedrooms + 1, 8);
    setBedrooms(newValue);
  };

  const decrementBedrooms = () => {
    const newValue = bedrooms === undefined ? undefined : Math.max(bedrooms - 1, 1);
    setBedrooms(newValue);
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    setPriceRange(newValue);
  };

  const handleSearch = () => {
    onFilterChange({ 
      bedrooms: bedrooms, 
      maxPrice: priceRange === 500 ? undefined : priceRange
    });
    setIsPriceOpen(false);
    setIsBedroomsOpen(false);
    setShowModal(false);
  };

  const handlePriceButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsPriceOpen(!isPriceOpen);
    setIsBedroomsOpen(false);
  };

  const handleBedroomsButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsBedroomsOpen(!isBedroomsOpen);
    setIsPriceOpen(false);
  };

  const handleFilterClick = () => {
    if (isMobile) {
      setShowModal(true);
    }
  };

  const handleApplyFilters = () => {
    onFilterChange({ 
      bedrooms: bedrooms, 
      maxPrice: priceRange === 500 ? undefined : priceRange
    });
    setShowModal(false);
  };

  const getButtonText = () => {
    if (!isDefaultFilters && filteredPropertyCount !== undefined) {
      return `View ${filteredPropertyCount} ${filteredPropertyCount === 1 ? 'property' : 'properties'}`;
    }
    return "View properties";
  };

  const PriceFilter = () => (
    <div className="space-y-6">
      <div className="flex flex-col items-center text-center">
        <span className="text-3xl font-bold text-purple-600">£{priceRange}</span>
        <span className="text-sm text-gray-500">per week</span>
      </div>
      <div className="relative py-2">
        <input
          type="range"
          min="0"
          max="500"
          step="10"
          value={priceRange}
          onChange={handlePriceChange}
          className="w-full h-3 bg-purple-100 rounded-lg appearance-none cursor-pointer accent-purple-600
          [&::-webkit-slider-thumb]:appearance-none
          [&::-webkit-slider-thumb]:w-6
          [&::-webkit-slider-thumb]:h-6
          [&::-webkit-slider-thumb]:rounded-full
          [&::-webkit-slider-thumb]:bg-purple-600
          [&::-webkit-slider-thumb]:cursor-pointer
          [&::-webkit-slider-thumb]:shadow-md
          [&::-webkit-slider-thumb]:transition-all
          [&::-webkit-slider-thumb:hover]:w-8
          [&::-webkit-slider-thumb:hover]:h-8
          [&::-webkit-slider-thumb:hover]:shadow-lg
          [&::-moz-range-thumb]:w-6
          [&::-moz-range-thumb]:h-6
          [&::-moz-range-thumb]:rounded-full
          [&::-moz-range-thumb]:bg-purple-600
          [&::-moz-range-thumb]:border-0
          [&::-moz-range-thumb]:cursor-pointer
          [&::-moz-range-thumb]:shadow-md
          [&::-moz-range-thumb]:transition-all
          [&::-moz-range-thumb:hover]:w-8
          [&::-moz-range-thumb:hover]:h-8
          [&::-moz-range-thumb:hover]:shadow-lg"
        />
      </div>
      <div className="flex justify-between text-sm text-gray-500">
        <span>£0</span>
        <span>£500+</span>
      </div>
    </div>
  );

  const BedroomsFilter = () => (
    <div className="space-y-4">
      <h3 className="font-medium uppercase tracking-wide text-center">NUMBER OF BEDROOMS</h3>
      <div className="flex items-center justify-between p-4 rounded-xl border bg-gray-50">
        <button
          type="button"
          onClick={decrementBedrooms}
          className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow hover:shadow-md transition-all text-xl font-bold hover:bg-purple-50"
          aria-label="Decrease bedrooms"
        >
          −
        </button>
        <span className="text-3xl font-semibold">{bedrooms === undefined ? "Any beds" : `${bedrooms} bed${bedrooms === 1 ? '' : 's'}`}</span>
        <button
          type="button"
          onClick={incrementBedrooms}
          className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow hover:shadow-md transition-all text-xl font-bold hover:bg-purple-50"
          aria-label="Increase bedrooms"
        >
          +
        </button>
      </div>
    </div>
  );

  if (isCompact) {
    return (
      <div className="w-full flex justify-center">
        <div className="flex items-center gap-2 bg-white/70 backdrop-filter backdrop-blur-lg rounded-full border border-gray-200 shadow-sm p-1.5 max-w-fit">
          <div className="relative" ref={bedroomsRef}>
            <button
              type="button"
              className={`px-3 py-2 md:py-1.5 rounded-full text-[13px] font-medium flex items-center gap-2 min-w-[110px] ${isBedroomsOpen ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-50/70'}`}
              onClick={handleBedroomsButtonClick}
            >
              <span className="text-sm">🛏️</span>
              <span>{bedrooms === undefined ? "Any beds" : `${bedrooms} bed${bedrooms === 1 ? '' : 's'}`}</span>
            </button>
            
            {isBedroomsOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white/70 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg z-[9999] border">
                <BedroomsFilter />
                <button
                  onClick={handleSearch}
                  className="w-full mt-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          
          <div className="h-5 border-l border-gray-200"></div>
          
          <div className="relative" ref={priceRef}>
            <button
              type="button"
              className={`px-3 py-2 md:py-1.5 rounded-full text-[13px] font-medium flex items-center gap-2 min-w-[110px] ${isPriceOpen ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-50/70'}`}
              onClick={handlePriceButtonClick}
            >
              <span className="text-sm">💰</span>
              <span>{priceRange === 500 ? "Any price" : `£${priceRange}/w`}</span>
            </button>
            
            {isPriceOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white/70 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg z-[9999] border">
                <PriceFilter />
                <button
                  onClick={handleSearch}
                  className="w-full mt-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          
          <button
            type="button"
            className="ml-1 bg-purple-600 hover:bg-purple-700 transition-colors text-white p-2.5 rounded-full"
            aria-label="Search properties"
            onClick={handleSearch}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-white"
            >
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="hidden sm:flex items-stretch rounded-2xl border shadow-sm bg-white/70 backdrop-filter backdrop-blur-lg overflow-visible">
        <div className="relative flex-1" ref={priceRef}>
          <button
            type="button"
            className="flex items-center px-6 py-4 h-full w-full border-r border-gray-200 text-left hover:bg-gray-50/70 transition-colors rounded-l-2xl"
            aria-label="Select price range"
            onClick={handlePriceButtonClick}
          >
            <span className="text-amber-500 mr-3 flex-shrink-0 text-xl">💰</span>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">PRICE</p>
              <p className="text-gray-600">{priceRange === 500 ? "Any price" : `£${priceRange}/week`}</p>
            </div>
          </button>
          
          {isPriceOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 p-6 bg-white/70 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg z-[9999] border">
              <PriceFilter />
            </div>
          )}
        </div>

        <div className="relative flex-1" ref={bedroomsRef}>
          <button
            type="button"
            className="flex items-center px-6 py-4 h-full w-full border-r border-gray-200 text-left hover:bg-gray-50/70 transition-colors"
            aria-label="Select number of bedrooms"
            onClick={handleBedroomsButtonClick}
          >
            <span className="text-amber-500 mr-3 flex-shrink-0 text-xl">🛏️</span>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">BEDROOMS</p>
              <p className="text-gray-600">
                {bedrooms === undefined ? "Any beds" : `${bedrooms} bedroom${bedrooms === 1 ? '' : 's'}`}
              </p>
            </div>
          </button>
          
          {isBedroomsOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 p-6 bg-white/70 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg z-[9999] border">
              <BedroomsFilter />
            </div>
          )}
        </div>

        <button
          type="button"
          className="bg-purple-600 hover:bg-purple-700 transition-colors px-8 flex items-center justify-center rounded-r-2xl"
          aria-label="Search properties"
          onClick={handleSearch}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="text-white"
          >
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </button>
      </div>
      
      <div className="sm:hidden">
        <button
          type="button"
          onClick={handleFilterClick}
          className="mx-auto flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition-colors"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
          <span>Filter</span>
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 bg-white/70 backdrop-filter backdrop-blur-lg rounded-t-xl p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4 text-center">PRICE</h3>
                  <PriceFilter />
                </div>
                
                <hr className="border-gray-200" />
                
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4 text-center">BEDROOMS</h3>
                  <BedroomsFilter />
                </div>
                
                <button
                  onClick={handleApplyFilters}
                  className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
                >
                  {getButtonText()}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilterBar; 