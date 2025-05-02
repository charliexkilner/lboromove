import { NextApiRequest, NextApiResponse } from 'next';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]';
import prisma from '../../../lib/prisma';
import formidable, { File } from 'formidable';
import { promises as fs } from 'fs';
import path from 'path';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public/uploads'),
      filename: (_name: string, _ext: string, part: formidable.Part) => {
        return `${Date.now()}-${part.originalFilename}`;
      },
    });

    const [fields, files] = await form.parse(req);
    
    const title = fields.title?.[0];
    const description = fields.description?.[0];
    const category = fields.category?.[0];
    const uploadedFile = files.photo?.[0];

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    let imageUrl = null;
    if (uploadedFile) {
      // Create relative URL for the uploaded file
      imageUrl = `/uploads/${uploadedFile.newFilename}`;
    }

    const post = await prisma.discussionPost.create({
      data: {
        title,
        content: description,
        category: category || 'general',
        imageUrl,
        author: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 