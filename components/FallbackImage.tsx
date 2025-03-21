import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

interface FallbackImageProps {
  src: string;
  alt: string;
  fallbackSrc?: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  sizes?: string;
  priority?: boolean;
}

const DEFAULT_FALLBACK = '/images/property-placeholder.jpg';

// Create a new cache key for each session/page load
const CACHE_KEY = Date.now().toString();
const IMAGE_CACHE: Record<string, boolean> = {};
const MAX_FAILURES = 3;
const FAILURE_CACHE: Record<string, number> = {};

// Known problematic domains
const PROBLEMATIC_DOMAINS: string[] = []; // Remove domain restrictions

const isProblematicUrl = (url: string): boolean => {
  if (!url || typeof url !== 'string') return true;
  try {
    new URL(url);
    return false;
  } catch {
    return true;
  }
};

const FallbackImage: React.FC<FallbackImageProps> = ({
  src,
  alt,
  fallbackSrc = DEFAULT_FALLBACK,
  width,
  height,
  className,
  fill = false,
  sizes,
  priority = false,
}) => {
  const isMounted = useRef(true);
  const [key, setKey] = useState(CACHE_KEY);
  const [imgSrc, setImgSrc] = useState<string>(() => {
    if (!src || typeof src !== 'string') {
      return fallbackSrc;
    }
    return src;
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  
  // Reset state when src changes
  useEffect(() => {
    if (!src || typeof src !== 'string') return;
    
    setImgSrc(src);
    setIsLoading(true);
    setHasError(false);
    setKey(Date.now().toString()); // Force new key on src change
    
    const img = new window.Image();
    let isActive = true;
    
    const cleanup = () => {
      isActive = false;
      img.onload = null;
      img.onerror = null;
    };
    
    img.onload = () => {
      if (!isActive) return;
      IMAGE_CACHE[src] = true;
      setImgSrc(src);
      setIsLoading(false);
      setHasError(false);
      cleanup();
    };
    
    img.onerror = () => {
      if (!isActive) return;
      FAILURE_CACHE[src] = (FAILURE_CACHE[src] || 0) + 1;
      setImgSrc(fallbackSrc);
      setHasError(true);
      setIsLoading(false);
      cleanup();
    };
    
    img.src = src;
    
    return cleanup;
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!src || hasError) return;
    
    FAILURE_CACHE[src] = (FAILURE_CACHE[src] || 0) + 1;
    setImgSrc(fallbackSrc);
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    if (src) {
      IMAGE_CACHE[src] = true;
    }
    setIsLoading(false);
  };

  return (
    <div className={`relative ${fill ? 'w-full h-full' : ''}`}>
      {isLoading && !hasError && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className || ''}`}
          style={{ 
            borderRadius: 'inherit',
            zIndex: 1
          }}
        ></div>
      )}
      
      <Image
        key={`${key}-${src}`} // Add key to force remount
        src={imgSrc}
        alt={alt}
        width={!fill ? width : undefined}
        height={!fill ? height : undefined}
        className={`${className || ''} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        fill={fill}
        sizes={sizes}
        priority={priority}
        loading={priority ? "eager" : "lazy"}
        ref={imageRef}
        unoptimized={true}
      />
    </div>
  );
};

export default FallbackImage; 