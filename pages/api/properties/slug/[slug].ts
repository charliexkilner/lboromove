import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { getPropertyIdFromSlug } from '@/utils/url';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { slug } = req.query;
  const propertyId = getPropertyIdFromSlug(slug as string);

  try {
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) },
    });

    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    return res.status(200).json(property);
  } catch (error) {
    console.error('Error fetching property:', error);
    return res.status(500).json({ error: 'Failed to fetch property' });
  }
}
