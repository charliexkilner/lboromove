import { Property } from '@prisma/client';

// Export the type for use in components
export type { Property };

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
    minToTown: 15,
    minToCampus: 10,
    location: 'Loughborough',
    description:
      'Beautiful student house located in the heart of the student area. Recently renovated with modern appliances and furnishings throughout.',
    amenities: [
      { name: 'En-suite', icon: '🚿' },
      { name: 'Bills Included', icon: '💡' },
      { name: 'Large Kitchen', icon: '🍳' },
      { name: 'Garden', icon: '🌳' },
      { name: 'Dishwasher', icon: '🍽️' },
      { name: 'Fast WiFi', icon: '📶' },
    ],
    createdAt: new Date(),
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
    minToTown: 12,
    minToCampus: 8,
    location: 'Loughborough',
    description:
      'Charming house perfect for students, located close to campus and town center.',
    amenities: [
      { name: 'Bills Included', icon: '💡' },
      { name: 'Large Kitchen', icon: '🍳' },
      { name: 'Garden', icon: '🌳' },
      { name: 'Washing Machine', icon: '🧺' },
      { name: 'Fast WiFi', icon: '📶' },
    ],
    createdAt: new Date(),
  },
  // Add more properties as needed
];
