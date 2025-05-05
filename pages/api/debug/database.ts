import { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '../../../lib/prisma';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    // Test database connection by executing a simple query
    const propertyCount = await prisma.property.count();
    const postCount = await prisma.discussionPost.count();
    
    return res.status(200).json({
      connected: true,
      propertyCount,
      postCount,
      databaseUrl: process.env.DATABASE_URL 
        ? `${process.env.DATABASE_URL.split('@')[0].split('://')[0]}://*****@${process.env.DATABASE_URL.split('@')[1]}`
        : 'Not configured',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error',
      timestamp: new Date().toISOString()
    });
  }
} 