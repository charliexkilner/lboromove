import { NextApiRequest, NextApiResponse } from 'next';
import { getSession } from 'next-auth/react';
import { prisma } from '../../../lib/prisma';
import { StudyYear } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getSession({ req });

    if (!session) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    const { studyYear } = req.body;

    // Validate study year
    if (studyYear && !Object.values(StudyYear).includes(studyYear)) {
      return res.status(400).json({ message: 'Invalid study year' });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email! },
      data: {
        studyYear: studyYear || null,
      },
    });

    return res.status(200).json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    return res.status(500).json({ message: 'Error updating user' });
  }
} 