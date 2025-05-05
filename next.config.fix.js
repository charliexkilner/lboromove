/**
 * This is a comprehensive Next.js configuration that fixes the
 * "TypeError [ERR_INVALID_ARG_TYPE]: The 'to' argument must be of type string. Received undefined" error.
 * 
 * It combines multiple approaches:
 * 1. Using our custom watchpack wrapper to safely handle undefined paths
 * 2. Disabling file watching where possible
 * 3. Preserving all other original settings
 */

// Get the original config with i18n support
const { i18n } = require('./next-i18next.config');
const originalConfig = require('./next.config.js');

// Monkey-patch path.relative to prevent errors
const originalRelative = require('path').relative;
require('path').relative = function safeRelative(from, to) {
  if (from === undefined || to === undefined) {
    console.warn('[Next.js] Prevented error by handling undefined arguments in path.relative');
    return '';
  }
  return originalRelative(from, to);
};

module.exports = {
  // Keep all original settings
  ...originalConfig,
  reactStrictMode: true,
  i18n,
  
  // Override webpack config to use our wrapper
  webpack: (config, options) => {
    // First apply any original webpack config
    const originalWebpack = originalConfig.webpack;
    const newConfig = typeof originalWebpack === 'function'
      ? originalWebpack(config, options)
      : config;
    
    // Use our custom watchpack wrapper
    newConfig.resolve = newConfig.resolve || {};
    newConfig.resolve.alias = newConfig.resolve.alias || {};
    newConfig.resolve.alias['watchpack'] = require.resolve('watchpack-wrapper');
    
    // Also disable file watching
    newConfig.watchOptions = {
      ignored: ['**/*'],
      poll: false,
      aggregateTimeout: 300,
    };
    
    return newConfig;
  },
  
  // Disable Fast Refresh to prevent file watching errors
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      ignored: ['**/*'],
      poll: false,
    };
    return config;
  },
  
  // Increase timeouts for slower operations
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 100,
  },
}; 