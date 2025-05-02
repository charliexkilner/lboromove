import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function generateTestUsers() {
  try {
    console.log('Generating test users...');

    // Create 20 test users
    for (let i = 0; i < 20; i++) {
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      
      await prisma.user.create({
        data: {
          email: faker.internet.email({ firstName, lastName }),
          firstName,
          lastName,
          emailVerified: new Date(),
        },
      });

      console.log(`Created user: ${firstName} ${lastName}`);
    }

    console.log('\nSuccessfully generated test users!');
  } catch (error) {
    console.error('Error generating test users:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateTestUsers()
  .then(() => console.log('Done'))
  .catch(console.error); 