import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get discussions created by the user
    const userDiscussions = await prisma.discussionPost.findMany({
      where: {
        OR: [
          { authorId: session.user.id }, // Posts created by the user
          {
            comments: {
              some: {
                authorId: session.user.id // Posts where user has commented
              }
            }
          },
          {
            votes: {
              some: {
                userId: session.user.id // Posts user has voted on
              }
            }
          }
        ]
      },
      include: {
        author: {
          select: {
            firstName: true,
            lastName: true,
            image: true,
          }
        },
        _count: {
          select: {
            comments: true,
            votes: true,
          }
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
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Transform the data to match the frontend expectations
    const formattedDiscussions = userDiscussions.map(discussion => ({
      id: discussion.id,
      title: discussion.title,
      content: discussion.content,
      imageUrl: discussion.imageUrl,
      replyCount: discussion._count.comments,
      upvotes: discussion._count.votes,
      lastReplied: discussion.updatedAt,
      avatars: discussion.comments
        .map(comment => comment.author.image)
        .filter((image): image is string => image !== null)
        .slice(0, 3),
      author: {
        firstName: discussion.author.firstName,
        lastName: discussion.author.lastName,
        image: discussion.author.image
      }
    }));

    return res.status(200).json(formattedDiscussions);
  } catch (error) {
    console.error('Error fetching user discussions:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 