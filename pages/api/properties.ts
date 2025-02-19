import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Always set JSON content type first
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { bedrooms, bathrooms, maxPrice } = req.query;

    // Build the where clause for filtering
    const where: any = {};

    if (bedrooms) {
      where.rooms = Number(bedrooms);
    }

    if (bathrooms) {
      where.bathrooms = Number(bathrooms);
    }

    if (maxPrice) {
      where.price = {
        lte: Number(maxPrice),
      };
    }

    const properties = await prisma.property.findMany({
      where,
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Found ${properties.length} properties`);
    return res.status(200).json({ properties });
  } catch (error) {
    // Ensure we're always sending JSON even for errors
    console.error('API Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch properties',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
