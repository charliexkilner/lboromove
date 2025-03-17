import { useEffect, useState } from 'react';
import Head from 'next/head';

interface MapboxLoaderProps {
  onLoad?: () => void;
}

const MapboxLoader: React.FC<MapboxLoaderProps> = ({ onLoad }) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined' && !loaded) {
      const scriptLoaded = !!document.getElementById('mapbox-gl-js');
      const styleLoaded = !!document.getElementById('mapbox-gl-css');

      if (!scriptLoaded || !styleLoaded) {
        setLoaded(true);
        
        if (onLoad) {
          // Call onLoad callback when everything is loaded
          const checkIfLoaded = setInterval(() => {
            if (window.mapboxgl) {
              clearInterval(checkIfLoaded);
              onLoad();
            }
          }, 100);
          
          // Clear the interval after 5 seconds to prevent infinite checking
          setTimeout(() => clearInterval(checkIfLoaded), 5000);
        }
      }
    }
  }, [loaded, onLoad]);

  if (typeof window === 'undefined') {
    return null; // Don't render anything on server side
  }

  return (
    <Head>
      {!loaded && (
        <>
          <link 
            id="mapbox-gl-css"
            href="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.css" 
            rel="stylesheet" 
          />
          <script 
            id="mapbox-gl-js"
            src="https://api.mapbox.com/mapbox-gl-js/v2.14.1/mapbox-gl.js"
          ></script>
        </>
      )}
    </Head>
  );
};

export default MapboxLoader; 