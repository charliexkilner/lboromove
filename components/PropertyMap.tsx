import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Property } from "@prisma/client";
import { Heart, X, Map as MapIcon, Home, Navigation } from "react-feather";
import { Feature, Polygon } from 'geojson';
import MapboxLoader from "./MapboxLoader";
import FallbackImage from "./FallbackImage";
import { PhotoIcon } from "@heroicons/react/24/outline";

// Don't import mapboxgl directly - we'll load it client-side only
let mapboxgl: any = null;

// GeoJSON for the Golden Triangle area
const goldenTriangleGeoJSON: Feature<Polygon> = {
  type: "Feature",
  properties: {
    name: "Golden Triangle",
  },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-1.215, 52.775], // Approximate coordinates - adjust these
        [-1.205, 52.77],
        [-1.21, 52.765],
        [-1.215, 52.775],
      ],
    ],
  },
};

// More accurate GeoJSON for the University Campus area
const universityCampusGeoJSON: Feature<Polygon> = {
  type: "Feature",
  properties: {
    name: "Loughborough University",
  },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [-1.233, 52.766], // Northwest corner
        [-1.233, 52.758], // Southwest corner
        [-1.215, 52.758], // Southeast corner
        [-1.215, 52.766], // Northeast corner
        [-1.233, 52.766], // Back to start to close the polygon
      ],
    ],
  },
};

// Default location for Loughborough center
const DEFAULT_CENTER = {
  lng: -1.208,
  lat: 52.7697
};

// Extend Property type to include properties we need
interface ExtendedProperty extends Property {
  propertyType?: string;
  furnished?: boolean;
  available?: boolean;
  imageUrl?: string;
  slug?: string;
  keyFeatures?: any;
}

interface PropertyMapProps {
  onViewChange?: () => void;
  properties?: Property[];
  singlePropertyMode?: boolean;
  centerLat?: number;
  centerLng?: number;
}

const PropertyMap: React.FC<PropertyMapProps> = ({ 
  onViewChange, 
  properties = [], 
  singlePropertyMode = false,
  centerLat,
  centerLng
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<ExtendedProperty | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [favorites, setFavorites] = useState<string[]>([]);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const [mapError, setMapError] = useState<string | null>(null);
  const [markersAdded, setMarkersAdded] = useState(false);
  const [mapboxReady, setMapboxReady] = useState(false);

  // Filter properties to only include those with valid coordinates
  const validProperties = properties.filter(
    p => p && typeof p.latitude === 'number' && typeof p.longitude === 'number'
  );

  // Handler for when Mapbox is loaded
  const handleMapboxLoad = () => {
    console.log("Mapbox loaded successfully");
    setMapboxReady(true);
    // Set mapboxgl after it's loaded
    if (typeof window !== 'undefined') {
      try {
        mapboxgl = window.mapboxgl;
        // Set the token after mapboxgl is available
        if (mapboxgl) {
          mapboxgl.accessToken = "pk.eyJ1IjoiY2hhcmxpZWtpbG5lciIsImEiOiJjbDEzdG9temIwank0M2twZDMzOGRmeW83In0.Jm5wwTD8SyYzvsmxaFYDQw";
          console.log("Mapbox access token set successfully");
        } else {
          console.error("Mapbox GL is not available on window");
          setMapError("Mapbox GL failed to load");
        }
      } catch (error) {
        console.error("Error initializing Mapbox:", error);
        setMapError(`Mapbox initialization error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  };

  const handleMapboxError = (errorMsg: string) => {
    console.error("Mapbox error:", errorMsg);
    setMapError(errorMsg);
  };

  // Initialize map only after mapboxgl is available
  useEffect(() => {
    if (!mapboxReady || !mapboxgl || map.current || !mapContainer.current) {
      if (!mapboxReady) console.log("Map not initialized: Mapbox not ready");
      if (!mapboxgl) console.log("Map not initialized: mapboxgl not available");
      if (map.current) console.log("Map not initialized: map already exists");
      if (!mapContainer.current) console.log("Map not initialized: map container not found");
      return;
    }

    console.log("Map initialization starting...");
    
    // Clean up any previous instances
    const cleanup = () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };

    try {
      // Initialize with either provided coordinates or defaults
      const centerPosition = {
        lng: centerLng || DEFAULT_CENTER.lng,
        lat: centerLat || DEFAULT_CENTER.lat
      };
      
      // Super simple initialization
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [centerPosition.lng, centerPosition.lat],
        zoom: 12,
        attributionControl: true
      });

      // Add navigation control
      map.current.addControl(
        new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        }),
        'top-right'
      );

      // Add event listeners
      map.current.on('load', () => {
        console.log("Map loaded successfully");
        setMapLoaded(true);
        
        // Add Golden Triangle area
        map.current.addSource('golden-triangle', {
          type: 'geojson',
          data: goldenTriangleGeoJSON
        });
        
        map.current.addLayer({
          id: 'golden-triangle-fill',
          type: 'fill',
          source: 'golden-triangle',
          layout: {},
          paint: {
            'fill-color': '#FFD700',
            'fill-opacity': 0.2
          }
        });
        
        map.current.addLayer({
          id: 'golden-triangle-outline',
          type: 'line',
          source: 'golden-triangle',
          layout: {},
          paint: {
            'line-color': '#FFD700',
            'line-width': 2
          }
        });
        
        // Add University Campus area
        map.current.addSource('university-campus', {
          type: 'geojson',
          data: universityCampusGeoJSON
        });
        
        map.current.addLayer({
          id: 'university-campus-fill',
          type: 'fill',
          source: 'university-campus',
          layout: {},
          paint: {
            'fill-color': '#8A2BE2', // Purple
            'fill-opacity': 0.2
          }
        });
        
        map.current.addLayer({
          id: 'university-campus-outline',
          type: 'line',
          source: 'university-campus',
          layout: {},
          paint: {
            'line-color': '#8A2BE2',
            'line-width': 2
          }
        });
      });
      
      map.current.on('zoom', () => {
        if (map.current) {
          const newZoom = Math.floor(map.current.getZoom());
          if (newZoom !== zoomLevel) {
            setZoomLevel(newZoom);
          }
        }
      });
      
      map.current.on('error', (e: any) => {
        console.error("Mapbox error:", e);
        setMapError(`Map error: ${e.error?.message || "Unknown error"}`);
      });

      // Return cleanup function
      return cleanup;
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError(`Map initialization error: ${error instanceof Error ? error.message : String(error)}`);
      // Ensure cleanup still happens on error
      return cleanup;
    }
  }, [mapboxReady, centerLat, centerLng]);

  // Add a separate effect to resize the map when needed
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    const handleResize = () => {
      if (map.current) {
        map.current.resize();
        console.log("Map resized");
      }
    };
    
    // Resize immediately and on window resize
    setTimeout(handleResize, 100);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapLoaded]);

  // Function to clear existing markers
  const clearMarkers = () => {
    if (markersRef.current.length > 0) {
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.remove === 'function') {
          marker.remove();
        }
      });
      markersRef.current = [];
    }
  };

  // Add markers in a separate effect after map is loaded
  useEffect(() => {
    if (!mapboxgl || !map.current || !mapLoaded || !validProperties || validProperties.length === 0) {
      console.log("Not adding markers:", {
        mapboxgl: !!mapboxgl,
        map: !!map.current,
        mapLoaded,
        propertiesCount: validProperties?.length || 0
      });
      return;
    }
    
    console.log(`Adding markers for ${validProperties.length} properties with valid coordinates`);
    
    try {
      // Clear existing markers first
      clearMarkers();
      
      // Force map reset to ensure markers display properly
      if (map.current) {
        setTimeout(() => {
          if (map.current) {
            map.current.resize();
            // Make sure we're showing the center if provided
            if (centerLat && centerLng) {
              map.current.flyTo({
                center: [centerLng, centerLat],
                zoom: zoomLevel,
                essential: true
              });
            }
          }
        }, 200);
      }
      
      // Create bounds to fit all properties if not in single property mode
      const bounds = new mapboxgl.LngLatBounds();
      
      // Add new markers
      validProperties.forEach((property) => {
        if (!property || !property.latitude || !property.longitude || !map.current) {
          console.log("Skipping property without coordinates:", property?.id);
          return;
        }
        
        // Add to bounds
        bounds.extend([property.longitude, property.latitude]);
        
        // Create marker element
        const markerElement = document.createElement("div");
        markerElement.className = "property-marker";
        markerElement.innerHTML = createMarkerHTML(property, zoomLevel);
        
        // Create and add marker
        try {
          const marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: 'bottom'
          })
            .setLngLat([property.longitude, property.latitude])
            .addTo(map.current);
          
          // Add click event to marker
          markerElement.addEventListener("click", () => {
            setSelectedProperty(property as ExtendedProperty);
          });
          
          // Store marker reference for cleanup
          markersRef.current.push(marker);
        } catch (markerError) {
          console.error("Error adding marker for property ID:", property.id, markerError);
        }
      });
      
      // Fit map to bounds if not in single property mode and we have multiple properties
      if (!singlePropertyMode && validProperties.length > 1 && !bounds.isEmpty()) {
        try {
          map.current.fitBounds(bounds, {
            padding: 50,
            maxZoom: 15
          });
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      }
      
      console.log(`Added ${markersRef.current.length} markers to map`);
      setMarkersAdded(true);
    } catch (e) {
      console.error("Error adding markers:", e);
    }
  }, [mapLoaded, validProperties, zoomLevel, mapboxgl, centerLat, centerLng, singlePropertyMode]);

  // Create marker HTML based on zoom level
  const createMarkerHTML = (property: Property, zoom: number) => {
    // Check if it's a campus property
    const isCampusProperty = property.keyFeatures && 
      typeof property.keyFeatures === 'object' && 
      (property.keyFeatures as any).isCampusProperty;
      
    if (isCampusProperty) {
      // Special styling for campus properties at any zoom level
      return `
        <div class="w-10 h-10 rounded-full bg-purple-800 flex items-center justify-center text-white shadow-lg transform -translate-y-1/2 border-2 border-white">
          <span class="text-lg">🏛️</span>
        </div>
      `;
    }
    
    if (zoom < 13) {
      // Zoomed out - show house emoji with background
      return `
        <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg transform -translate-y-1/2">
          <span class="text-lg">🏠</span>
        </div>
      `;
    } else {
      // Zoomed in - show price and bedrooms
      return `
        <div class="bg-white rounded-lg shadow-lg p-2 border-2 border-purple-600 transform -translate-y-1/2">
          <div class="font-bold text-purple-600">£${property.price}/w</div>
          <div class="text-sm">${property.rooms || 'N/A'} bed</div>
        </div>
      `;
    }
  };

  // Toggle favorite status
  const toggleFavorite = (id: number) => {
    setFavorites((prev) => 
      prev.includes(id.toString()) 
        ? prev.filter((item) => item !== id.toString()) 
        : [...prev, id.toString()]
    );
  };

  // Close property card
  const closePropertyCard = () => {
    setSelectedProperty(null);
  };

  // Try reloading the map
  const handleRetryMap = () => {
    setMapError(null);
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    setMapLoaded(false);
    setMarkersAdded(false);
    clearMarkers();
    
    // Force re-render by updating state
    setTimeout(() => {
      setMapLoaded(false);
    }, 10);
  };

  // Get the best image for a property
  const getBestPropertyImage = (property: ExtendedProperty) => {
    if (!property) return null;
    
    // Return the first valid image
    if (property.images && Array.isArray(property.images) && property.images.length > 0) {
      for (const img of property.images) {
        if (typeof img === 'string' && img && !img.includes('cdn.profoto.com') && 
            !img.includes('loc8me.co.uk')) {
          return img;
        }
      }
    }
    
    // Fallback to imageUrl if available
    if (property.imageUrl && typeof property.imageUrl === 'string') {
      return property.imageUrl;
    }
    
    // No valid image found
    return null;
  };

  return (
    <div className="relative h-full w-full flex-1 overflow-hidden">
      <MapboxLoader onLoad={handleMapboxLoad} onError={handleMapboxError} />
      
      {/* Loading indicator */}
      {(!mapboxReady || !mapLoaded) && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-700">Loading map...</p>
        </div>
      )}
      
      {/* Show error message if map fails to load */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
          <div className="bg-white p-6 rounded-lg shadow-md max-w-md text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Map Loading Error</h3>
            <p className="text-gray-600 mb-4">{mapError}</p>
            <button
              onClick={handleRetryMap}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Retry Loading Map
            </button>
            {onViewChange && (
              <button 
                onClick={onViewChange} 
                className="ml-2 px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Switch to List View
              </button>
            )}
          </div>
        </div>
      )}
      
      {/* Map container */}
      <div
        ref={mapContainer}
        className={`absolute inset-0 ${mapError ? 'opacity-20' : ''}`}
        style={{ 
          height: "100%", 
          width: "100%",
          minHeight: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          contain: "strict"
        }}
      />
      
      {/* Property Popup Card */}
      {selectedProperty && (
        <div
          className={`absolute z-50 w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden ${
            isMobile ? "bottom-4 left-1/2 -translate-x-1/2" : "top-4 right-4"
          }`}
        >
          <div className="relative h-48 w-full">
            {/* Image section */}
            {getBestPropertyImage(selectedProperty) ? (
              <div className="relative w-full h-full">
                <FallbackImage
                  src={getBestPropertyImage(selectedProperty)!}
                  alt={selectedProperty.title}
                  fill
                  className="object-cover"
                  fallbackSrc="/images/property-placeholder.jpg"
                  priority={true}
                />
              </div>
            ) : (
              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                <PhotoIcon className="h-12 w-12 text-gray-400" />
              </div>
            )}
            
            {/* Close button */}
            <button
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2"
              onClick={closePropertyCard}
            >
              <X className="h-4 w-4" />
            </button>
            
            {/* Favorite button */}
            <button
              className="absolute top-2 right-12 bg-white/80 hover:bg-white rounded-full p-2"
              onClick={() => toggleFavorite(selectedProperty.id)}
            >
              <Heart
                className={`h-4 w-4 ${favorites.includes(selectedProperty.id.toString()) ? "fill-red-500 text-red-500" : ""}`}
              />
            </button>
          </div>
          
          {/* Property details */}
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{selectedProperty.title}</h3>
            <div className="text-gray-600 mb-2">{selectedProperty.location || "Location not specified"}</div>
            <div className="flex justify-between items-center">
              <div className="text-xl font-bold text-purple-700">£{selectedProperty.price}/week</div>
              <div className="text-gray-600">{selectedProperty.rooms || '?'} bed{selectedProperty.rooms !== 1 ? 's' : ''}</div>
            </div>
            
            {/* Key features */}
            <div className="mt-4 space-y-2">
              {selectedProperty.keyFeatures ? (
                <ul className="text-sm text-gray-600 space-y-1">
                  {Array.isArray(selectedProperty.keyFeatures) 
                    ? selectedProperty.keyFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <span className="mr-2">•</span>
                          <span>{feature}</span>
                        </li>
                      ))
                    : typeof selectedProperty.keyFeatures === 'object' 
                      ? Object.entries(selectedProperty.keyFeatures as Record<string, unknown>)
                          .filter(([key, value]) => 
                            value && key !== 'isCampusProperty' && key !== 'id'
                          )
                          .map(([key, value], idx) => (
                            <li key={idx} className="flex items-start">
                              <span className="mr-2">•</span>
                              <span>{key.replace(/([A-Z])/g, ' $1').trim()}: {String(value)}</span>
                            </li>
                          ))
                      : null
                  }
                </ul>
              ) : null}
            </div>
            
            {/* View property button */}
            <a
              href={`/p/${selectedProperty.slug}`}
              className="mt-4 block w-full text-center bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              View Property
            </a>
          </div>
        </div>
      )}
      
      {/* Debug info for properties with missing coordinates (visible only in development) */}
      {process.env.NODE_ENV === 'development' && validProperties.length !== properties.length && (
        <div className="absolute bottom-0 left-0 bg-red-100 p-2 text-xs text-red-700 z-10">
          ⚠️ {properties.length - validProperties.length} properties have missing coordinates
        </div>
      )}
      
      {/* Map loaded indicator - mainly for debugging */}
      {process.env.NODE_ENV === 'development' && mapLoaded && (
        <div className="absolute bottom-0 right-0 bg-green-100 p-2 text-xs text-green-700 z-10">
          ✓ Map loaded with {markersRef.current.length} markers
        </div>
      )}
    </div>
  );
};

// Use dynamic import with SSR disabled to prevent server-side Mapbox issues
export default PropertyMap;
