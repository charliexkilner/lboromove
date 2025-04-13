const { execSync } = require('child_process');
const path = require('path');

// Define the scripts to run in sequence
const scripts = [
  'update-property-coordinates-simple.js',  // First, update coordinates (simple version without API key)
  'update-golden-triangle.js',              // Then, update golden triangle properties
  'update-walking-distances.js',            // Calculate walking distances
  'verify-walking-distances.js'             // Verify and fix any discrepancies
];

// Function to run a script with nice output formatting
function runScript(scriptName) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`RUNNING: ${scriptName}`);
  console.log(`${'='.repeat(80)}\n`);
  
  try {
    // Run script and capture output
    const output = execSync(`node ${scriptName}`, {
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`COMPLETED: ${scriptName}`);
    console.log(`${'='.repeat(80)}\n`);
    
    return true;
  } catch (error) {
    console.error(`\n${'='.repeat(80)}`);
    console.error(`ERROR in ${scriptName}: ${error.message}`);
    console.error(`${'='.repeat(80)}\n`);
    
    return false;
  }
}

// Main function to run all scripts in sequence
async function runAllScripts() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('STARTING PROPERTY UPDATE WORKFLOW');
  console.log(`${'='.repeat(80)}\n`);
  
  for (const script of scripts) {
    const success = runScript(script);
    
    if (!success) {
      console.error(`Failed to run ${script}. Stopping execution.`);
      process.exit(1);
    }
  }
  
  console.log(`\n${'='.repeat(80)}`);
  console.log('ALL PROPERTY UPDATES COMPLETED SUCCESSFULLY');
  console.log(`${'='.repeat(80)}\n`);
}

// Run all scripts
runAllScripts(); 