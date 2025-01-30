import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    console.log('Fetching property with ID:', id);
    const propertyId = Number(id);

    if (isNaN(propertyId)) {
      console.log('Invalid property ID:', id);
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
    console.error('Error fetching property:', error);
    return res.status(500).json({ message: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}
