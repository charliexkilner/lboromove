import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { Property } from "@prisma/client";
import { Heart, X, Map as MapIcon, Home, Navigation } from "react-feather";
import { Feature, Polygon } from 'geojson';
import MapboxLoader from "./MapboxLoader";
import FallbackImage from "./FallbackImage";
import { PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useMediaQuery } from '../hooks/useMediaQuery';
import PropertyModal from './PropertyModal';
import { getPropertyIdFromSlug, generatePropertySlug } from '../utils/url';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';

// Don't import mapboxgl directly - we'll load it client-side only
let mapboxgl: any = null;

// GeoJSON for the Golden Triangle area
const goldenTriangleGeoJSON = {
  type: "FeatureCollection",
  features: [{
  type: "Feature",
  properties: {
    name: "Golden Triangle",
      weight: 1
  },
  geometry: {
    type: "Polygon",
      coordinates: [[
        [-1.2163653191484798, 52.776744500333564],
        [-1.2134295881466528, 52.77562855556516],
        [-1.2115451662185137, 52.77459658117826],
        [-1.2103946770429275, 52.77400858483023],
        [-1.2091450077652155, 52.77332457908565],
        [-1.2078556664462212, 52.77246055646617],
        [-1.2101169727589252, 52.772124543038586],
        [-1.2113864780572499, 52.77240055425864],
        [-1.2129336876394916, 52.772448556031435],
        [-1.215373518134129, 52.77232855150061],
        [-1.219539082392913, 52.77225654862312],
        [-1.2232484181871541, 52.774908576014894],
        [-1.2234269423691444, 52.77507657230845],
        [-1.2163653191484798, 52.776744500333564]  // Closing the polygon by repeating first point
      ]]
    }
  }]
};

// More accurate GeoJSON for the University Campus area
const universityCampusGeoJSON = {
  type: "FeatureCollection",
  features: [{
  type: "Feature",
  properties: {
    name: "Loughborough University",
      weight: 1
  },
  geometry: {
    type: "Polygon",
      coordinates: [[
        [-1.2563505560492558, 52.76141260508615],
        [-1.244802518116046, 52.76238255510438],
        [-1.23541831979054, 52.76715487430937],
        [-1.2325633652721706, 52.769074501176476],
        [-1.2261004528281205, 52.770282981617015],
        [-1.2246689639841009, 52.76923771439391],
        [-1.2185974768173935, 52.7643992934899],
        [-1.2191651361866036, 52.7640707392444],
        [-1.2210902418736964, 52.765071328544565],
        [-1.2217813054535043, 52.76417527950056],
        [-1.2221515180860365, 52.764055804901346],
        [-1.2257549210382024, 52.76538494135389],
        [-1.2266301494075833, 52.76407976584406],
        [-1.2238165334039763, 52.762616176209576],
        [-1.225371426458537, 52.76201877854871],
        [-1.2282837658309234, 52.7639304222167],
        [-1.2304309990973081, 52.763243434933315],
        [-1.2313441902564932, 52.76403496280972],
        [-1.2321339772050806, 52.76369147134736],
        [-1.2326275940480969, 52.76399015972879],
        [-1.2384275919511083, 52.7613168258261],
        [-1.238725142422794, 52.756055092880274],
        [-1.2406255672672444, 52.7553381067041],
        [-1.2446238636937608, 52.75512898351309],
        [-1.248638601112674, 52.75245404772207],
        [-1.25221732322305, 52.75388810321223],
        [-1.2503415792203896, 52.75545654735154],
        [-1.252859025118454, 52.75677100941897],
        [-1.2512794512213077, 52.75786138535139],
        [-1.252859025118454, 52.75957904549253],
        [-1.2555804192129472, 52.75929700930479],
        [-1.2563948870033244, 52.761387995937326],
        [-1.2563505560492558, 52.76141260508615]  // Closing the polygon by repeating first point
      ]]
    }
  }]
};

// GeoJSON for the Silver Square area
const silverSquareGeoJSON = {
  type: "FeatureCollection",
  features: [{
    type: "Feature",
    properties: {
      name: "Silver Square",
      weight: 1
    },
    geometry: {
      type: "Polygon",
      coordinates: [[
        [-1.2105608208167382, 52.77220842707948],
        [-1.2109227156106215, 52.770887698021056],
        [-1.2116815272757435, 52.7698565127217],
        [-1.213514349296588, 52.76827437272408],
        [-1.2179621530550548, 52.77043567459535],
        [-1.2158841764964166, 52.771954172193176],
        [-1.2157791102654585, 52.7722437401404],
        [-1.2134793272198579, 52.77242030501671],
        [-1.2117749194800922, 52.772406179853164],
        [-1.2105608208167382, 52.77220842707948]  // Closing the polygon by repeating first point
      ]]
    }
  }]
};

// Default location for Loughborough center
const DEFAULT_CENTER = {
  lng: -1.208,
  lat: 52.7697
};

// Extend Property type to include properties we need
interface ExtendedProperty extends Omit<Property, 'keyFeatures'> {
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
  onPropertySelect?: (property: ExtendedProperty) => void; // Add callback for mobile modal
}

const debugMode = process.env.NODE_ENV === 'development';

const PropertyMap: React.FC<PropertyMapProps> = ({ 
  onViewChange, 
  properties = [], 
  singlePropertyMode = false,
  centerLat,
  centerLng,
  onPropertySelect
}) => {
  const router = useRouter();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<ExtendedProperty | null>(null);
  const [selectedPropertySlug, setSelectedPropertySlug] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(12);
  const [favorites, setFavorites] = useState<string[]>([]);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [mapError, setMapError] = useState<string | null>(null);
  const [markersAdded, setMarkersAdded] = useState(false);
  const [mapboxReady, setMapboxReady] = useState(false);
  // Variable to track hover state - moved to component scope to fix linter errors
  const hoveredPropertyIdRef = useRef<number | null>(null);

  // Helper function to extract street name from property title or location
  const getStreetFromTitle = (text: string): string => {
    if (!text) return '';
    
    // Common street names in Loughborough Golden Triangle area with variations
    const goldenTriangleStreets = [
      { name: 'Leopold Street', patterns: ['leopold', ' leo '], goldenTriangle: true },
      { name: 'Paget Street', patterns: ['paget'], goldenTriangle: true },
      { name: 'Forest Road', patterns: ['forest road', 'forest rd'], goldenTriangle: true },
      { name: 'Park Road', patterns: ['park road', 'park rd'], goldenTriangle: true },
      { name: 'Station Street', patterns: ['station st', 'station street'], goldenTriangle: true },
      { name: 'Broad Street', patterns: ['broad st', 'broad street'], goldenTriangle: true },
      { name: 'Frederick Street', patterns: ['frederick', 'frederick st'], goldenTriangle: true },
      { name: 'York Road', patterns: ['york rd', 'york road'], goldenTriangle: true },
      { name: 'Fearon Street', patterns: ['fearon', 'fearon st'], goldenTriangle: true },
      { name: 'Regent Street', patterns: ['regent', 'regent st'], goldenTriangle: true },
      { name: 'William Street', patterns: ['william', 'william st'], goldenTriangle: true },
      { name: 'Russell Street', patterns: ['russell', 'russell st'], goldenTriangle: true },
      { name: 'Hastings Street', patterns: ['hastings', 'hastings st'], goldenTriangle: true },
      { name: 'Oxford Street', patterns: ['oxford', 'oxford st'], goldenTriangle: true },
      { name: 'Cambridge Street', patterns: ['cambridge ', 'cambridge st'], goldenTriangle: true },
      { name: 'Freehold Street', patterns: ['freehold', 'freehold st'], goldenTriangle: true },
      { name: 'Cumberland Road', patterns: ['cumberland', 'cumberland rd'], goldenTriangle: true }
    ];
    
    // Extract specific house numbers for known student houses
    const knownAddresses = [
      { pattern: /35 leopold/i, street: 'Leopold Street', goldenTriangle: true },
      { pattern: /61 forest/i, street: 'Forest Road', goldenTriangle: true },
      { pattern: /8a william/i, street: 'William Street', goldenTriangle: true },
      { pattern: /10 frederick/i, street: 'Frederick Street', goldenTriangle: true },
      { pattern: /15 paget/i, street: 'Paget Street', goldenTriangle: true },
      { pattern: /108 ashby/i, street: 'Ashby Road' },
      { pattern: /23 york/i, street: 'York Road', goldenTriangle: true },
      { pattern: /10 fearon/i, street: 'Fearon Street', goldenTriangle: true }
    ];
    
    // Check for specific addresses first
    for (const { pattern, street } of knownAddresses) {
      if (pattern.test(text)) {
        return street;
      }
    }
    
    // Other common Loughborough streets
    const otherStreets = [
      { name: 'Ashby Road', patterns: ['ashby road', 'ashby rd'] },
      { name: 'Radmoor Road', patterns: ['radmoor', 'radmoor rd'] },
      { name: 'Burleigh Road', patterns: ['burleigh', 'burleigh rd'] },
      { name: 'Westfield Drive', patterns: ['westfield', 'westfield dr'] },
      { name: 'Alan Moss Road', patterns: ['alan moss', 'moss rd'] },
      { name: 'Moor Lane', patterns: ['moor lane', 'moor ln'] },
      { name: 'Leicester Road', patterns: ['leicester', 'leicester rd'] },
      { name: 'Derby Road', patterns: ['derby road', 'derby rd'] },
      { name: 'Toothill Road', patterns: ['toothill', 'toothill rd'] },
      { name: 'Garendon Road', patterns: ['garendon', 'garendon rd'] },
      { name: 'Queens Road', patterns: ['queens rd', 'queens road'] },
      { name: 'Ashleigh Drive', patterns: ['ashleigh', 'ashleigh dr'] },
      { name: 'Bennett Street', patterns: ['bennett', 'bennett st'] },
      { name: 'Herrick Road', patterns: ['herrick', 'herrick rd'] },
      { name: 'Tuckers Road', patterns: ['tuckers', 'tuckers rd'] }
    ];
    
    // More specific known patterns to check
    if (text.includes('Leopold')) {
      return 'Leopold Street';
    }
    
    if (text.includes('golden triangle') || text.includes('gold triangle')) {
      // For properties explicitly stated to be in the Golden Triangle
      // but without a specific street, we'll return a general indicator
      return 'Golden Triangle Area';
    }

    // Combine all street patterns
    const allStreets = [...goldenTriangleStreets, ...otherStreets];
    
    // First check for explicit house numbers with street names
    // E.g., "35 Leopold Street" 
    const normalizedText = ` ${text.toLowerCase()} `;
    
    // Try to extract a house number (digits) followed by street name
    const houseRegex = /\b(\d+)\s+([a-z\s]+(?:street|st|road|rd|avenue|ave|drive|dr|lane|ln|close|cl|way)\b)/i;
    const match = normalizedText.match(houseRegex);
    
    if (match && match[2]) {
      // Try to clean up and standardize the street name
      const extractedStreetLower = match[2].trim().toLowerCase();
      
      // Find the matching full street name
      for (const { name, patterns } of allStreets) {
        for (const pattern of patterns) {
          if (extractedStreetLower.includes(pattern)) {
            return name;
          }
        }
      }
      
      // If no match but we have a street suffix, capitalize the street name nicely
      const streetName = match[2].trim();
      return streetName.charAt(0).toUpperCase() + streetName.slice(1);
    }
    
    // If no house number pattern, try pattern matching
    for (const { name, patterns } of allStreets) {
      for (const pattern of patterns) {
        if (normalizedText.includes(pattern)) {
          return name;
        }
      }
    }
    
    // As a last resort, look for common street suffixes
    const streetSuffixes = [' street', ' st', ' road', ' rd', ' avenue', ' ave', ' drive', ' dr', ' lane', ' ln', ' close', ' cl', ' way'];
    for (const suffix of streetSuffixes) {
      const index = normalizedText.indexOf(suffix);
      if (index !== -1) {
        // Look backward to find the start of the street name (typically a capital letter preceded by space)
        let start = index;
        while (start > 0 && normalizedText[start - 1] !== ' ' && normalizedText[start - 1] !== ',') {
          start--;
        }
        
        if (start < index) {
          // Extract the street name and capitalize first letter
          const streetName = text.substring(start, index + suffix.length);
          return streetName.charAt(0).toUpperCase() + streetName.slice(1);
        }
      }
    }
    
    // No street found
    return '';
  };

  // Memoize validProperties to prevent unnecessary updates
  const validProperties = React.useMemo(() => {
    return properties.filter(
      p => p && typeof p.latitude === 'number' && typeof p.longitude === 'number' && 
           p.latitude !== 0 && p.longitude !== 0 // Filter out invalid coordinates (0,0)
    );
  }, [properties]);
  
  // Cache the GeoJSON data for properties
  const propertiesGeoJSON = React.useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: validProperties.map(property => {
        // Generate a proper slug for the property
        // Make sure it follows the format that getPropertyIdFromSlug expects:
        // "title-id-lboro-student-house"
        const propertySlug = `${property.title || 'property'}-${property.id}-lboro-student-house`
          .toLowerCase()
          .replace(/[^a-z0-9\s-]/g, '')
          .replace(/\s+/g, '-');
        
        return {
          type: 'Feature',
          properties: {
            id: property.id,
            title: property.title || '',
            price: property.price || 0,
            rooms: property.rooms || 0,
            isGoldenTriangle: !!property.isGoldenTriangle,
            isNearCampus: !!property.isNearCampus,
            address: property.location || '',
            street: getStreetFromTitle(property.title || property.location || ''),
            slug: propertySlug
          },
          geometry: {
            type: 'Point',
            coordinates: [property.longitude, property.latitude]
          }
        };
      })
    };
  }, [validProperties]);

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
      
      // Define the initial zoom level
      const initialZoom = 13;
      
      // Super simple initialization
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [centerPosition.lng, centerPosition.lat],
        zoom: initialZoom,
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
        
        // Single transparent yellow fill for the Golden Triangle area
        map.current.addLayer({
          id: 'golden-triangle-fill',
          type: 'fill',
          source: 'golden-triangle',
          paint: {
            'fill-color': 'rgb(255, 215, 0)',
            'fill-opacity': 0.35
          }
        });
        
        // Add the dashed border outline
        map.current.addLayer({
          id: 'golden-triangle-outline',
          type: 'line',
          source: 'golden-triangle',
          layout: {},
          paint: {
            'line-color': 'rgb(255, 165, 0)',
            'line-width': 2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.9
          }
        });
        
        // Add Silver Square area
        map.current.addSource('silver-square', {
          type: 'geojson',
          data: silverSquareGeoJSON
        });
        
        // Single transparent silver fill for the Silver Square area
        map.current.addLayer({
          id: 'silver-square-fill',
          type: 'fill',
          source: 'silver-square',
          paint: {
            'fill-color': 'rgb(192, 192, 192)',
            'fill-opacity': 0.35
          }
        });
        
        // Add the dashed border outline
        map.current.addLayer({
          id: 'silver-square-outline',
          type: 'line',
          source: 'silver-square',
          layout: {},
          paint: {
            'line-color': 'rgb(128, 128, 128)',
            'line-width': 2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.9
          }
        });
        
        // Add University Campus area
        map.current.addSource('university-campus', {
          type: 'geojson',
          data: universityCampusGeoJSON
        });
        
        // Single transparent purple fill for the campus area
        map.current.addLayer({
          id: 'university-campus-fill',
          type: 'fill',
          source: 'university-campus',
          paint: {
            'fill-color': 'rgb(138, 43, 226)',
            'fill-opacity': 0.35,
          }
        });
        
        // Add the dashed border outline
        map.current.addLayer({
          id: 'university-campus-outline',
          type: 'line',
          source: 'university-campus',
          layout: {},
          paint: {
            'line-color': 'rgba(138, 43, 226, 0.8)',
            'line-width': 2,
            'line-dasharray': [2, 2],
            'line-opacity': 0.6
          }
        });

        // Add area labels
        map.current.addLayer({
          id: 'area-labels',
          type: 'symbol',
          layout: {
            'text-field': [
              'match',
              ['get', 'name'],
              'Loughborough University', '🎓 CAMPUS',
              'Golden Triangle', '🏆 GOLDEN TRIANGLE',
              'Silver Square', '🪙 SILVER SQUARE',
              ''  // default case
            ],
            'text-size': 16,
            'text-font': ['Open Sans Bold'],
            'text-anchor': 'center',
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2,
            'text-opacity': 0.9
          },
          source: {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [
                {
                  type: 'Feature',
                  properties: { name: 'Loughborough University' },
                  geometry: {
                    type: 'Point',
                    coordinates: [-1.245, 52.763]  // Center point of campus
                  }
                },
                {
                  type: 'Feature',
                  properties: { name: 'Golden Triangle' },
                  geometry: {
                    type: 'Point',
                    coordinates: [-1.215, 52.774]  // Center point of Golden Triangle
                  }
                },
                {
                  type: 'Feature',
                  properties: { name: 'Silver Square' },
                  geometry: {
                    type: 'Point',
                    coordinates: [-1.214, 52.770]  // Center point of Silver Square
                  }
                }
              ]
            }
          }
        });

        // Define the zoom threshold for showing price pills vs house emojis
        const PRICE_PILL_ZOOM_THRESHOLD = 14.5;

        // Add properties source for clustering
        map.current.addSource('properties', {
          type: 'geojson',
          data: propertiesGeoJSON,
          cluster: true,
          clusterMaxZoom: 16, // Increase max zoom to cluster points longer
          clusterRadius: 40, // Cluster radius for better grouping
        });

        // CLUSTER STYLING (first add the background for clusters)
        // Add cluster layers (white background circle)
        map.current.addLayer({
          id: 'clusters-bg',
          type: 'circle',
          source: 'properties',
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': '#ffffff',
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              30, // Radius for small clusters
              10,
              35, // Radius for medium clusters
              30,
              40  // Radius for large clusters
            ],
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': 0.5
          }
        });

        // Add a shadow underneath the clusters (below the circle)
        map.current.addLayer({
          id: 'clusters-shadow',
          type: 'circle',
          source: 'properties',
          filter: ['has', 'point_count'],
          paint: {
            'circle-radius': [
              'step',
              ['get', 'point_count'],
              32, // Slightly larger for shadow effect
              10,
              37,
              30,
              42
            ],
            'circle-color': 'rgba(0,0,0,0.2)',
            'circle-blur': 0.5,
            'circle-opacity': 0.6,
            'circle-translate': [2, 2] // Small offset for shadow effect
          }
        });

        // Add cluster count layer with house emoji
        map.current.addLayer({
          id: 'cluster-count',
          type: 'symbol',
          source: 'properties',
          filter: ['has', 'point_count'],
          layout: {
            'text-field': [
              'concat',
              ['get', 'point_count_abbreviated'],
              ' 🏠'
            ],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 16,
            'text-allow-overlap': true
          },
          paint: {
            'text-color': '#333333'
          }
        });

        // PRICE PILL MARKERS (ZOOMED IN)
        // First add the shadow (bottom layer)
        map.current.addLayer({
          id: 'price-pill-shadow',
          type: 'circle',
          source: 'properties',
          filter: [
            'all',
            ['!', ['has', 'point_count']], // Not a cluster
            ['>=', ['zoom'], PRICE_PILL_ZOOM_THRESHOLD] // Only when zoomed in
          ],
          paint: {
            'circle-radius': 34, // Slightly larger for shadow
            'circle-color': 'rgba(0,0,0,0.15)',
            'circle-blur': 1,
            'circle-opacity': 0.6,
            'circle-translate': [0, 2] // Offset for shadow effect
          }
        });

        // Add price pill background for zoomed in view (on top of shadow)
        map.current.addLayer({
          id: 'price-pill-bg',
          type: 'circle',
          source: 'properties',
          filter: [
            'all',
            ['!', ['has', 'point_count']], // Not a cluster
            ['>=', ['zoom'], PRICE_PILL_ZOOM_THRESHOLD] // Only when zoomed in
          ],
          paint: {
            'circle-color': '#ffffff',
            'circle-radius': 32, // Larger radius to fit price text
            'circle-stroke-width': 1.5,
            'circle-stroke-color': '#dddddd',
            'circle-opacity': 1
          }
        });

        // HOUSE EMOJI MARKERS (ZOOMED OUT)
        // First add the background (bottom layer)
        map.current.addLayer({
          id: 'unclustered-point-bg',
          type: 'circle',
          source: 'properties',
          filter: [
            'all',
            ['!', ['has', 'point_count']], // Not a cluster
            ['<', ['zoom'], PRICE_PILL_ZOOM_THRESHOLD] // Only when zoomed out
          ],
          paint: {
            'circle-color': '#ffffff',
            'circle-radius': 15,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-stroke-opacity': [
              'case',
              ['boolean', ['feature-state', 'hover'], false],
              1.0,
              0.5
            ]
          }
        });

        // Add house emoji on top of background
        map.current.addLayer({
          id: 'unclustered-point-icon',
          type: 'symbol',
          source: 'properties',
          filter: [
            'all',
            ['!', ['has', 'point_count']], // Not a cluster
            ['<', ['zoom'], PRICE_PILL_ZOOM_THRESHOLD] // Only when zoomed out
          ],
          layout: {
            'text-field': '🏠',
            'text-size': 18,
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'text-offset': [0, 0.05] // Slight adjustment to better center the emoji
          }
        });

        // Add price label for when zoomed in - styled as a price pill
        map.current.addLayer({
          id: 'property-price',
          type: 'symbol',
          source: 'properties',
          filter: [
            'all',
            ['!', ['has', 'point_count']], // Not a cluster
            ['>=', ['zoom'], PRICE_PILL_ZOOM_THRESHOLD] // Only when zoomed in
          ],
          layout: {
            'text-field': ['concat', '£', ['number-format', ['get', 'price'], {}]],
            'text-font': ['DIN Offc Pro Bold', 'Arial Unicode MS Bold'],
            'text-size': 14,
            'text-justify': 'center',
            'text-anchor': 'center',
            'text-allow-overlap': true,
            'visibility': 'visible'
          },
          paint: {
            'text-color': '#333333',
            'text-halo-width': 0
          }
        });

        // Add a hover tooltip layer for property title (simplified)
        map.current.addLayer({
          id: 'property-tooltip',
          type: 'symbol',
          source: 'properties',
          filter: ['==', ['get', 'id'], -1], // Start with no properties visible
          layout: {
            'text-field': ['get', 'title'],
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
            'text-offset': [0, -2],
            'text-anchor': 'bottom',
            'text-allow-overlap': true,
            'text-ignore-placement': true,
            'visibility': 'visible' // Always visible, but filtered
          },
          paint: {
            'text-color': '#000000',
            'text-halo-color': '#ffffff',
            'text-halo-width': 2
          }
        });

        // Variables to track hover state
        let hoveredPropertyId: number | null = null;

        // When a cluster is clicked, zoom in to it
        map.current.on('click', 'clusters-bg', (e: { point: { x: number; y: number } }) => {
          const features = map.current.queryRenderedFeatures(e.point, { layers: ['clusters-bg'] });
          if (features.length > 0) {
            const clusterId = features[0].properties.cluster_id;
            map.current.getSource('properties').getClusterExpansionZoom(
              clusterId,
              (err: Error | null, zoom: number) => {
                if (err) return;

                map.current.easeTo({
                  center: features[0].geometry.coordinates,
                  zoom: zoom
                });
              }
            );
          }
        });

        // When an individual property is clicked, show details
        // Need to handle both house emoji markers and price pill markers
        map.current.on('click', 'unclustered-point-bg', handlePropertyClick);
        map.current.on('click', 'price-pill-bg', handlePropertyClick);

        // Add hover states for both marker types
        map.current.on('mousemove', 'unclustered-point-bg', handlePropertyHover);
        map.current.on('mousemove', 'price-pill-bg', handlePropertyHover);

        map.current.on('mouseleave', 'unclustered-point-bg', handlePropertyLeave);
        map.current.on('mouseleave', 'price-pill-bg', handlePropertyLeave);

        // Change cursor style on hover for all interactive elements
        map.current.on('mouseenter', 'clusters-bg', () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseenter', 'unclustered-point-bg', () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseenter', 'price-pill-bg', () => {
          map.current.getCanvas().style.cursor = 'pointer';
        });

        map.current.on('mouseleave', 'clusters-bg', () => {
          map.current.getCanvas().style.cursor = '';
        });

        map.current.on('mouseleave', 'unclustered-point-bg', () => {
          map.current.getCanvas().style.cursor = '';
        });

        map.current.on('mouseleave', 'price-pill-bg', () => {
          map.current.getCanvas().style.cursor = '';
        });

        // Listen for zoom changes
        map.current.on('zoom', () => {
          const newZoom = map.current.getZoom();
          setZoomLevel(Math.floor(newZoom));
          
          // Debug zoom level
          console.log(`Current zoom level: ${newZoom}`);
        });
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
    if (map.current) {
      // Trigger a resize on mount and when component updates
      const handleMapResize = () => {
        if (map.current) {
          map.current.resize();
        }
      };
      
      // Resize immediately
      handleMapResize();
      
      // Also resize after a short delay to handle any layout adjustments
      const resizeTimer = setTimeout(() => {
        handleMapResize();
      }, 250);
      
      // Add window resize listener
      window.addEventListener('resize', handleMapResize);
      
      return () => {
        clearTimeout(resizeTimer);
        window.removeEventListener('resize', handleMapResize);
      };
    }
  }, [mapLoaded, properties]);

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

  // Update properties source when validProperties changes
  useEffect(() => {
    if (!mapLoaded || !map.current || !map.current.getSource('properties')) return;
    
    // Update the properties source data
    console.log(`Updating properties source with ${validProperties.length} properties`);
    
    // Debug the GeoJSON
    if (debugMode) {
      console.log("GeoJSON features:", propertiesGeoJSON.features.map(f => ({
        id: f.properties.id,
        title: f.properties.title,
        slug: f.properties.slug
      })));
    }
    
    try {
      // Only update if the source exists
      if (map.current.getSource('properties')) {
        map.current.getSource('properties').setData(propertiesGeoJSON);
      }
      
      // Fit map bounds to show all properties if needed
      if (!singlePropertyMode && validProperties.length > 1 && (!centerLat || !centerLng)) {
        try {
          const bounds = new mapboxgl.LngLatBounds();
          
          // Add all property coordinates to bounds
          validProperties.forEach(property => {
            bounds.extend([property.longitude, property.latitude]);
          });
          
          // Only fit bounds if we have valid bounds
          if (!bounds.isEmpty()) {
            map.current.fitBounds(bounds, {
              padding: 50,
              maxZoom: 15
            });
          }
        } catch (e) {
          console.error("Error fitting bounds:", e);
        }
      }
    } catch (error) {
      console.error("Error updating properties source:", error);
    }
  }, [validProperties.length, mapLoaded, singlePropertyMode, centerLat, centerLng]);

  // We don't need the old individual markers code anymore since we're using layers
  // Replace this with just a cleanup function
  useEffect(() => {
    // Cleanup function for when component unmounts
    return () => {
      clearMarkers();
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

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
    setSelectedPropertySlug(null);
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

  // Define handler functions for property interactions
  const handlePropertyClick = (e: any) => {
    if (e.features.length > 0) {
      // Get the property details from the clicked feature
      const propertyId = e.features[0].properties.id;
      const featureSlug = e.features[0].properties.slug;
      
      if (debugMode) {
        console.log("Click on property:", {
          propertyId,
          featureProperties: e.features[0].properties,
          featureSlug
        });
      }
      
      // Find the property in our validProperties array
      const property = validProperties.find(p => p.id === propertyId);
      if (property) {
        const extendedProperty = property as ExtendedProperty;
        
        if (isMobile && onPropertySelect) {
          // If on mobile and onPropertySelect callback provided, use it
          onPropertySelect(extendedProperty);
        } else {
          // Always use the slug from GeoJSON because it's properly formatted
          const propertySlug = featureSlug;
          
          if (debugMode) {
            console.log("Opening property modal with slug:", propertySlug);
            console.log("Property ID that will be extracted:", getPropertyIdFromSlug(propertySlug));
          }
          
          // Update the URL using shallow routing
          router.push(`/house/${propertySlug}`, undefined, { 
            shallow: true,
            scroll: false // Prevent scroll jump
          });
          
          // Also set the local state
          setSelectedPropertySlug(propertySlug);
        }
      } else {
        console.error("Property not found in validProperties:", propertyId);
        console.log("Available properties:", validProperties.map(p => p.id));
      }
    }
  };

  const handlePropertyHover = (e: any) => {
    if (e.features.length > 0) {
      // Get the current hovered property ID
      const newHoveredId = e.features[0].properties.id;
      
      // Only process if it's a different property
      if (hoveredPropertyIdRef.current !== newHoveredId) {
        // Remove hover state from previous property
        if (hoveredPropertyIdRef.current !== null) {
          map.current.setFeatureState(
            { source: 'properties', id: hoveredPropertyIdRef.current },
            { hover: false }
          );
        }
        
        // Set hover state on new property
        hoveredPropertyIdRef.current = newHoveredId;
        map.current.setFeatureState(
          { source: 'properties', id: hoveredPropertyIdRef.current },
          { hover: true }
        );
        
        // Update tooltip to show only this property
        map.current.setFilter('property-tooltip', ['==', ['get', 'id'], hoveredPropertyIdRef.current]);
      }
    }
  };

  const handlePropertyLeave = () => {
    if (hoveredPropertyIdRef.current !== null) {
      // Remove hover state
      map.current.setFeatureState(
        { source: 'properties', id: hoveredPropertyIdRef.current },
        { hover: false }
      );
      
      // Hide tooltip (show none)
      map.current.setFilter('property-tooltip', ['==', ['get', 'id'], -1]);
      
      // Reset hover ID
      hoveredPropertyIdRef.current = null;
    }
  };

  // Add a handler to close the modal
  const handleCloseModal = () => {
    // Navigate back to the main page with shallow routing
    router.push('/', undefined, { 
      shallow: true,
      scroll: false // Prevent scroll jump
    })
      .then(() => {
        // After URL is updated, clear the selected property
        setSelectedPropertySlug(null);
      })
      .catch(error => {
        console.error('Error during modal close:', error);
        // Fallback: directly clear selection
        setSelectedPropertySlug(null);
      });
  };

  return (
    <div className="fixed inset-0 top-[112px] -mt-px overflow-hidden">
      <MapboxLoader onLoad={handleMapboxLoad} onError={handleMapboxError} />
      
      {/* Loading indicator */}
      {(!mapboxReady || !mapLoaded) && !mapError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-700">Loading map...</p>
        </div>
      )}
      
      {/* Error message */}
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
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />
      
      {/* Property Modal - Use this for consistent experience with list view */}
      {selectedPropertySlug && (
        <motion.div 
          className="fixed inset-0 z-50 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm pointer-events-auto" onClick={handleCloseModal}></div>
          <div className="relative z-10 w-full h-full pointer-events-none">
            <div className="pointer-events-auto">
              <PropertyModal
                slug={selectedPropertySlug}
                onClose={handleCloseModal}
                preventReload={true}
                property={validProperties.find(p => generatePropertySlug(p) === selectedPropertySlug || p.id.toString() === selectedPropertySlug)}
              />
            </div>
          </div>
        </motion.div>
      )}
      
      {/* Property Popup Card - Only show when not using PropertyModal */}
      {selectedProperty && !selectedPropertySlug && (
        <div className="absolute bottom-4 right-4 w-80 bg-white rounded-xl overflow-hidden shadow-2xl z-20 max-h-[80vh] flex flex-col">
          {/* Close button */}
          <button
            onClick={closePropertyCard}
            className="absolute top-2 right-2 z-30 bg-white rounded-full p-1 shadow-md text-gray-600 hover:text-gray-900"
          >
            <X size={20} />
          </button>
          
          {/* Property image */}
          <div className="relative h-48 bg-gray-200">
            {getBestPropertyImage(selectedProperty) ? (
              <div className="relative w-full h-full">
                <Image
                  src={getBestPropertyImage(selectedProperty) as string}
                  alt={selectedProperty.title || 'Property image'}
                  className="object-cover"
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 320px"
                  priority={false}
                  unoptimized={true} // Use unoptimized to handle external images reliably
                  onError={() => {
                    // Handle image errors in-component
                    const imgElement = document.getElementById(`property-image-${selectedProperty.id}`);
                    if (imgElement) {
                      imgElement.style.display = 'none';
                      const errorFallback = document.getElementById(`property-image-fallback-${selectedProperty.id}`);
                      if (errorFallback) {
                        errorFallback.style.display = 'flex';
                      }
                    }
                  }}
                  id={`property-image-${selectedProperty.id}`}
                />
                <div 
                  id={`property-image-fallback-${selectedProperty.id}`}
                  className="absolute inset-0 flex items-center justify-center bg-gray-100"
                >
                  <p className="text-gray-500">Image not available</p>
                </div>
              </div>
            ) : (
              <div className="relative w-full h-full">
                <Image
                  src="/placeholder.jpg"
                  alt="Placeholder image"
                  className="object-cover"
                  fill={true}
                  sizes="(max-width: 768px) 100vw, 320px"
                  priority={false}
                  unoptimized={true}
                  onError={() => {
                    // Handle image errors in-component
                    const imgElement = document.getElementById(`property-image-${selectedProperty.id}`);
                    if (imgElement) {
                      imgElement.style.display = 'none';
                      const errorFallback = document.getElementById(`property-image-fallback-${selectedProperty.id}`);
                      if (errorFallback) {
                        errorFallback.style.display = 'flex';
                      }
                    }
                  }}
                  id={`property-image-${selectedProperty.id}`}
                />
                <div 
                  id={`property-image-fallback-${selectedProperty.id}`}
                  className="absolute inset-0 flex items-center justify-center bg-gray-100"
                >
                  <p className="text-gray-500">Image not available</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Property details */}
          <div className="p-4">
            <h2 className="text-xl font-bold mb-2">{selectedProperty.title}</h2>
            <p className="text-gray-600 mb-4">{selectedProperty.location}</p>
            <p className="text-gray-600 mb-4">Price: £{selectedProperty.price}</p>
            <p className="text-gray-600 mb-4">Rooms: {selectedProperty.rooms}</p>
            <p className="text-gray-600 mb-4">Type: {selectedProperty.propertyType}</p>
            <p className="text-gray-600 mb-4">Furnished: {selectedProperty.furnished ? 'Yes' : 'No'}</p>
            <p className="text-gray-600 mb-4">Available: {selectedProperty.available ? 'Yes' : 'No'}</p>
            <p className="text-gray-600 mb-4">Street: {selectedProperty.street}</p>
            <p className="text-gray-600 mb-4">Key Features: {selectedProperty.keyFeatures?.join(', ')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PropertyMap;