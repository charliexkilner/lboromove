import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearTestData() {
  try {
    await prisma.property.deleteMany({
      where: {
        title: 'Test Property',
      },
    });
    console.log('Test property deleted successfully');
  } catch (error) {
    console.error('Error deleting test property:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearTestData();
