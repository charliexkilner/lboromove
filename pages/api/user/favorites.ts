import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    const { propertyId } = req.body;

    try {
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const favorite = await prisma.favorite.create({
        data: {
          userId: user.id,
          houseId: propertyId,
        },
      });

      return res.status(200).json(favorite);
    } catch (error) {
      return res.status(500).json({ error: 'Failed to add favorite' });
    }
  }

  // Handle other methods...
}
