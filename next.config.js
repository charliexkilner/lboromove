const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  i18n,
  images: {
    domains: [
      'lboro.ac.uk',
      'loc8me.co.uk',
      'top-lets.co.uk',
      'lh3.googleusercontent.com',  // Add this for Google profile images
      'googleusercontent.com'       // Add this for Google profile images
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'resource.rentcafe.com',
      },
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'images.rentals.com',
      },
      {
        protocol: 'https',
        hostname: '**.lboro.ac.uk',
      },
      {
        protocol: 'https',
        hostname: 'loc8me.co.uk',
      },
      {
        protocol: 'https',
        hostname: '**.loc8me.co.uk',
      },
      {
        protocol: 'https',
        hostname: 'top-lets.co.uk',
      },
      {
        protocol: 'https',
        hostname: '**.top-lets.co.uk',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',  // Add this for Google profile images
      }
    ],
    minimumCacheTTL: 60,
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    formats: ['image/webp'],
    dangerouslyAllowSVG: true,
    unoptimized: true,  // Skip optimization for external images that are causing issues
  },
  // Optimize the build for Vercel
  swcMinify: true,
  // Avoid Mapbox related ESM issues
  transpilePackages: ['mapbox-gl'],
  // Increase build timeouts for larger apps
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
    optimizeCss: true,
    outputFileTracingRoot: require('path').join(__dirname, '../../'), // Recommended for monorepos, but can help ensure all files are traced.
  },
  output: 'standalone',
  webpack: (config) => {
    // Add support for importing worker files
    config.module.rules.push({
      test: /\.worker\.js$/,
      loader: 'worker-loader',
      options: {
        filename: 'static/[hash].worker.js',
        publicPath: '/_next/',
      },
    });
    return config;
  },
};

// Check if we're using a special config file
if (process.env.NEXT_CONFIG_FILE) {
  console.log(`Using custom config: ${process.env.NEXT_CONFIG_FILE}`);
  module.exports = require(`./${process.env.NEXT_CONFIG_FILE}`);
} else {
  module.exports = nextConfig;
}
