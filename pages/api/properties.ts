import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../lib/prisma';

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

    if (bedrooms && !isNaN(Number(bedrooms))) {
      where.rooms = parseInt(bedrooms as string);
    }

    if (bathrooms && !isNaN(Number(bathrooms))) {
      where.bathrooms = parseInt(bathrooms as string);
    }

    if (maxPrice && !isNaN(Number(maxPrice))) {
      where.price = {
        lte: parseInt(maxPrice as string),
      };
    }

    // Get all properties at once
    const properties = await prisma.property.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Return all properties
    return res.status(200).json({
      properties: properties || [],
      total: properties.length,
    });
  } catch (error) {
    // Ensure we're always sending JSON even for errors
    console.error('API Error:', error);
    return res.status(500).json({
      message: 'Failed to fetch properties',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
