import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Add cache headers
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

  try {
    const { id } = req.query;
    const propertyId = parseInt(id as string);

    if (isNaN(propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
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
        scrapedFrom: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    console.log('Found property:', property ? 'yes' : 'no');

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    res.setHeader('Content-Type', 'application/json');
    return res.status(200).json(property);
  } catch (error) {
    console.error('Property API Error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
