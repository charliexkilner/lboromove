import { NextApiRequest, NextApiResponse } from 'next';
import prisma from '../../../lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../../../lib/auth';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    const { category, sortBy = 'new' } = req.query;

    // If no category is specified or category is 'All', don't filter by category
    const where = category && category !== 'All' ? {
      category: category as string,
    } : undefined;

    const posts = await prisma.discussionPost.findMany({
      where,
      orderBy: [
        sortBy === 'new' 
          ? { createdAt: 'desc' }
          : { votes: { _count: 'desc' } },
        { createdAt: 'desc' }, // Secondary sort by creation date
      ],
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          },
        },
        votes: session?.user?.id ? {
          where: {
            userId: session.user.id,
          },
          select: {
            id: true,
          },
        } : false,
        _count: {
          select: {
            comments: true,
            votes: true,
          },
        },
        comments: {
          take: 3,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            author: {
              select: {
                image: true
              }
            }
          }
        }
      },
    });

    // Transform the response to include hasUpvoted and format the data
    const postsWithUpvoteStatus = posts.map(post => {
      // Ensure _count exists with default values
      const _count = {
        comments: post._count?.comments ?? 0,
        votes: post._count?.votes ?? 0
      };

      return {
        id: post.id,
        title: post.title,
        content: post.content,
        imageUrl: post.imageUrl,
        category: post.category,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        hasUpvoted: Array.isArray(post.votes) && post.votes.length > 0,
        _count, // Include _count object with comments and votes
        author: {
          firstName: post.author?.firstName || '',
          lastName: post.author?.lastName || '',
          image: post.author?.image || null
        },
        avatars: (post.comments || [])
          .map(comment => comment?.author?.image)
          .filter((image): image is string => image !== null && image !== undefined)
          .slice(0, 3)
      };
    });

    return res.status(200).json(postsWithUpvoteStatus);
  } catch (error) {
    console.error('Error fetching posts:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 