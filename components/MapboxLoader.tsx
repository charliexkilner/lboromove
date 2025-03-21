import React, { useEffect } from 'react';
import Head from 'next/head';

interface MapboxLoaderProps {
  onLoad: () => void;
  onError: (error: string) => void;
}

const MapboxLoader: React.FC<MapboxLoaderProps> = ({ onLoad, onError }) => {
  useEffect(() => {
    // Skip if mapboxgl is already loaded
    if (typeof window !== 'undefined' && (window as any).mapboxgl) {
      console.log('Mapbox already loaded, using existing instance');
      onLoad();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.js';
    script.async = true;
    script.defer = true;

    // Add stylesheet for mapbox
    const link = document.createElement('link');
    link.href = 'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css';
    link.rel = 'stylesheet';

    // Preload images used in map
    const preloadImages = [
      'https://api.mapbox.com/mapbox-gl-js/v2.15.0/mapbox-gl.css',
      '/images/property-placeholder.jpg'
    ];

    preloadImages.forEach(src => {
      const img = new window.Image();
      img.src = src;
    });

    // Load handlers
    script.onload = () => {
      console.log('Mapbox script loaded successfully');
      onLoad();
    };

    script.onerror = () => {
      console.error('Failed to load Mapbox script');
      onError('Failed to load Mapbox. Please check your internet connection and try again.');
    };

    // Append to document
    document.head.appendChild(link);
    document.body.appendChild(script);

    return () => {
      // Clean up
      if (document.head.contains(link)) {
        document.head.removeChild(link);
      }
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [onLoad, onError]);

  if (typeof window === 'undefined') {
    return null; // Don't render anything on server side
  }

  // Add CSP meta tags
  return (
    <Head>
      <meta httpEquiv="Content-Security-Policy" content="worker-src blob: ; child-src blob: ; img-src data: blob: ; connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com ;" />
    </Head>
  );
};

export default MapboxLoader; 