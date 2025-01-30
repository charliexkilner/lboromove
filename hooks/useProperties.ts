import { useState, useEffect } from 'react';
import { Property } from '../types/property';

const ITEMS_PER_PAGE = 12;

export const useProperties = (filters?: {
  minPrice?: number;
  maxPrice?: number;
  rooms?: number;
  // Add other filter parameters
}) => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `/api/properties?page=${page}&limit=${ITEMS_PER_PAGE}${
          filters ? `&filters=${JSON.stringify(filters)}` : ''
        }`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.properties || !Array.isArray(data.properties)) {
        throw new Error('Invalid data format received from server');
      }

      if (data.properties.length < ITEMS_PER_PAGE) {
        setHasMore(false);
      }

      setProperties((prev) => [...prev, ...data.properties]);
    } catch (error) {
      console.error('Error fetching properties:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, [page, JSON.stringify(filters)]);

  const loadMore = () => {
    if (!loading && !error) {
      setPage((prev) => prev + 1);
    }
  };

  return { properties, loading, hasMore, loadMore, error };
};
