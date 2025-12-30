/** @type {import('next').NextConfig} */
const nextConfig = {
  // experimental: {
  //   ppr: true, <--- REMOVE THIS LINE (It caused the error)
  // },
  images: {
    remotePatterns: [
      { hostname: 'flagcdn.com' },
    ],
  },
};

module.exports = nextConfig;