import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Session } from 'next-auth';
import { UserRole } from '@prisma/client';

// Extend Session type to include our custom user fields
interface ExtendedSession extends Session {
  user: {
    id: string;
    email?: string | null;
    image?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    role: UserRole;
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions) as ExtendedSession | null;

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { propertyId } = req.body;

    try {
      // Check if favorite already exists
      const existingFavorite = await prisma.favorite.findUnique({
        where: {
          userId_houseId: {
            userId: session.user.id,
            houseId: propertyId.toString(),
          },
        },
      });

      if (existingFavorite) {
        return res.status(400).json({ error: 'Property already favorited' });
      }

      const favorite = await prisma.favorite.create({
        data: {
          userId: session.user.id,
          houseId: propertyId.toString(),
        },
      });

      return res.status(200).json(favorite);
    } catch (error) {
      console.error('Error adding favorite:', error);
      return res.status(500).json({ error: 'Failed to add favorite' });
    }
  }

  if (req.method === 'GET') {
    try {
      const favorites = await prisma.favorite.findMany({
        where: {
          userId: session.user.id,
        },
        include: {
          user: true,
        },
      });

      // Get the full property details for each favorite
      const favoritedProperties = await Promise.all(
        favorites.map(async (favorite) => {
          const property = await prisma.property.findUnique({
            where: {
              id: parseInt(favorite.houseId),
            },
          });
          return property;
        })
      );

      // Filter out any null properties (in case some were deleted)
      const validProperties = favoritedProperties.filter(Boolean);

      return res.status(200).json(validProperties);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      return res.status(500).json({ error: 'Failed to fetch favorites' });
    }
  }

  if (req.method === 'DELETE') {
    const { propertyId } = req.query;

    if (!propertyId) {
      return res.status(400).json({ error: 'Property ID is required' });
    }

    try {
      // Find and delete the favorite
      await prisma.favorite.delete({
        where: {
          userId_houseId: {
            userId: session.user.id,
            houseId: propertyId.toString(),
          },
        },
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error('Error deleting favorite:', error);
      return res.status(500).json({ error: 'Failed to delete favorite' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
