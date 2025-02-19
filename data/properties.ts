import { Property } from '@prisma/client';

// Export the type for use in components
export type { Property };

// First, define the amenity type
interface Amenity {
  name: string;
  icon: string;
}

export const properties: Property[] = [
  {
    id: 1,
    title: '32 Royland Road',
    price: 120,
    rooms: 4,
    bathrooms: 2,
    images: [
      '/images/houses/32-royland-road/1.jpg',
      '/images/houses/32-royland-road/2.jpg',
    ],
    location: 'Loughborough',
    description:
      'Beautiful student house located in the heart of the student area. Recently renovated with modern appliances and furnishings throughout.',
    amenities: [
      'En-suite',
      'Bills Included',
      'Large Kitchen',
      'Garden',
      'Dishwasher',
    ],
    scrapedFrom: 'William Davis',
    externalId: '32-royland-road',
    hash: '32-royland-road-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isGoldenTriangle: false,
    url: '',
    keyFeatures: [],
    landlordId: null,
    latitude: null,
    longitude: null,
    street: null,
  },
  {
    id: 2,
    title: '16 Arthur Street',
    price: 110,
    rooms: 3,
    bathrooms: 1,
    images: [
      '/images/houses/16-arthur-street/1.jpg',
      '/images/houses/16-arthur-street/2.jpg',
    ],
    location: 'Loughborough',
    description:
      'Charming house perfect for students, located close to campus and town center.',
    amenities: [
      'Bills Included',
      'Large Kitchen',
      'Garden',
      'Washing Machine',
      'Fast WiFi',
    ],
    scrapedFrom: '',
    externalId: '16-arthur-street',
    hash: '16-arthur-street-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    isGoldenTriangle: false,
    url: '',
    keyFeatures: [],
    landlordId: null,
    latitude: null,
    longitude: null,
    street: null,
  },
  // Add more properties as needed
];
