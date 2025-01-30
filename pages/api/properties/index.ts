import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'GET') {
    const { bedrooms, bathrooms, maxPrice } = req.query;

    const filters: any = {};

    if (bedrooms) {
      filters.rooms = parseInt(bedrooms as string);
    }

    if (bathrooms) {
      filters.bathrooms = parseInt(bathrooms as string);
    }

    if (maxPrice) {
      filters.price =
        parseInt(maxPrice as string) >= 350
          ? {
              gte: 0,
            }
          : {
              lte: parseInt(maxPrice as string),
            };
    }

    try {
      const properties = await prisma.property.findMany({
        where: filters,
        orderBy: {
          createdAt: 'desc',
        },
      });

      return res.status(200).json(properties);
    } catch (error) {
      console.error('Error fetching properties:', error);
      return res.status(500).json([]);
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
