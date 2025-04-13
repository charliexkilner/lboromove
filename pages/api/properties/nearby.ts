import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';
import { calculateDistance } from '../../../utils/distance';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Always set JSON content type
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { latitude, longitude, limit = 4, excludeId } = req.query;

    // Validate parameters
    if (!latitude || !longitude) {
      return res.status(400).json({ 
        message: 'Missing required parameters: latitude and longitude' 
      });
    }

    const lat = parseFloat(latitude as string);
    const lng = parseFloat(longitude as string);
    const limitCount = parseInt(limit as string, 10);

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({ 
        message: 'Invalid coordinates. Latitude and longitude must be valid numbers' 
      });
    }

    // Fetch all properties with coordinates
    const properties = await prisma.property.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null },
        ...(excludeId ? { id: { not: parseInt(excludeId as string, 10) } } : {})
      },
      select: {
        id: true,
        title: true,
        price: true,
        rooms: true,
        bathrooms: true,
        images: true,
        description: true,
        location: true,
        amenities: true,
        street: true,
        latitude: true,
        longitude: true,
        isGoldenTriangle: true,
        createdAt: true,
        updatedAt: true,
        keyFeatures: true,
        url: true,
        externalId: true,
        scrapedFrom: true
      },
    });

    console.log(`Found ${properties.length} properties with coordinates`);

    // Calculate distance for each property and add as a property
    const propertiesWithDistance = properties
      .filter(p => p.latitude && p.longitude) // Extra safety check
      .map(p => ({
        ...p,
        distance: calculateDistance(
          lat,
          lng,
          p.latitude!,
          p.longitude!
        )
      }));

    // Sort by distance and take the specified limit
    const nearbyProperties = propertiesWithDistance
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limitCount);

    console.log(`Returning ${nearbyProperties.length} nearby properties`);
    return res.status(200).json(nearbyProperties);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch nearby properties',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
} 