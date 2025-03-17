import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';

// Load environment variables
dotenv.config();

const execPromise = promisify(exec);

async function updateCampusProperties() {
  try {
    console.log('Starting campus properties update...');
    
    // Create data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('Created data directory');
    }
    
    // Run the scraping script
    console.log('Running campus properties scraper...');
    const { stdout, stderr } = await execPromise('npx ts-node -P tsconfig.scripts.json scripts/scrape-campus-properties.ts');
    
    if (stderr) {
      console.error('Error from scraper:', stderr);
    }
    
    console.log(stdout);
    
    // Check if the JSON file was created
    const jsonFilePath = path.join(process.cwd(), 'data', 'campus-properties.json');
    if (fs.existsSync(jsonFilePath)) {
      console.log('Campus properties JSON file updated successfully');
      
      // Read the file to verify
      const fileContents = fs.readFileSync(jsonFilePath, 'utf8');
      const campusProperties = JSON.parse(fileContents);
      console.log(`Verified ${campusProperties.length} campus properties in the JSON file`);
    } else {
      console.error('Campus properties JSON file was not created');
    }
    
    console.log('Campus properties update completed');
  } catch (error) {
    console.error('Error updating campus properties:', error);
  }
}

// Run the update function
updateCampusProperties()
  .then(() => console.log('Done'))
  .catch((error) => {
    console.error('Update failed:', error);
    process.exit(1);
  }); 