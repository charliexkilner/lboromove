const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n,
  images: {
    domains: [
      'resource.rentcafe.com', 
      'firebasestorage.googleapis.com', 
      'images.rentals.com',
      'cdn.profoto.com',
      'www.lboro.ac.uk',
      'lboro.ac.uk'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
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
