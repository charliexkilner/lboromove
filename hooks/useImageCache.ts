import { useQueryClient, useQuery, useMutation } from '@tanstack/react-query';

const IMAGE_CACHE_KEY = 'loadedImages';

export function useImageCache() {
  const queryClient = useQueryClient();

  // Initialize cache if it doesn't exist
  useQuery({
    queryKey: [IMAGE_CACHE_KEY],
    queryFn: () => {
      const existingCache = queryClient.getQueryData([IMAGE_CACHE_KEY]);
      if (!existingCache) {
        queryClient.setQueryData([IMAGE_CACHE_KEY], new Set<string>());
      }
      return queryClient.getQueryData([IMAGE_CACHE_KEY]) as Set<string>;
    },
    staleTime: Infinity,
    gcTime: Infinity,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  // Add an image to the cache
  const addToCache = useMutation({
    mutationFn: (imageUrl: string) => {
      queryClient.setQueryData([IMAGE_CACHE_KEY], (old: Set<string> = new Set()) => {
        return new Set([...Array.from(old), imageUrl]);
      });
      return Promise.resolve();
    },
  });

  // Check if an image is in the cache
  const isImageLoaded = (imageUrl?: string) => {
    if (!imageUrl) return false;
    const cache = queryClient.getQueryData([IMAGE_CACHE_KEY]) as Set<string>;
    return cache?.has(imageUrl) ?? false;
  };

  // Preload a list of images
  const preloadImages = async (imageUrls: string[]) => {
    const uniqueUrls = [...new Set(imageUrls)].filter(url => url && !isImageLoaded(url));
    
    if (uniqueUrls.length === 0) return;

    // Create a batch of image loading promises
    const loadPromises = uniqueUrls.map((url) => 
      new Promise<string>((resolve) => {
        const img = new window.Image();
        img.onload = () => {
          addToCache.mutate(url);
          resolve(url);
        };
        img.onerror = () => resolve(url);
        img.src = url;
      })
    );

    try {
      await Promise.all(loadPromises);
    } catch (error) {
      console.error('Error preloading images:', error);
    }
  };

  // Preload images from multiple properties
  const preloadPropertyImages = async (properties: any[]) => {
    if (!properties?.length) return;
    
    const allImages = properties.flatMap(property => {
      if (!property?.images) return [];
      return Array.isArray(property.images) 
        ? property.images.filter(img => typeof img === 'string' && img)
        : [property.images].filter(Boolean);
    });

    await preloadImages(allImages);
  };

  return {
    loadedImages: queryClient.getQueryData([IMAGE_CACHE_KEY]) as Set<string>,
    addToCache: addToCache.mutate,
    isImageLoaded,
    preloadImages,
    preloadPropertyImages,
  };
} 