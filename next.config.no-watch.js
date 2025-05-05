// This config completely disables file watching to prevent ERR_INVALID_ARG_TYPE errors
const { i18n } = require('./next-i18next.config');

// Get the original config
const originalConfig = require('./next.config.js');

module.exports = {
  ...originalConfig,
  // Preserve all original settings
  reactStrictMode: true,
  i18n,
  
  // Disable Fast Refresh to prevent file watching errors
  webpackDevMiddleware: (config) => {
    config.watchOptions = {
      ignored: ['**/*'],
      poll: false,
    };
    return config;
  },
  
  // Override webpack config to disable file watching
  webpack: (config, { dev, isServer }) => {
    // Apply original webpack config if it exists
    const originalWebpack = originalConfig.webpack;
    const newConfig = typeof originalWebpack === 'function'
      ? originalWebpack(config, { dev, isServer })
      : config;
    
    if (dev) {
      // Disable file watching completely
      newConfig.watchOptions = {
        ignored: ['**/*'],
        aggregateTimeout: 300,
        poll: false,
      };
    }
    
    return newConfig;
  },
  
  // Set specific Next.js options to avoid file watching
  onDemandEntries: {
    // Keep pages in memory longer
    maxInactiveAge: 60 * 60 * 1000,
    // Don't dispose of pages
    pagesBufferLength: 100,
  },
} 