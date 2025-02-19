// Haversine formula to calculate distance between two points
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

// Loughborough University coordinates
export const LBORO_UNIVERSITY = {
  lat: 52.772,
  lng: -1.2097,
};

// List of streets known to be close to campus
export const CLOSE_TO_CAMPUS_STREETS = [
  'forest road',
  'ashleigh drive',
  'oakwood drive',
  'college road',
  'forest court',
  'radmoor road',
  'tower way',
  'station street',
  'ashby road',
  'park road',
  'burleigh road',
  'epinal way',
  'kingfisher way',
  'frederick street',
  'william street',
  'granville street',
];

import { Property } from '@prisma/client';

const UNIVERSITY_COORDS = {
  latitude: 52.7649,
  longitude: -1.2321,
};

const TOWN_COORDS = {
  latitude: 52.7721, // Loughborough Town Center coordinates
  longitude: -1.2068,
};

const WALKING_SPEED = 5; // km/h average walking speed

export function isCloseToUniversity(property: Property): boolean {
  if (!property.latitude || !property.longitude) {
    console.log('Property missing coordinates:', property.street);
    return false;
  }

  // Calculate distance using Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(UNIVERSITY_COORDS.latitude - property.latitude);
  const dLon = toRad(UNIVERSITY_COORDS.longitude - property.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(property.latitude)) *
      Math.cos(toRad(UNIVERSITY_COORDS.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  // Return true if property is within 0.8km of university (about a 10-minute walk)
  const isClose = distance <= 0.8;
  console.log('Distance check:', {
    street: property.street,
    distance: `${(distance * 1000).toFixed(0)}m`,
    isClose,
  });
  return isClose;
}

export function calculateWalkingTime(
  property: Property,
  destination: 'campus' | 'town'
): number {
  if (!property.latitude || !property.longitude) return 0;

  const destCoords = destination === 'campus' ? UNIVERSITY_COORDS : TOWN_COORDS;

  // Calculate distance using existing Haversine formula
  const R = 6371; // Earth's radius in km
  const dLat = toRad(destCoords.latitude - property.latitude);
  const dLon = toRad(destCoords.longitude - property.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(property.latitude)) *
      Math.cos(toRad(destCoords.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in km

  // Calculate walking time in minutes
  const walkingTimeMinutes = (distance / WALKING_SPEED) * 60;

  // Round to nearest minute
  return Math.round(walkingTimeMinutes);
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
