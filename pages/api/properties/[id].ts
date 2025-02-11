import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';

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

    // Extract the numeric ID from the URL (e.g., "fearon-street-1855" -> "1855")
    const propertyId = parseInt(id.toString().split('-').pop() || '');

    if (isNaN(propertyId)) {
      return res.status(400).json({ message: 'Invalid property ID' });
    }

    const property = await prisma.property.findUnique({
      where: {
        id: propertyId,
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
  } finally {
    await prisma.$disconnect();
  }
}
