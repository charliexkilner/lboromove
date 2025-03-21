import React, { useState } from 'react';
import Link from 'next/link';
import { MagnifyingGlassIcon as SearchIcon } from '@heroicons/react/24/outline';

const FilterBar = ({ isSticky = false, isMobile = false }) => {
  const [bedrooms, setBedrooms] = useState<string>('Any');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500]);
  const [showMobileModal, setShowMobileModal] = useState(false);
  const [filteredCount, setFilteredCount] = useState(228);
  
  const handleMobileClick = () => {
    if (isMobile) {
      setShowMobileModal(true);
    }
  };

  return (
    <>
      <div className={`
        w-full transition-all duration-200
        ${isSticky ? 'bg-white/75 backdrop-blur-lg shadow-sm' : 'bg-white'}
      `}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className={`
            flex items-center justify-center gap-4 py-4
            ${isSticky ? 'lg:max-w-2xl mx-auto' : ''}
          `}>
            {!isSticky && (
              <Link href="/" className="text-purple-600 font-bold text-xl">
                LBOROMOVE
              </Link>
            )}
            
            <div className="flex items-center gap-4 flex-1 justify-center">
              <button
                onClick={handleMobileClick}
                className="px-4 py-2 rounded-full border border-gray-300 hover:border-gray-400 transition-all min-w-[120px] text-center bg-white"
              >
                {bedrooms === 'Any' ? 'Any beds' : `${bedrooms} bed${bedrooms !== '1' ? 's' : ''}`}
              </button>
              
              <button
                onClick={handleMobileClick}
                className="px-4 py-2 rounded-full border border-gray-300 hover:border-gray-400 transition-all min-w-[120px] text-center bg-white"
              >
                {priceRange[0] === 0 && priceRange[1] === 500 
                  ? 'Any price' 
                  : `£${priceRange[0]}-${priceRange[1]}`}
              </button>
            </div>

            <button
              className="p-3 rounded-full bg-purple-600 text-white hover:bg-purple-700 transition-all"
              aria-label="Search"
            >
              <SearchIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Filter Modal */}
      {showMobileModal && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-end">
          <div className="bg-white w-full rounded-t-xl p-4 animate-slide-up">
            <div className="space-y-6">
              <div>
                <label className="text-sm font-medium text-gray-700">Bedrooms</label>
                <select
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                >
                  <option value="Any">Any</option>
                  {[1,2,3,4,5,6].map(num => (
                    <option key={num} value={num.toString()}>{num}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Price per week</label>
                <div className="mt-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="10"
                    value={priceRange[1]}
                    onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>£0</span>
                    <span>£{priceRange[1]}+</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowMobileModal(false)}
                className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-all"
              >
                Show {filteredCount} properties
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FilterBar; 