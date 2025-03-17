import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";

interface SearchFilterBarProps {
  initialPrice?: number;
  initialBedrooms?: number;
  onFilterChange: (filters: { maxPrice?: number; bedrooms?: number }) => void;
  filteredPropertyCount?: number;
  isCompact?: boolean;
}

export default function SearchFilterBar({
  initialPrice,
  initialBedrooms,
  onFilterChange,
  filteredPropertyCount,
  isCompact = false
}: SearchFilterBarProps) {
  // Use high default values that won't filter out properties
  const [priceRange, setPriceRange] = useState<number>(initialPrice !== undefined ? initialPrice : 500);
  const [bedrooms, setBedrooms] = useState<number>(initialBedrooms !== undefined ? initialBedrooms : 1);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [isBedroomsOpen, setIsBedroomsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const priceRef = useRef<HTMLDivElement>(null);
  const bedroomsRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);
  
  // Track if filters have been changed from default
  const isDefaultFilters = priceRange === 500 && bedrooms === 1;

  // Handle click outside to close popovers
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
    const newValue = Math.min(bedrooms + 1, 8);
    setBedrooms(newValue);
    // Don't apply filter here, wait for search button click
  };

  const decrementBedrooms = () => {
    const newValue = Math.max(bedrooms - 1, 1);
    setBedrooms(newValue);
    // Don't apply filter here, wait for search button click
  };

  const handlePriceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(event.target.value);
    setPriceRange(newValue);
    // Don't apply filter here, wait for search button click
  };

  const handleSearch = () => {
    // Apply filters explicitly when search button is clicked
    onFilterChange({ 
      bedrooms: bedrooms, 
      maxPrice: priceRange === 500 ? undefined : priceRange // Don't filter if at max value
    });
    // Close any open popovers and modal
    setIsPriceOpen(false);
    setIsBedroomsOpen(false);
    setIsModalOpen(false);
  };

  // Handle price button click
  const handlePriceButtonClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    setIsPriceOpen(!isPriceOpen);
    setIsBedroomsOpen(false);
  };

  // Handle bedrooms button click
  const handleBedroomsButtonClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent default behavior
    e.stopPropagation(); // Prevent event bubbling
    setIsBedroomsOpen(!isBedroomsOpen);
    setIsPriceOpen(false);
  };

  // Toggle mobile filter modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  // Close modal
  const closeModal = () => {
    setIsModalOpen(false);
  };

  // Get button text based on filter state
  const getButtonText = () => {
    if (!isDefaultFilters && filteredPropertyCount !== undefined) {
      return `View ${filteredPropertyCount} ${filteredPropertyCount === 1 ? 'property' : 'properties'}`;
    }
    return "View properties";
  };

  // Price filter component - can be reused in desktop and mobile views
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

  // Bedrooms filter component - can be reused in desktop and mobile views
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
        <span className="text-3xl font-semibold">{bedrooms}</span>
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

  // Render compact version for sticky header
  if (isCompact) {
    return (
      <div className="w-full">
        <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-full border border-gray-200 shadow-sm p-1">
          {/* Compact Bedrooms Button */}
          <div className="relative" ref={bedroomsRef}>
            <button
              type="button"
              className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 ${isBedroomsOpen ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'}`}
              onClick={handleBedroomsButtonClick}
            >
              <span className="text-xs">🛏️</span>
              <span>{bedrooms === 1 ? "1 bed" : `${bedrooms} beds`}</span>
            </button>
            
            {isBedroomsOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white rounded-xl shadow-lg z-[9999] border">
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
          
          {/* Divider */}
          <div className="h-5 border-l border-gray-200"></div>
          
          {/* Compact Price Button */}
          <div className="relative" ref={priceRef}>
            <button
              type="button"
              className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-1 ${isPriceOpen ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-100'}`}
              onClick={handlePriceButtonClick}
            >
              <span className="text-xs">💰</span>
              <span className="truncate max-w-[60px] sm:max-w-none">{priceRange === 500 ? "Any price" : `£${priceRange}/w`}</span>
            </button>
            
            {isPriceOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white rounded-xl shadow-lg z-[9999] border">
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
          
          {/* Search Button */}
          <button
            type="button"
            className="ml-auto bg-purple-600 hover:bg-purple-700 transition-colors text-white p-2 rounded-full"
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
      {/* Desktop Filter Bar - Hidden on small screens */}
      <div className="hidden sm:flex items-stretch rounded-2xl border shadow-sm bg-white overflow-visible">
        {/* Price */}
        <div className="relative flex-1" ref={priceRef}>
          <button
            type="button"
            className="flex items-center px-6 py-4 h-full w-full border-r border-gray-200 text-left hover:bg-gray-50 transition-colors rounded-l-2xl"
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
            <div className="absolute top-full left-0 mt-2 w-80 p-6 bg-white rounded-xl shadow-lg z-[9999] border">
              <PriceFilter />
            </div>
          )}
        </div>

        {/* Bedrooms */}
        <div className="relative flex-1" ref={bedroomsRef}>
          <button
            type="button"
            className="flex items-center px-6 py-4 h-full w-full border-r border-gray-200 text-left hover:bg-gray-50 transition-colors"
            aria-label="Select number of bedrooms"
            onClick={handleBedroomsButtonClick}
          >
            <span className="text-amber-500 mr-3 flex-shrink-0 text-xl">🛏️</span>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">BEDROOMS</p>
              <p className="text-gray-600">
                {bedrooms === 1 ? "1 bedroom" : `${bedrooms} bedrooms`}
              </p>
            </div>
          </button>
          
          {isBedroomsOpen && (
            <div className="absolute top-full left-0 mt-2 w-80 p-6 bg-white rounded-xl shadow-lg z-[9999] border">
              <BedroomsFilter />
            </div>
          )}
        </div>

        {/* Search Button */}
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
      
      {/* Mobile Filter Button - Visible only on small screens */}
      <div className="sm:hidden">
        <button
          type="button"
          onClick={toggleModal}
          className="mx-auto flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-full shadow-md hover:bg-purple-700 transition-colors"
        >
          <AdjustmentsHorizontalIcon className="w-5 h-5 mr-2" />
          <span>Filter</span>
        </button>
      </div>

      {/* Mobile Filter Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 sm:hidden">
          <div className="bg-white rounded-xl w-full max-w-md p-6 max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Filter Properties</h2>
              <button 
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-6 w-6" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M6 18L18 6M6 6l12 12" 
                  />
                </svg>
              </button>
            </div>
            
            <div className="space-y-8">
              {/* Price Section */}
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900 mb-4 text-center">PRICE</h3>
                <PriceFilter />
              </div>
              
              {/* Divider */}
              <hr className="border-gray-200" />
              
              {/* Bedrooms Section */}
              <div>
                <BedroomsFilter />
              </div>
              
              {/* View Properties Button */}
              <button
                type="button"
                onClick={handleSearch}
                className="w-full py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium text-lg"
              >
                {getButtonText()}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 