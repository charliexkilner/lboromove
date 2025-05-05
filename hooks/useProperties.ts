import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Property } from '@prisma/client';

interface UsePropertiesResult {
  properties: Property[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
  reset: (forceRefetch?: boolean) => void;
  fetchAllForMap: () => Promise<void>;
  allMapProperties: Property[];
}

// Debounce helper function
const useDebounce = (fn: Function, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  return useCallback((...args: any[]) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      fn(...args);
    }, delay);
  }, [fn, delay]);
};

export function useProperties(
  filters: Record<string, any>,
  initialProperties: Property[] = []
): UsePropertiesResult {
  const [properties, setProperties] = useState<Property[]>(initialProperties);
  const [mapProperties, setMapProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(initialProperties.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingMap, setIsLoadingMap] = useState(false);
  const [isInitialized, setIsInitialized] = useState(initialProperties.length > 0);
  const prevFiltersRef = useRef<string>(JSON.stringify(filters));
  const fetchInProgressRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastMapFetchFiltersRef = useRef<string>("");

  // Memoize the map properties to ensure stable reference
  const allMapProperties = useMemo(() => mapProperties, [mapProperties]);

  const fetchProperties = useCallback(async (isInitialLoad = false, retryCount = 0) => {
    // Prevent concurrent fetches
    if (fetchInProgressRef.current) {
      console.log('Fetch already in progress, skipping');
      return;
    }

    // Create a new abort controller for this fetch
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Add a timeout to abort the request if it takes too long
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        console.log('Fetch timeout after 10 seconds, aborting request');
        abortControllerRef.current.abort();
      }
    }, 10000); // 10 second timeout

    try {
      fetchInProgressRef.current = true;
      
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
      
      // Only add cursor for pagination (not initial load)
      if (cursor && !isInitialLoad) {
        queryParams.append('cursor', cursor.toString());
      }
      
      console.log(`Fetching properties with filters:`, JSON.stringify(filters));
      console.log(`Query params:`, queryParams.toString());
      console.log(`Is initial load: ${isInitialLoad}, Cursor: ${cursor}`);

      // Add a random query parameter to prevent caching issues
      queryParams.append('_', Date.now().toString());

      // Create a more detailed request object with explicit timeouts and credentials
      const response = await fetch(`/api/properties?${queryParams.toString()}`, { 
        signal,
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (signal.aborted) {
        console.log('Fetch was aborted');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        throw new Error(`Failed to fetch properties: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      console.log(`Received ${data.properties?.length || 0} properties, hasMore: ${data.hasMore}, nextCursor: ${data.nextCursor}`);
      
      if (isInitialLoad) {
        setProperties(data.properties || []);
      } else {
        setProperties(prev => [...prev, ...(data.properties || [])]);
      }
      
      setHasMore(data.hasMore || false);
      setCursor(data.nextCursor);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      
      console.error('Error fetching properties:', err);
      
      // Implement retry for network errors or failed fetches (max 3 retries)
      const isNetworkError = err instanceof Error && 
        (err.message.includes('Failed to fetch') || 
         err.message.includes('Network request failed'));
      
      if (isNetworkError && retryCount < 3) {
        console.log(`Network error, retrying (${retryCount + 1}/3)...`);
        setTimeout(() => {
          fetchProperties(isInitialLoad, retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // On failure, allow for a clean retry
      setCursor(null);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setIsLoadingMore(false);
      fetchInProgressRef.current = false;
    }
  }, [filters, cursor]);

  // Create a debounced version of fetchProperties
  const debouncedFetchProperties = useDebounce((isInitialLoad: boolean) => {
    fetchProperties(isInitialLoad);
  }, 300);

  // Force fetch when filters change
  useEffect(() => {
    // Compare current filters with previous filters
    const currentFiltersString = JSON.stringify(filters);
    
    // Only fetch if filters have changed
    if (currentFiltersString !== prevFiltersRef.current) {
      console.log('Filters changed, fetching properties with new filters');
      prevFiltersRef.current = currentFiltersString;
      
      // Reset pagination state when filters change
      setCursor(null);
      setHasMore(true);
      
      // Always fetch when filters change, regardless of initialization state
      debouncedFetchProperties(true);
    }
  }, [filters, debouncedFetchProperties]);

  // New function to fetch all properties for map view
  const fetchAllForMap = useCallback(async (retryCount = 0) => {
    // Get a string representation of the current filters
    const currentFiltersString = JSON.stringify(filters);
    
    // Check if we've already fetched with these filters
    if (currentFiltersString === lastMapFetchFiltersRef.current && mapProperties.length > 0) {
      console.log('Map properties already fetched with current filters, using cached results');
      return;
    }
    
    // Cancel any in-progress fetches
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    // Add a timeout to abort the request if it takes too long
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        console.log('Map fetch timeout after 10 seconds, aborting request');
        abortControllerRef.current.abort();
      }
    }, 10000); // 10 second timeout
    
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
      
      // Add a cache buster only if needed
      if (currentFiltersString !== lastMapFetchFiltersRef.current) {
        queryParams.append('_', Date.now().toString());
      }
      
      console.log('Fetching ALL properties for map with filters:', currentFiltersString);
      console.log('Map query params:', queryParams.toString());

      const response = await fetch(`/api/properties?${queryParams.toString()}`, { 
        signal,
        method: 'GET',
        credentials: 'same-origin',
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      if (signal.aborted) {
        console.log('Map fetch was aborted');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No error text available');
        throw new Error(`Failed to fetch map properties: ${response.status} ${response.statusText}. ${errorText}`);
      }

      const data = await response.json();
      setMapProperties(data.properties || []);
      
      // Store filters used for this fetch
      lastMapFetchFiltersRef.current = currentFiltersString;
      
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Map fetch aborted');
        return;
      }
      
      console.error('Error fetching all properties for map:', err);
      
      // Implement retry for network errors (max 3 retries)
      const isNetworkError = err instanceof Error && 
        (err.message.includes('Failed to fetch') || 
         err.message.includes('Network request failed'));
      
      if (isNetworkError && retryCount < 3) {
        console.log(`Map fetch network error, retrying (${retryCount + 1}/3)...`);
        setTimeout(() => {
          fetchAllForMap(retryCount + 1);
        }, 1000 * (retryCount + 1)); // Exponential backoff
        return;
      }
      
      setError(err instanceof Error ? err.message : 'An error occurred fetching map data');
    } finally {
      clearTimeout(timeoutId);
      setIsLoadingMap(false);
    }
  }, [filters, mapProperties.length]);

  const loadMore = useCallback(() => {
    if (!loading && !isLoadingMore && hasMore && !fetchInProgressRef.current) {
      console.log('Loading more properties with cursor:', cursor);
      fetchProperties(false);
    }
  }, [loading, isLoadingMore, hasMore, fetchProperties, cursor]);

  const reset = useCallback((forceRefetch = false) => {
    console.log('Resetting properties, clearing cursor');
    
    // Skip reset if we already have properties and forceRefetch is false
    if (!forceRefetch && properties.length > 0) {
      console.log('Properties already loaded, skipping refetch');
      return;
    }
    
    setProperties([]);
    setCursor(null);
    setHasMore(true);
    setError(null); // Explicitly clear any error state
    fetchProperties(true);
  }, [fetchProperties, properties.length]);
  
  // Cleanup abort controller on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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
