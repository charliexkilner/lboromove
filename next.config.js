const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  images: {
    domains: ['lboro.ac.uk', 'loc8me.co.uk', 'top-lets.co.uk'],
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
    optimizeCss: true
  },
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

module.exports = nextConfig;
