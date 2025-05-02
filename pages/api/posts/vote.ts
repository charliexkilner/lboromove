import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { postId, value } = req.body;

    if (!postId || typeof value !== 'number') {
      return res.status(400).json({ message: 'Post ID and value are required' });
    }

    // Check if user has already voted
    const existingVote = await prisma.postVote.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: session.user.id,
        },
      },
    });

    if (existingVote) {
      if (value === -1) {
        // Remove the vote if user is unvoting
        await prisma.postVote.delete({
          where: {
            postId_userId: {
              postId,
              userId: session.user.id,
            },
          },
        });
      } else {
        // Update existing vote
        await prisma.postVote.update({
          where: {
            postId_userId: {
              postId,
              userId: session.user.id,
            },
          },
          data: {
            value,
          },
        });
      }
    } else if (value === 1) {
      // Only create new vote if value is 1 (upvoting)
      await prisma.postVote.create({
        data: {
          postId,
          userId: session.user.id,
          value,
        },
      });
    }

    // Get updated vote count and user's vote status
    const [updatedPost, userVote] = await Promise.all([
      prisma.discussionPost.findUnique({
        where: { id: postId },
        include: {
          _count: {
            select: {
              votes: true,
            },
          },
        },
      }),
      prisma.postVote.findUnique({
        where: {
          postId_userId: {
            postId,
            userId: session.user.id,
          },
        },
      }),
    ]);

    return res.status(200).json({
      ...updatedPost,
      hasUpvoted: !!userVote,
    });
  } catch (error) {
    console.error('Error voting on post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 