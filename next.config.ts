/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    ppr: true, // Enable Partial Prerendering
  },
  images: {
    remotePatterns: [
      { hostname: 'flagcdn.com' }, // Optimize flag images
    ],
  },
};

module.exports = nextConfig;