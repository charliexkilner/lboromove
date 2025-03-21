import { Property } from '@prisma/client';

// Mock data for testing
export const getMockProperties = (page: number, limit: number): Partial<Property>[] => {
  const startIndex = (page - 1) * limit;
  return Array.from({ length: limit }, (_, index) => ({
    id: Number(startIndex + index),
    title: `Royland Road`,
    location: 'Loughborough',
    price: 100 + (index * 10),
    images: ['/placeholder.jpg'],
    rooms: 4,
    bathrooms: 2,
    description: 'A mock property description',
    amenities: ['Garden', 'Bills Included'],
    scrapedFrom: 'mock',
    externalId: `mock-${index}`,
    hash: `mock-hash-${index}`,
    createdAt: new Date(),
    updatedAt: new Date(),
    isGoldenTriangle: false
  }));
};

// Define a custom interface that includes the additional properties for mock data
interface MockProperty {
  id: number;
  title: string;
  location: string;
  price: number;
  images: string[];
  rooms: number;
  bathrooms: number;
  description: string;
  amenities: string[];
  createdAt: Date;
  scrapedFrom: string;
  externalId: string;
  hash: string;
  updatedAt: Date;
  isGoldenTriangle: boolean;
  // Additional mock-specific properties
  distanceToCampus?: number;
  distanceToTown?: number;
  latitude?: number;
  longitude?: number;
}

export const mockProperties: MockProperty[] = [
  {
    id: 1,
    title: 'Modern Student House',
    location: 'Loughborough',
    price: 120,
    images: ['/house1.jpg', '/house2.jpg'],
    rooms: 4,
    bathrooms: 2,
    createdAt: new Date(),
    updatedAt: new Date(),
    description:
      'Beautiful student house located in the heart of the student area.',
    amenities: ['En-suite', 'Bills Included', 'Large Kitchen'],
    scrapedFrom: 'mock',
    externalId: 'mock-1',
    hash: 'mock-hash-1',
    isGoldenTriangle: false,
    distanceToTown: 8,
    distanceToCampus: 20,
    latitude: 52.7721,
    longitude: -1.2062,
  },
  // Add more properties as needed
];
