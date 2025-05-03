import { useState, useEffect, useCallback } from 'react';
import { Property } from '@prisma/client';

interface UsePropertiesResult {
  properties: Property[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  fetchAllForMap: () => Promise<void>;
  allMapProperties: Property[];
}

export function useProperties(filters: Record<string, any>): UsePropertiesResult {
  const [properties, setProperties] = useState<Property[]>([]);
  const [allMapProperties, setAllMapProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);

  const fetchProperties = useCallback(async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
        setProperties([]);
        setCursor(null);
      } else {
        setIsLoadingMore(true);
      }

      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      if (cursor) queryParams.append('cursor', cursor.toString());
      
      console.log('Fetching properties with filters:', JSON.stringify(filters));
      console.log('Query params:', queryParams.toString());

      const response = await fetch(`/api/properties?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch properties');

      const data = await response.json();
      
      if (isInitialLoad) {
        setProperties(data.properties);
      } else {
        setProperties(prev => [...prev, ...data.properties]);
      }
      
      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters, cursor]);

  // New function to fetch all properties for map view
  const fetchAllForMap = useCallback(async () => {
    try {
      setIsLoadingMap(true);
      
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
      // Add a special parameter to fetch all properties at once
      queryParams.append('fetchAll', 'true');
      
      console.log('Fetching ALL properties for map with filters:', JSON.stringify(filters));
      console.log('Map query params:', queryParams.toString());

      const response = await fetch(`/api/properties?${queryParams.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch all properties for map');

      const data = await response.json();
      setAllMapProperties(data.properties || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching all properties for map:', err);
      setError(err instanceof Error ? err.message : 'An error occurred fetching map data');
    } finally {
      setIsLoadingMap(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchProperties(true);
  }, [filters]);

  const loadMore = useCallback(() => {
    if (!loading && !isLoadingMore && hasMore) {
      fetchProperties(false);
    }
  }, [loading, isLoadingMore, hasMore, fetchProperties]);

  const reset = useCallback(() => {
    setProperties([]);
    setCursor(null);
    setHasMore(true);
    fetchProperties(true);
  }, [fetchProperties]);

  return {
    properties,
    loading,
    error,
    hasMore,
    loadMore,
    reset,
    fetchAllForMap,
    allMapProperties,
  };
}
