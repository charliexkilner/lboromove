import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { AdjustmentsHorizontalIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from 'framer-motion';
import { Slider } from "@/components/ui/slider";
import { useTranslation } from "next-i18next";

interface SearchFilterBarProps {
  initialPrice?: number;
  initialBedrooms?: number;
  onFilterChange: (filters: { maxPrice?: number; bedrooms?: number }) => void;
  onSearch?: () => void;
  filteredPropertyCount?: number;
  isCompact?: boolean;
}

const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  initialPrice,
  initialBedrooms,
  onFilterChange,
  onSearch,
  filteredPropertyCount,
  isCompact = false
}) => {
  const { t } = useTranslation('common');
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
    
    // Log on initial mount to help with debugging
    console.log('SearchFilterBar mounted, mobile view:', window.innerWidth < 768);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Add/remove 'filter-modal-open' class to body when the modal is shown/hidden
  useEffect(() => {
    if (showModal) {
      document.body.classList.add('filter-modal-open');
    } else {
      document.body.classList.remove('filter-modal-open');
    }
    
    // Cleanup on component unmount
    return () => {
      document.body.classList.remove('filter-modal-open');
    };
  }, [showModal]);

  useEffect(() => {
    if (!isInitialMount.current) {
      const handleClickOutside = (event: MouseEvent) => {
        // Close price dropdown if clicking outside of it
        if (isPriceOpen && priceRef.current && !priceRef.current.contains(event.target as Node)) {
          setIsPriceOpen(false);
        }
        
        // Close bedrooms dropdown if clicking outside of it
        if (isBedroomsOpen && bedroomsRef.current && !bedroomsRef.current.contains(event.target as Node)) {
          setIsBedroomsOpen(false);
        }
      };
      
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    } else {
      isInitialMount.current = false;
    }
  }, [isPriceOpen, isBedroomsOpen]);
  
  // Handle filter values

  const incrementBedrooms = () => {
    const newValue = (bedrooms === undefined ? 1 : bedrooms + 1);
    setBedrooms(newValue);
  };
  
  const decrementBedrooms = () => {
    if (bedrooms && bedrooms > 1) {
      setBedrooms(bedrooms - 1);
    }
  };
  
  const resetPrice = () => {
    setPriceRange(500);
    onFilterChange({ 
      bedrooms: bedrooms, 
      maxPrice: undefined
    });
  };
  
  const resetBedrooms = () => {
    setBedrooms(undefined);
    onFilterChange({ 
      bedrooms: undefined, 
      maxPrice: priceRange === 500 ? undefined : priceRange
    });
  };
  
  const resetAllFilters = () => {
    setPriceRange(500);
    setBedrooms(undefined);
    onFilterChange({ 
      bedrooms: undefined, 
      maxPrice: undefined
    });
  };
  
  const handlePriceChange = (value: number[]) => {
    setPriceRange(value[0]);
  };

  const handleSearch = () => {
    // Apply local filter changes
    onFilterChange({ 
      bedrooms: bedrooms, 
      maxPrice: priceRange === 500 ? undefined : priceRange
    });
    
    // If search button is clicked, trigger the parent search handler
    if (onSearch) {
      onSearch();
    }
    
    // Close any open popovers
    setIsPriceOpen(false);
    setIsBedroomsOpen(false);
    setShowModal(false);
  };

  const handleCompactButtonClick = (type: 'price' | 'bedrooms') => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Always show modal on mobile view
    if (window.innerWidth < 768) {
      setShowModal(true);
    } else {
      if (type === 'price') {
        setIsPriceOpen(!isPriceOpen);
        setIsBedroomsOpen(false);
      } else {
        setIsBedroomsOpen(!isBedroomsOpen);
        setIsPriceOpen(false);
      }
    }
  };

  const handleFilterClick = () => {
    // Always open modal on mobile
    setShowModal(true);
  };

  const handleApplyFilters = () => {
    handleSearch();
  };

  const getButtonText = () => {
    if (!isDefaultFilters && filteredPropertyCount !== undefined) {
      return `${t('searchBar.viewProperties')} ${filteredPropertyCount} ${filteredPropertyCount === 1 ? 'property' : 'properties'}`;
    }
    return t('searchBar.viewProperties');
  };

  const BedroomsFilter = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium uppercase tracking-wide">{t('searchBar.bedrooms')} {t('searchBar.filter')}</h3>
        <button 
          onClick={resetBedrooms}
          className="text-gray-500 text-sm hover:text-purple-600 transition-colors"
        >
          {t('searchBar.resetBedrooms')}
        </button>
      </div>
      <div className="flex justify-between items-center">
        <button
          onClick={decrementBedrooms}
          disabled={bedrooms === undefined || bedrooms <= 1}
          className={`w-12 h-12 rounded-full flex items-center justify-center border ${
            bedrooms === undefined || bedrooms <= 1
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600'
          } transition-colors`}
        >
          <span className="text-xl">−</span>
        </button>

        <div className="flex flex-col items-center">
          <span className="text-2xl font-bold text-purple-600">{bedrooms === undefined ? '?' : bedrooms}</span>
          <span className="text-sm text-gray-500">{bedrooms === 1 ? t('searchBar.bedroom') : t('searchBar.bedroomPlural')}</span>
        </div>

        <button
          onClick={incrementBedrooms}
          disabled={bedrooms !== undefined && bedrooms >= 20}
          className={`w-12 h-12 rounded-full flex items-center justify-center border ${
            bedrooms !== undefined && bedrooms >= 20
              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
              : 'border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600'
          } transition-colors`}
        >
          <span className="text-xl">+</span>
        </button>
      </div>
      <div className="flex justify-between mt-6">
        <button
          onClick={() => {
            setBedrooms(undefined);
            onFilterChange({ 
              bedrooms: undefined, 
              maxPrice: priceRange === 500 ? undefined : priceRange
            });
          }}
          className="py-3 px-6 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-[48%] font-medium"
        >
          {t('searchBar.any')}
        </button>
        <button
          onClick={handleSearch}
          className="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-[48%] font-medium"
        >
          {t('searchBar.apply')}
        </button>
      </div>
    </div>
  );

  const PriceFilter = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium uppercase tracking-wide">{t('searchBar.price')} {t('searchBar.filter')}</h3>
        <button 
          onClick={resetPrice}
          className="text-gray-500 text-sm hover:text-purple-600 transition-colors"
        >
          {t('searchBar.resetPrice')}
        </button>
      </div>
      <div className="flex flex-col items-center text-center">
        <span className="text-3xl font-bold text-purple-600">£{priceRange}</span>
        <span className="text-sm text-gray-500">{t('searchBar.perWeek')}</span>
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
          onClick={() => {
            setPriceRange(500);
            onFilterChange({ 
              bedrooms: bedrooms, 
              maxPrice: undefined
            });
          }}
          className="py-3 px-6 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-[48%] font-medium"
        >
          {t('searchBar.any')}
        </button>
        <button
          onClick={handleSearch}
          className="py-3 px-6 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-[48%] font-medium"
        >
          {t('searchBar.apply')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="w-full max-w-3xl mx-auto" id="search-filter-main">
      {/* Desktop search filter bar - now visible on all screen sizes */}
      <div className="flex items-stretch rounded-2xl border shadow-md bg-white overflow-visible md:hover:shadow-lg transition-shadow duration-300">
        <div className="relative flex-1" ref={priceRef}>
          <button
            type="button"
            className="flex items-center px-6 py-5 h-full w-full border-r border-gray-200 text-left hover:bg-gray-50 transition-colors rounded-l-2xl"
            aria-label="Select price range"
            onClick={handleCompactButtonClick('price')}
          >
            <span className="text-amber-500 mr-3 flex-shrink-0 text-xl">💰</span>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">{t('searchBar.price')}</p>
              <p className="text-gray-600 font-medium mt-1">{priceRange === 500 ? t('searchBar.any') : `£${priceRange}/${t('searchBar.perWeek')}`}</p>
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
            className="flex items-center px-6 py-5 h-full w-full text-left hover:bg-gray-50 transition-colors"
            aria-label="Select bedrooms"
            onClick={handleCompactButtonClick('bedrooms')}
          >
            <span className="text-blue-500 mr-3 flex-shrink-0 text-xl">🛏️</span>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-900">{t('searchBar.bedrooms')}</p>
              <p className="text-gray-600 font-medium mt-1">{bedrooms === undefined ? t('searchBar.any') : bedrooms}</p>
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

      <AnimatePresence>
        {showModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[999999] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            />
            
            {/* Modal */}
            <div 
              className="fixed bottom-0 left-0 right-0 max-h-[90vh] overflow-auto bg-white rounded-t-2xl shadow-xl"
              style={{
                zIndex: 1000000,
                paddingBottom: 'calc(2rem + env(safe-area-inset-bottom, 34px))'
              }}
            >
              {/* Drag handle */}
              <div className="w-full flex justify-center pt-3 pb-1">
                <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
              </div>
              
              {/* Content */}
              <div className="px-5 pt-4 pb-20">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">{t('searchBar.filter')}</h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className="p-2 rounded-full text-gray-400 hover:text-gray-500 hover:bg-gray-100"
                  >
                    <svg className="h-7 w-7" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Price filter */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium uppercase tracking-wide">{t('searchBar.price')}</h3>
                    <button 
                      onClick={resetPrice}
                      className="text-gray-500 text-sm hover:text-purple-600 transition-colors"
                    >
                      {t('searchBar.resetPrice')}
                    </button>
                  </div>
                  <div className="flex flex-col items-center text-center mt-4">
                    <span className="text-3xl font-bold text-purple-600">£{priceRange}</span>
                    <span className="text-sm text-gray-500">{t('searchBar.perWeek')}</span>
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
                </div>
                
                {/* Bedrooms filter */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium uppercase tracking-wide">{t('searchBar.bedrooms')}</h3>
                    <button 
                      onClick={resetBedrooms}
                      className="text-gray-500 text-sm hover:text-purple-600 transition-colors"
                    >
                      {t('searchBar.resetBedrooms')}
                    </button>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <button
                      onClick={decrementBedrooms}
                      disabled={bedrooms === undefined || bedrooms <= 1}
                      className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                        bedrooms === undefined || bedrooms <= 1
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600'
                      } transition-colors`}
                    >
                      <span className="text-2xl">−</span>
                    </button>

                    <div className="flex flex-col items-center">
                      <span className="text-3xl font-bold text-purple-600">{bedrooms === undefined ? '?' : bedrooms}</span>
                      <span className="text-sm text-gray-500">{bedrooms === 1 ? t('searchBar.bedroom') : t('searchBar.bedroomPlural')}</span>
                    </div>

                    <button
                      onClick={incrementBedrooms}
                      disabled={bedrooms !== undefined && bedrooms >= 20}
                      className={`w-14 h-14 rounded-full flex items-center justify-center border ${
                        bedrooms !== undefined && bedrooms >= 20
                          ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                          : 'border-gray-300 text-gray-700 hover:border-purple-500 hover:text-purple-600'
                      } transition-colors`}
                    >
                      <span className="text-2xl">+</span>
                    </button>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex justify-between mt-8">
                  <button
                    onClick={resetAllFilters}
                    className="py-4 px-4 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors w-[48%] font-medium"
                  >
                    {t('searchBar.resetAll')}
                  </button>
                  <button
                    onClick={handleApplyFilters}
                    className="py-4 px-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors w-[48%] font-semibold"
                  >
                    {t('searchBar.apply')}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SearchFilterBar;