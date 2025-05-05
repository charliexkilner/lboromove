/**
 * This script directly patches the watchpack module to prevent ERR_INVALID_ARG_TYPE errors.
 * It creates a proxy around the emit method of Watchpack to filter out undefined file paths.
 */
const fs = require('fs');
const path = require('path');

console.log('🔧 Patching watchpack module...');

// Find the compiled watchpack library
const watchpackPaths = [
  path.join(process.cwd(), 'node_modules', 'next', 'dist', 'compiled', 'watchpack', 'watchpack.js'),
];

let patched = false;

watchpackPaths.forEach(watchpackPath => {
  if (!fs.existsSync(watchpackPath)) {
    console.log(`❌ File not found: ${watchpackPath}`);
    return;
  }

  try {
    // Read the file
    const content = fs.readFileSync(watchpackPath, 'utf8');

    // Find the Watchpack class or prototype where the emit method is defined
    if (content.includes('Watchpack.prototype._emit') || content.includes('Watchpack.prototype.emit')) {
      // We need to patch the emit method

      // This is a more direct approach - add our proxy code to the top of the file
      const patchedContent = `
// Patched by patch-watchpack.js to prevent ERR_INVALID_ARG_TYPE errors
const originalEmit = require('events').EventEmitter.prototype.emit;
require('events').EventEmitter.prototype.emit = function patchedEmit(event, ...args) {
  // Special handling for 'change' events which might have undefined file paths
  if (event === 'change' && args[0] === undefined) {
    console.warn('[Next.js] Prevented error by filtering undefined file path in watchpack');
    return true; // Return true to simulate a successful emit
  }
  return originalEmit.call(this, event, ...args);
};

${content}`;

      // Write the patched content
      fs.writeFileSync(watchpackPath, patchedContent);
      console.log(`✅ Successfully patched watchpack emit method in: ${watchpackPath}`);
      patched = true;
    } else {
      console.log(`⚠️ Could not identify emit method in: ${watchpackPath}`);
    }
  } catch (error) {
    console.error(`❌ Error patching ${watchpackPath}: ${error.message}`);
  }
});

if (!patched) {
  console.log(`\n⚠️ Could not patch watchpack directly. Trying alternative approach...`);
  
  // If we couldn't patch watchpack directly, let's create a custom wrapper in node_modules
  const wrapperDir = path.join(process.cwd(), 'node_modules', 'watchpack-wrapper');
  const wrapperFile = path.join(wrapperDir, 'index.js');
  
  try {
    // Create directory if it doesn't exist
    if (!fs.existsSync(wrapperDir)) {
      fs.mkdirSync(wrapperDir, { recursive: true });
    }
    
    // Create a wrapper module
    const wrapperContent = `
// Watchpack wrapper to prevent ERR_INVALID_ARG_TYPE errors
const originalWatchpack = require('watchpack');

// Create a safer version of Watchpack
class SafeWatchpack extends originalWatchpack {
  constructor(options) {
    super(options);
    
    // Override the emit method to filter out undefined paths
    const originalEmit = this.emit;
    this.emit = function(event, ...args) {
      if (event === 'change' && args[0] === undefined) {
        console.warn('[Next.js] Prevented error by filtering undefined file path in watchpack');
        return true;
      }
      return originalEmit.apply(this, [event, ...args]);
    };
  }
}

module.exports = SafeWatchpack;
`;

    // Create a package.json for the wrapper
    const packageJson = {
      name: "watchpack-wrapper",
      version: "1.0.0",
      main: "index.js",
      description: "Wrapper around watchpack to prevent ERR_INVALID_ARG_TYPE errors"
    };
    
    // Write the files
    fs.writeFileSync(wrapperFile, wrapperContent);
    fs.writeFileSync(path.join(wrapperDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    console.log(`✅ Created watchpack wrapper at: ${wrapperFile}`);
    console.log(`\n👉 To use this wrapper, update your next.config.js to include the following webpack config:`);
    console.log(`
webpack: (config) => {
  // Use our safer Watchpack wrapper
  config.resolve.alias = {
    ...config.resolve.alias,
    'watchpack': require.resolve('watchpack-wrapper')
  };
  return config;
},`);
  } catch (error) {
    console.error(`❌ Error creating watchpack wrapper: ${error.message}`);
  }
}

// Create a special script to start Next.js with Node.js debugging
const debugScript = path.join(process.cwd(), 'debug-next.js');
const debugContent = `
#!/usr/bin/env node
console.log('🔍 Starting Next.js in debug mode...');
process.env.NODE_OPTIONS = '--inspect --no-warnings';
process.env.WATCHPACK_POLLING = 'true';
process.env.NEXT_TELEMETRY_DISABLED = '1';

// Monkey patch the path.relative function to handle undefined arguments
const originalRelative = require('path').relative;
require('path').relative = function(from, to) {
  if (from === undefined || to === undefined) {
    console.warn('[Next.js Debug] Prevented error by handling undefined arguments in path.relative');
    return "";
  }
  return originalRelative(from, to);
};

// Require the next CLI
require('./node_modules/next/dist/bin/next');
`;

fs.writeFileSync(debugScript, debugContent);
fs.chmodSync(debugScript, '755'); // Make it executable
console.log(`\n✅ Created debug script: debug-next.js`);

// Update package.json with the debug script
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add a special debug script
  packageJson.scripts['dev:debug'] = `node ${debugScript} dev`;
  
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Added dev:debug script to package.json');
  
  console.log('\n🚀 You now have multiple options to start Next.js:');
  console.log('1. npm run dev:nowatch - Uses a config that disables file watching');
  console.log('2. npm run dev:debug - Uses a custom debug script that patches path.relative');
  console.log('3. npm run dev:prod - Builds and runs the production version (no file watching)');
  console.log('\nThese approaches should work around the ERR_INVALID_ARG_TYPE error.');
  console.log('None of these changes affect your production build on Vercel!');
} catch (error) {
  console.error('❌ Could not update package.json:', error.message);
} 