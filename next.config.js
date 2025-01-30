const { i18n } = require('./next-i18next.config');

/** @type {import('next').NextConfig} */
const nextConfig = {
  i18n,
  reactStrictMode: true,
  images: {
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
  },
};

module.exports = nextConfig;
