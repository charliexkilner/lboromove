import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Property } from "@prisma/client";
import { Heart, X, Map as MapIcon, Home, Navigation } from "react-feather";
import { Feature, Polygon } from 'geojson';
import MapboxLoader from "./MapboxLoader";

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

// Create heatmap effect with multiple layers of decreasing size and opacity
function createHeatmapEffect(map: any, sourceId: string, color: string, intensity = 1) {
  try {
    // Base layer - full opacity
    map.addLayer({
      id: `${sourceId}-heat-1`,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": color,
        "fill-opacity": 0.4 * intensity,
      },
    });

    // Create a buffer around the original shape for the blur effect
    map.addLayer({
      id: `${sourceId}-heat-2`,
      type: "fill",
      source: sourceId,
      paint: {
        "fill-color": color,
        "fill-opacity": 0.25 * intensity,
        "fill-translate": [3, 3],
        "fill-translate-anchor": "map",
      },
    });

    console.log(`Added heatmap effects for ${sourceId}`);
  } catch (error) {
    console.error(`Error creating heatmap for ${sourceId}:`, error);
  }
}

// Extend Property type to include properties we need
interface ExtendedProperty extends Property {
  propertyType?: string;
  furnished?: boolean;
  available?: boolean;
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
  const [selectedProperty, setSelectedProperty] = useState<ExtendedProperty | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [favorites, setFavorites] = useState<string[]>([]);
  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false;
  const [mapError, setMapError] = useState<string | null>(null);
  const [markersAdded, setMarkersAdded] = useState(false);
  const [mapboxReady, setMapboxReady] = useState(false);

  // Handler for when Mapbox is loaded
  const handleMapboxLoad = () => {
    console.log("Mapbox loaded successfully");
    setMapboxReady(true);
    // Set mapboxgl after it's loaded
    if (typeof window !== 'undefined') {
      mapboxgl = window.mapboxgl;
      // Set the token after mapboxgl is available
      if (mapboxgl) {
        mapboxgl.accessToken = "pk.eyJ1IjoiY2hhcmxpZWtpbG5lciIsImEiOiJjbDEzdG9temIwank0M2twZDMzOGRmeW83In0.Jm5wwTD8SyYzvsmxaFYDQw";
      }
    }
  };

  // Initialize map only after mapboxgl is available
  useEffect(() => {
    if (!mapboxReady || !mapboxgl || map.current || !mapContainer.current) return;

    console.log("Map initialization starting...");
    
    // Clean up any previous instances
    const cleanup = () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };

    try {
      // Super simple initialization
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [centerLng || -1.208, centerLat || 52.7697], // Use provided coordinates or default to Loughborough
        zoom: 12,
        attributionControl: true
      });

      // Handle load event
      map.current.on('load', () => {
        console.log("Map loaded successfully!");
        setMapLoaded(true);
        
        if (!map.current) return;
        
        // Add the golden triangle area
        try {
          map.current.addSource("golden-triangle", {
            type: "geojson",
            data: goldenTriangleGeoJSON,
          });
          
          // Create heatmap effect for Golden Triangle
          createHeatmapEffect(map.current, "golden-triangle", "#FFD700", 1.2);
          
          // Add University Campus area
          map.current.addSource("university-campus", {
            type: "geojson",
            data: universityCampusGeoJSON,
          });
          
          // Create heatmap effect for University Campus
          createHeatmapEffect(map.current, "university-campus", "#9370DB", 1.2);
        } catch (e) {
          console.error("Error adding map layers:", e);
        }
      });

      // Add basic controls
      if (mapboxgl.NavigationControl) {
        map.current.addControl(new mapboxgl.NavigationControl(), "top-right");
      }
      
      // Handle errors
      map.current.on("error", (e: any) => {
        console.error("Mapbox error:", e);
        setMapError("Error loading map components");
      });
      
      // Handle zoom changes
      map.current.on("zoom", () => {
        if (map.current) {
          setZoomLevel(map.current.getZoom());
        }
      });
    } catch (error) {
      console.error("Error creating map:", error);
      setMapError(`Failed to initialize map: ${(error as Error).message}`);
      cleanup();
    }

    // Clean up on unmount
    return cleanup;
  }, [mapboxReady]);

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

  // Add markers in a separate effect after map is loaded
  useEffect(() => {
    if (!mapboxgl || !map.current || !mapLoaded || markersAdded || !properties || properties.length === 0) return;
    
    console.log("Adding markers for", properties.length, "properties");
    
    // Add markers for each property with coordinates
    try {
      // Remove existing markers first
      const existingMarkers = document.querySelectorAll(".property-marker");
      existingMarkers.forEach((marker) => marker.remove());
      
      // Count properties with coordinates
      let validProperties = 0;
      
      // Add new markers
      properties.forEach((property) => {
        if (!property || !property.latitude || !property.longitude || !map.current) return;
        
        validProperties++;
        
        // Create marker element
        const markerElement = document.createElement("div");
        markerElement.className = "property-marker";
        markerElement.innerHTML = createMarkerHTML(property, zoomLevel);
        
        // Create and add marker
        const marker = new mapboxgl.Marker(markerElement)
          .setLngLat([property.longitude, property.latitude])
          .addTo(map.current);
        
        // Add click event to marker
        markerElement.addEventListener("click", () => {
          setSelectedProperty(property as ExtendedProperty);
        });
      });
      
      console.log(`Added ${validProperties} markers to map`);
      setMarkersAdded(true);
    } catch (e) {
      console.error("Error adding markers:", e);
    }
  }, [mapLoaded, properties, zoomLevel, mapboxgl]);

  // Create marker HTML based on zoom level
  const createMarkerHTML = (property: Property, zoom: number) => {
    if (zoom < 13) {
      // Zoomed out - show house emoji with background
      return `
        <div class="w-10 h-10 rounded-full bg-purple-600 flex items-center justify-center text-white shadow-lg">
          <span class="text-lg">🏠</span>
        </div>
      `;
    } else {
      // Zoomed in - show price and bedrooms
      return `
        <div class="bg-white rounded-lg shadow-lg p-2 border-2 border-purple-600">
          <div class="font-bold text-purple-600">£${property.price}/w</div>
          <div class="text-sm">${property.rooms} bed</div>
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
    
    // Force re-render by updating state
    setTimeout(() => {
      setMapLoaded(false);
    }, 10);
  };

  return (
    <div className="w-full h-full relative">
      {/* MapboxLoader component to load Mapbox on client side */}
      <MapboxLoader onLoad={handleMapboxLoad} />

      {/* Loading indicator */}
      {(!mapboxReady || !mapLoaded) && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-700">Loading map...</p>
        </div>
      )}
      
      {/* Error Message */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-white z-10">
          <div className="text-center p-4 max-w-md">
            <p className="text-red-500 font-medium mb-2">{mapError}</p>
            <p className="text-gray-600 mb-4">There was a problem loading the map. This could be due to network issues or an authentication problem.</p>
            <button 
              onClick={handleRetryMap} 
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mr-2"
            >
              Retry Map
            </button>
            <button 
              onClick={onViewChange} 
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Switch to List View
            </button>
          </div>
        </div>
      )}
      
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full" 
        style={{ minHeight: "500px" }}
      />

      {/* Property Card */}
      {selectedProperty && (
        <div
          className={`absolute z-50 w-full max-w-md bg-white shadow-xl rounded-lg overflow-hidden ${
            isMobile ? "bottom-4 left-1/2 -translate-x-1/2" : "top-4 right-4"
          }`}
        >
          <div className="relative">
            <img
              src={selectedProperty.images && selectedProperty.images.length > 0 
                ? (Array.isArray(selectedProperty.images) 
                  ? selectedProperty.images[0] 
                  : selectedProperty.images[0])
                : "/placeholder.svg"}
              alt={selectedProperty.title}
              className="w-full h-48 object-cover"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
              }}
            />
            <button
              className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-2"
              onClick={closePropertyCard}
            >
              <X className="h-4 w-4" />
            </button>
            <button
              className="absolute top-2 right-12 bg-white/80 hover:bg-white rounded-full p-2"
              onClick={() => toggleFavorite(selectedProperty.id)}
            >
              <Heart
                className={`h-4 w-4 ${favorites.includes(selectedProperty.id.toString()) ? "fill-red-500 text-red-500" : ""}`}
              />
            </button>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="text-xl font-bold">{selectedProperty.title}</h3>
              <div className="text-xl font-bold text-purple-600">£{selectedProperty.price}/week</div>
            </div>
            <div className="flex items-center gap-1 text-gray-500 mt-1 mb-3">
              <Navigation className="h-3.5 w-3.5" />
              <span>{selectedProperty.location}</span>
            </div>

            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-1">
                <span className="text-gray-500">🛏️</span>
                <span>
                  {selectedProperty.rooms} {selectedProperty.rooms === 1 ? "bed" : "beds"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-gray-500">🚿</span>
                <span>
                  {selectedProperty.bathrooms} {selectedProperty.bathrooms === 1 ? "bath" : "baths"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Home className="h-4 w-4 text-gray-500" />
                <span className="capitalize">{selectedProperty.propertyType || "House"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {selectedProperty.furnished ? "Furnished" : "Unfurnished"}
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                {selectedProperty.available ? "Available" : "Let Agreed"}
              </span>
            </div>

            <p className="text-sm text-gray-600 mb-4">{selectedProperty.description}</p>

            <button className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition">
              Book Viewing
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Use dynamic import with SSR disabled to prevent server-side Mapbox issues
export default PropertyMap;
