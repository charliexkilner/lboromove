import React, { useState, useEffect } from 'react';
import { GetStaticProps } from 'next';
import fs from 'fs';
import path from 'path';
import CampusPropertyCard from '../components/CampusPropertyCard';
import CampusPropertyModal from '../components/CampusPropertyModal';
import Layout from '../components/Layout';

interface CampusProperty {
  id?: number;
  title: string;
  url: string;
  imageUrl: string;
  priceRange: string;
  minPrice: number;
  maxPrice: number;
  pricingOptions: string[];
  location: string;
  catering: string;
  bathroomType: string;
}

interface CampusPropertiesPageProps {
  properties: CampusProperty[];
}

const CampusPropertiesPage: React.FC<CampusPropertiesPageProps> = ({ properties }) => {
  const [selectedProperty, setSelectedProperty] = useState<CampusProperty | null>(null);
  const [filter, setFilter] = useState('all');

  // Filter properties based on selected filter
  const filteredProperties = filter === 'all' 
    ? properties 
    : properties.filter(property => {
        if (filter === 'catered') return property.catering.toLowerCase().includes('catered');
        if (filter === 'self-catered') return property.catering.toLowerCase().includes('self-catered');
        if (filter === 'en-suite') return property.bathroomType.toLowerCase().includes('en-suite');
        if (filter === 'shared') return property.bathroomType.toLowerCase().includes('shared');
        return true;
      });

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">On-Campus Accommodation</h1>
        
        {/* Filters */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-md ${filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilter('catered')}
              className={`px-4 py-2 rounded-md ${filter === 'catered' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Catered
            </button>
            <button 
              onClick={() => setFilter('self-catered')}
              className={`px-4 py-2 rounded-md ${filter === 'self-catered' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Self-Catered
            </button>
            <button 
              onClick={() => setFilter('en-suite')}
              className={`px-4 py-2 rounded-md ${filter === 'en-suite' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              En-Suite
            </button>
            <button 
              onClick={() => setFilter('shared')}
              className={`px-4 py-2 rounded-md ${filter === 'shared' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}
            >
              Shared Bathroom
            </button>
          </div>
        </div>
        
        {/* Property grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProperties.map((property) => (
            <div 
              key={property.title} 
              onClick={() => setSelectedProperty(property)}
              className="cursor-pointer"
            >
              <CampusPropertyCard property={property} />
            </div>
          ))}
        </div>
        
        {/* Property modal */}
        {selectedProperty && (
          <CampusPropertyModal 
            property={selectedProperty} 
            onClose={() => setSelectedProperty(null)} 
          />
        )}
      </div>
    </Layout>
  );
};

export const getStaticProps: GetStaticProps = async () => {
  try {
    // Path to the JSON file
    const filePath = path.join(process.cwd(), 'data', 'campus-properties.json');
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      return {
        props: {
          properties: [],
        },
        revalidate: 60, // Revalidate every minute
      };
    }
    
    // Read the file
    const fileContents = fs.readFileSync(filePath, 'utf8');
    const properties: CampusProperty[] = JSON.parse(fileContents);
    
    return {
      props: {
        properties,
      },
      revalidate: 60, // Revalidate every minute
    };
  } catch (error) {
    console.error('Error reading campus properties:', error);
    
    return {
      props: {
        properties: [],
      },
      revalidate: 60, // Revalidate every minute
    };
  }
};

export default CampusPropertiesPage; 