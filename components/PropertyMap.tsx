import { useEffect, useRef } from 'react';

interface PropertyMapProps {
  streetName: string;
  city?: string;
}

export default function PropertyMap({
  streetName,
  city = 'Loughborough',
}: PropertyMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const address = `${streetName}, ${city}, UK`;

  useEffect(() => {
    if (!mapRef.current) return;

    const geocoder = new google.maps.Geocoder();

    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const map = new google.maps.Map(mapRef.current as HTMLElement, {
          center: results[0].geometry.location,
          zoom: 16,
          styles: [
            {
              featureType: 'all',
              elementType: 'all',
              stylers: [{ saturation: -100 }],
            },
          ],
          disableDefaultUI: true, // Removes default UI controls for minimal look
        });

        // Add circle overlay
        new google.maps.Circle({
          strokeColor: '#4F46E5',
          strokeOpacity: 0.3,
          strokeWeight: 2,
          fillColor: '#4F46E5',
          fillOpacity: 0.1,
          map,
          center: results[0].geometry.location,
          radius: 100, // 100 meters radius
        });

        // Add custom marker (house emoji)
        new google.maps.Marker({
          position: results[0].geometry.location,
          map,
          icon: {
            url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(
              `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32">
                <text y="20" font-size="20">🏠</text>
              </svg>`
            )}`,
            scaledSize: new google.maps.Size(32, 32),
          },
        });
      }
    });
  }, [address]);

  return <div ref={mapRef} className="w-full h-[400px] rounded-lg" />;
}
