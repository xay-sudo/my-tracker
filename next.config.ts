import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep this to ignore Type errors
  typescript: {
    ignoreBuildErrors: true,
  },
  // ❌ REMOVED the 'eslint' block because it causes the error
};

export default nextConfig;