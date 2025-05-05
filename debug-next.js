
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
