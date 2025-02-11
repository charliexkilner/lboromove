import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prismaClientConfig = {
  log: ['error', 'warn'],
  errorFormat: 'pretty',
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
};

const prisma = global.prisma || new PrismaClient(prismaClientConfig);

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Add connection error handling
prisma
  .$connect()
  .then(() => {
    console.log('Successfully connected to database');
  })
  .catch((error) => {
    console.error('Failed to connect to database:', error);
  });

// Handle cleanup
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
