const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  images: {
    domains: [
      'example.com',
      'res.cloudinary.com',
      'images.unsplash.com',
      'lh3.googleusercontent.com',
      'loc8me.co.uk',
      'resource.rentcafe.com',
      'cdn.profoto.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'loc8me.co.uk',
        pathname: '/wp-content/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'resource.rentcafe.com',
        pathname: '/image/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn.profoto.com',
        pathname: '/cdn/**',
      },
    ],
    unoptimized: process.env.NODE_ENV === 'development',
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    minimumCacheTTL: 60,
  },
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix module resolution
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
