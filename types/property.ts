export interface Property {
  id: number;
  title: string;
  price: number;
  rooms: number;
  images: string[];
  createdAt: Date;
  minToTown: number;
  minToCampus: number;
  bathrooms: number;
  location: string;
  description: string;
  amenities: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}
