import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const execPromise = promisify(exec);

async function runPrismaMigration() {
  try {
    console.log('Starting Prisma migration...');
    
    // Generate Prisma client
    console.log('Generating Prisma client...');
    await execPromise('npx prisma generate');
    console.log('Prisma client generated successfully');
    
    // Create migration
    console.log('Creating migration...');
    await execPromise('npx prisma migrate dev --name add_campus_property');
    console.log('Migration created successfully');
    
    console.log('Prisma migration completed successfully');
  } catch (error) {
    console.error('Error running Prisma migration:', error);
  }
}

// Run the migration function
runPrismaMigration()
  .then(() => console.log('Done'))
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  }); 