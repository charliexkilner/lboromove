/**
 * This script checks for and fixes common configuration issues in the project
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Checking project configuration...');

// Check and fix package.json scripts
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  let modified = false;
  
  // Fix dev:fix script if it's using -c flag
  if (packageJson.scripts && packageJson.scripts['dev:fix'] && packageJson.scripts['dev:fix'].includes('-c')) {
    console.log('⚠️ Found -c flag in dev:fix script, fixing...');
    packageJson.scripts['dev:fix'] = "NEXT_CONFIG_FILE=next.config.fix.js WATCHPACK_POLLING=false NODE_OPTIONS='--max-old-space-size=4096 --no-warnings' next dev";
    modified = true;
  }
  
  // Fix dev:nowatch script if it's using -c flag
  if (packageJson.scripts && packageJson.scripts['dev:nowatch'] && packageJson.scripts['dev:nowatch'].includes('-c')) {
    console.log('⚠️ Found -c flag in dev:nowatch script, fixing...');
    packageJson.scripts['dev:nowatch'] = "NEXT_CONFIG_FILE=next.config.no-watch.js WATCHPACK_POLLING=false NODE_OPTIONS='--no-warnings' next dev";
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Fixed package.json scripts');
  } else {
    console.log('✅ Package.json scripts look good');
  }
} catch (error) {
  console.error('❌ Error checking package.json:', error.message);
}

// Check tsconfig.json
try {
  const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  
  let modified = false;
  
  // Ensure downlevelIteration is enabled for ES5 target
  if (tsconfig.compilerOptions && tsconfig.compilerOptions.target === 'es5' && !tsconfig.compilerOptions.downlevelIteration) {
    console.log('⚠️ Missing downlevelIteration in tsconfig.json, adding...');
    tsconfig.compilerOptions.downlevelIteration = true;
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    console.log('✅ Fixed tsconfig.json');
  } else {
    console.log('✅ tsconfig.json looks good');
  }
} catch (error) {
  console.error('❌ Error checking tsconfig.json:', error.message);
}

// Check next.config.js
try {
  const nextConfigPath = path.join(process.cwd(), 'next.config.js');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  
  if (!nextConfigContent.includes('NEXT_CONFIG_FILE')) {
    console.log('⚠️ next.config.js is missing NEXT_CONFIG_FILE check, adding...');
    
    const updatedContent = nextConfigContent.replace(
      /module\.exports\s*=\s*nextConfig;/,
      `// Check if we're using a special config file
if (process.env.NEXT_CONFIG_FILE) {
  console.log(\`Using custom config: \${process.env.NEXT_CONFIG_FILE}\`);
  module.exports = require(\`./\${process.env.NEXT_CONFIG_FILE}\`);
} else {
  module.exports = nextConfig;
}`
    );
    
    fs.writeFileSync(nextConfigPath, updatedContent);
    console.log('✅ Fixed next.config.js');
  } else {
    console.log('✅ next.config.js looks good');
  }
} catch (error) {
  console.error('❌ Error checking next.config.js:', error.message);
}

// Add the new script to package.json
try {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  if (!packageJson.scripts['check-config']) {
    console.log('⚠️ Adding check-config script to package.json...');
    packageJson.scripts['check-config'] = 'node scripts/check-config.js';
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added check-config script');
  }
} catch (error) {
  console.error('❌ Error adding check-config script:', error.message);
}

console.log('\n🎉 Configuration check complete!');
console.log('\nIf you encounter any issues with development environment:');
console.log('1. Run "npm run check-config" to fix common issues');
console.log('2. Then try "npm run dev:fix" or "npm run dev:nowatch"\n'); 