import { useEffect, useRef } from 'react';
import { geocode } from '../utils/geocoding';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import OSM from 'ol/source/OSM';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import { fromLonLat } from 'ol/proj';
import { Circle as CircleGeom } from 'ol/geom';
import { Style, Fill, Stroke, Text } from 'ol/style';
import 'ol/ol.css';

// Add this declaration
declare global {
  interface Window {
    ol: any;
  }
}

interface PropertyMapProps {
  streetName: string;
  city?: string;
  initialCoords?: { lat: number; lng: number };
}

export default function PropertyMap({
  streetName,
  city = 'Loughborough',
  initialCoords,
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapRef.current || !initialCoords) return;

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() })],
      view: new View({
        center: fromLonLat([initialCoords.lng, initialCoords.lat]),
        zoom: 16,
      }),
    });

    const circleFeature = new Feature({
      geometry: new CircleGeom(
        fromLonLat([initialCoords.lng, initialCoords.lat]),
        100
      ),
    });

    const markerFeature = new Feature({
      geometry: new Point(fromLonLat([initialCoords.lng, initialCoords.lat])),
    });

    const vectorLayer = new VectorLayer({
      source: new VectorSource({
        features: [circleFeature, markerFeature],
      }),
      style: (feature) => {
        if (feature.getGeometry() instanceof CircleGeom) {
          return new Style({
            stroke: new Stroke({ color: '#4F46E5', width: 2 }),
            fill: new Fill({ color: 'rgba(79, 70, 229, 0.1)' }),
          });
        } else {
          return new Style({
            text: new Text({
              text: '🏠',
              scale: 1.5,
            }),
          });
        }
      },
    });

    map.addLayer(vectorLayer);

    return () => {
      map.dispose();
    };
  }, [initialCoords]);

  if (!initialCoords) {
    return (
      <div className="w-full h-[400px] rounded-lg bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return <div ref={mapRef} className="w-full h-[400px] rounded-lg" />;
}
