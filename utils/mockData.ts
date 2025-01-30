import { Property } from '../types/property';

export const getMockProperties = (page: number, limit: number): Property[] => {
  const startIndex = (page - 1) * limit;
  return Array.from({ length: limit }, (_, index) => ({
    id: `property-${startIndex + index}`,
    title: `Royland Road`,
    location: 'Loughborough',
    price: 126,
    imageUrl: 'https://loc8me.co.uk/wp-content/uploads/2024/02/building.jpg',
    rooms: 7,
    minToTown: 4,
    minToCampus: 12,
  }));
};

export const mockProperties: Property[] = [
  {
    id: 1,
    title: 'Modern Student House',
    location: 'Loughborough',
    price: 120,
    images: ['/house1.jpg', '/house2.jpg'],
    rooms: 4,
    minToTown: 8,
    minToCampus: 20,
    bathrooms: 2,
    createdAt: new Date(),
    description:
      'Beautiful student house located in the heart of the student area.',
    amenities: ['En-suite', 'Bills Included', 'Large Kitchen'],
    coordinates: {
      lat: 52.7721,
      lng: -1.2062,
    },
  },
  // ... add more properties with the same structure
];
