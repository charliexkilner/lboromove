/**
 * This script directly patches line 381 in Next.js setup-dev-bundler.js
 * to fix the "TypeError [ERR_INVALID_ARG_TYPE]" error
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Define the paths to the files needing patching
const bundlerPaths = [
  path.join(process.cwd(), 'node_modules', 'next', 'dist', 'server', 'lib', 'router-utils', 'setup-dev-bundler.js'),
  path.join(process.cwd(), 'node_modules', 'next', 'dist', 'esm', 'server', 'lib', 'router-utils', 'setup-dev-bundler.js')
];

console.log('🔧 Direct patching of Next.js files...\n');

// Alternative approach: Find and patch the exact watchpack change event
let patchCount = 0;

bundlerPaths.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  try {
    // Read the entire file content
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Look for the event handler pattern where the error occurs
    const watchpackRegex = /watchpack\.on\(['"]change['"],\s*\(\s*filePath\s*,\s*([^)]*)\)\s*=>\s*\{/g;
    
    // Create a safer version that handles undefined filePath
    const safeContent = fileContent.replace(
      watchpackRegex,
      (match, mtime) => {
        return `watchpack.on('change', (filePath, ${mtime}) => {
          // Fixed by fix-next-dev-direct.js
          if (filePath === undefined) {
            console.warn('[Next.js] Received undefined filePath in watchpack change event');
            return;
          }`
      }
    );
    
    // Also patch any path.relative calls to safely handle undefined
    const saferContent = safeContent.replace(
      /path\.relative\(([^,]+),\s*([^)]+)\)/g,
      'path.relative($1 || "", $2 || "")'
    );

    // Check if any changes were made
    if (fileContent !== saferContent) {
      // Write the patched content back to the file
      fs.writeFileSync(filePath, saferContent);
      console.log(`✅ Successfully patched: ${filePath}`);
      patchCount++;
    } else {
      console.log(`⚠️ No changes needed in: ${filePath}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${filePath}: ${error.message}`);
  }
});

// If we couldn't fix by regex, try a more direct approach using temporary files
if (patchCount === 0) {
  console.log('\n⚠️ Regex approach failed. Trying line-by-line patching...');
  
  bundlerPaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    
    try {
      const tempFile = `${filePath}.temp`;
      const readStream = fs.createReadStream(filePath);
      const writeStream = fs.createWriteStream(tempFile);
      const rl = readline.createInterface({ input: readStream });
      
      let lineNumber = 0;
      let modified = false;
      
      rl.on('line', (line) => {
        lineNumber++;
        
        // Target exact line 381, but since line numbers can vary, also look for pattern
        if (line.includes('path.relative(dir, filePath)') || 
            (lineNumber >= 380 && lineNumber <= 382 && line.includes('path.relative'))) {
          // Replace with safe code
          const safeLine = line.replace(
            /path\.relative\(([^,]+),\s*([^)]+)\)/g,
            'path.relative($1 || "", $2 || "")'
          );
          
          writeStream.write(`${safeLine}\n`);
          modified = true;
          console.log(`🔧 Fixed line ${lineNumber}: ${line} → ${safeLine}`);
        } else {
          writeStream.write(`${line}\n`);
        }
      });
      
      rl.on('close', () => {
        writeStream.end();
        
        if (modified) {
          fs.copyFileSync(tempFile, filePath);
          fs.unlinkSync(tempFile);
          console.log(`✅ Successfully patched file via line-by-line approach: ${filePath}`);
          patchCount++;
        } else {
          fs.unlinkSync(tempFile);
          console.log(`⚠️ No matching lines found in: ${filePath}`);
        }
      });
    } catch (error) {
      console.error(`❌ Error in line-by-line patching for ${filePath}: ${error.message}`);
    }
  });
}

// Create a special Next.js config file to disable file watching
const nextConfigPath = path.join(process.cwd(), 'next.config.fix.js');
const configContent = `
// This is a temporary Next.js config to avoid file watching errors
const originalConfig = require('./next.config.js');

// Get the original config object
const nextConfig = typeof originalConfig === 'function' 
  ? originalConfig('phase-development-server', {})
  : originalConfig || {};

// Add the watchOptions to disable problematic file watching
module.exports = {
  ...nextConfig,
  // Disable file watching to prevent ERR_INVALID_ARG_TYPE errors
  webpack: (config, options) => {
    // Apply original webpack config if it exists
    const originalWebpack = nextConfig.webpack;
    const newConfig = typeof originalWebpack === 'function'
      ? originalWebpack(config, options)
      : config;

    // Add watchOptions to disable watching
    newConfig.watchOptions = {
      ignored: ['**/*'],
      poll: false,
      aggregateTimeout: 300,
    };

    return newConfig;
  },
};
`;

fs.writeFileSync(nextConfigPath, configContent);
console.log(`\n✅ Created special Next.js config file: next.config.fix.js`);

// Update the package.json to add a special dev script
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add a special dev:fix script that uses the fixed config
  packageJson.scripts['dev:fix'] = 'NODE_OPTIONS="--max-old-space-size=4096 --no-warnings" WATCHPACK_POLLING=true next dev -c next.config.fix.js';
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added dev:fix script to package.json');
  
  console.log('\n🚀 Setup complete! Run the following command to start Next.js without errors:');
  console.log('\nnpm run dev:fix\n');
} catch (error) {
  console.error('❌ Could not update package.json:', error.message);
} 