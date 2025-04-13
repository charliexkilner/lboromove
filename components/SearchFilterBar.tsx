import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from "@/components/ui/slider";

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
    if (initialBedrooms !== undefined) {
      setBedrooms(initialBedrooms);
    }
    if (initialPrice !== undefined) {
      setPriceRange(initialPrice);
    }
  }, [initialBedrooms, initialPrice]);

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
    const newValue = bedrooms === undefined ? 1 : Math.min(bedrooms + 1, 20);
    setBedrooms(newValue);
  };

  const decrementBedrooms = () => {
    const newValue = bedrooms === undefined ? undefined : Math.max(bedrooms - 1, 1);
    setBedrooms(newValue);
  };

  const resetPrice = () => {
    setPriceRange(500);
  };

  const resetBedrooms = () => {
    setBedrooms(undefined);
  };

  const handlePriceChange = (value: number[]) => {
    setPriceRange(value[0]);
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
      <div className="flex items-center justify-between">
        <h3 className="font-medium uppercase tracking-wide">Price filter</h3>
        <button 
          onClick={resetPrice}
          className="text-gray-500 text-sm hover:text-purple-600 transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="text-3xl font-bold text-purple-600">£{priceRange}</span>
        <span className="text-sm text-gray-500">per week</span>
      </div>
      <div className="relative py-6 px-2 md:px-4">
        <Slider
          value={[priceRange]}
          min={0}
          max={500}
          step={10}
          onValueChange={handlePriceChange}
          className="w-full"
        />
        <div className="mt-4 flex justify-between items-center">
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-600">£0</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-600">£250</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm text-gray-600">£500+</span>
          </div>
        </div>
      </div>
      <div className="flex justify-between mt-6">
        <button
          onClick={() => setPriceRange(500)}
          className="py-3 px-6 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-[48%] font-medium"
        >
          Any
        </button>
        <button
          onClick={handleSearch}
          className="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-[48%] font-medium"
        >
          Apply
        </button>
      </div>
    </div>
  );

  const BedroomsFilter = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium uppercase tracking-wide">Number of Bedrooms</h3>
        <button 
          onClick={resetBedrooms}
          className="text-gray-500 text-sm hover:text-purple-600 transition-colors"
        >
          Reset
        </button>
      </div>
      <div className="flex items-center justify-between p-4 rounded-xl border bg-gray-50">
        <button
          type="button"
          onClick={decrementBedrooms}
          className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow hover:shadow-md transition-all text-xl font-bold hover:bg-purple-50"
          aria-label="Decrease bedrooms"
        >
          −
        </button>
        <span className="text-2xl font-semibold">{bedrooms === undefined ? "Any" : bedrooms}</span>
        <button
          type="button"
          onClick={incrementBedrooms}
          className="w-12 h-12 flex items-center justify-center rounded-lg bg-white shadow hover:shadow-md transition-all text-xl font-bold hover:bg-purple-50"
          aria-label="Increase bedrooms"
        >
          +
        </button>
      </div>
      
      <div className="flex justify-between mt-6">
        <button
          onClick={resetBedrooms}
          className="py-3 px-6 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-[48%] font-medium"
        >
          Any beds
        </button>
        <button
          onClick={handleSearch}
          className="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-[48%] font-medium"
        >
          Apply
        </button>
      </div>
    </div>
  );

  if (isCompact) {
    return (
      <div className="w-full flex justify-center" id="search-filter-compact">
        <div className="flex items-center gap-2 bg-white/70 backdrop-filter backdrop-blur-lg rounded-full border border-gray-200 shadow-sm p-1.5 max-w-fit">
          <div className="relative" ref={bedroomsRef}>
            <button
              type="button"
              className={`px-3 py-2 md:py-1.5 rounded-full text-[13px] font-medium flex items-center gap-2 min-w-[110px] ${isBedroomsOpen ? 'bg-purple-100 text-purple-800' : 'hover:bg-gray-50/70'}`}
              onClick={handleBedroomsButtonClick}
            >
              <span className="text-sm">🛏️</span>
              <span>{bedrooms === undefined ? "Any" : bedrooms}</span>
            </button>
            
            {isBedroomsOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white/70 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg z-[9999] border">
                <BedroomsFilter />
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
              <span>{priceRange === 500 ? "Any" : `£${priceRange}/w`}</span>
            </button>
            
            {isPriceOpen && (
              <div className="absolute top-full left-0 mt-2 w-64 p-4 bg-white/70 backdrop-filter backdrop-blur-lg rounded-xl shadow-lg z-[9999] border">
                <PriceFilter />
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
    <div className="w-full max-w-3xl mx-auto" id="search-filter-main">
      <div className="hidden sm:flex items-stretch rounded-2xl border shadow-md bg-white overflow-visible md:hover:shadow-lg transition-shadow duration-300">
        <div className="relative flex-1" ref={priceRef}>
          <button
            type="button"
            className="flex items-center px-6 py-5 h-full w-full border-r border-gray-200 text-left hover:bg-gray-50 transition-colors rounded-l-2xl"
            aria-label="Select price range"
            onClick={handlePriceButtonClick}
          >
            <span className="text-amber-500 mr-3 flex-shrink-0 text-xl">💰</span>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">PRICE</p>
              <p className="text-gray-600 font-medium mt-1">{priceRange === 500 ? "Any" : `£${priceRange}/week`}</p>
            </div>
          </button>
          
          {isPriceOpen && (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-3 w-80 p-6 bg-white rounded-xl shadow-xl z-[9999] border border-gray-200"
              >
                <PriceFilter />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <div className="relative flex-1" ref={bedroomsRef}>
          <button
            type="button"
            className="flex items-center px-6 py-5 h-full w-full border-r border-gray-200 text-left hover:bg-gray-50 transition-colors"
            aria-label="Select number of bedrooms"
            onClick={handleBedroomsButtonClick}
          >
            <span className="text-amber-500 mr-3 flex-shrink-0 text-xl">🛏️</span>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">BEDROOMS</p>
              <p className="text-gray-600 font-medium mt-1">
                {bedrooms === undefined ? "Any" : bedrooms}
              </p>
            </div>
          </button>
          
          {isBedroomsOpen && (
            <AnimatePresence>
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                transition={{ duration: 0.2 }}
                className="absolute top-full left-0 mt-3 w-80 p-6 bg-white rounded-xl shadow-xl z-[9999] border border-gray-200"
              >
                <BedroomsFilter />
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        <button
          type="button"
          className="bg-purple-600 hover:bg-purple-700 transition-colors px-8 flex items-center justify-center rounded-r-2xl shadow-sm"
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
            strokeWidth="2.5" 
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
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">PRICE</h3>
                    <button 
                      onClick={resetPrice}
                      className="text-gray-500 text-sm hover:text-purple-600 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
                  <PriceFilter />
                </div>
                
                <hr className="border-gray-200" />
                
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-900">BEDROOMS</h3>
                    <button 
                      onClick={resetBedrooms}
                      className="text-gray-500 text-sm hover:text-purple-600 transition-colors"
                    >
                      Reset
                    </button>
                  </div>
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