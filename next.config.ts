import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Disable ESLint during builds temporarily
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Keep TypeScript checking enabled
    ignoreBuildErrors: false,
  },
  // Disable static optimization for auth-dependent pages
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  output: 'standalone',
};

export default nextConfig;
