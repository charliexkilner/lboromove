import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
let prismaGlobal: PrismaClient;

export function getPrismaClient(): PrismaClient {
  if (process.env.NODE_ENV === 'production') {
    if (!prismaGlobal) {
      // Add debug info for database connection in production
      console.log('Initializing Prisma Client in production');
      prismaGlobal = new PrismaClient({
        log: process.env.DEBUG_PRISMA === 'true' ? ['query', 'error', 'warn'] : ['error'],
      });
    }
    return prismaGlobal;
  }
  
  // In development, log more information
  if (!global.prisma) {
    console.log('Initializing Prisma Client in development');
    global.prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  
  return global.prisma;
}

export async function testDatabaseConnection(): Promise<{ ok: boolean; error?: string }> {
  const prisma = getPrismaClient();
  
  try {
    // Try to execute a simple query
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (error) {
    console.error('Database connection test failed:', error);
    return { 
      ok: false, 
      error: error instanceof Error ? error.message : 'Unknown database error' 
    };
  }
} 