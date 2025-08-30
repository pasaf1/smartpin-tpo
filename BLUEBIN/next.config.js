/** @type {import('next').NextConfig} */
const nextConfig = {
  // Mobile-first optimizations
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'react-konva'],
  },
  
  // Konva support for canvas functionality
  transpilePackages: ['konva', 'react-konva'],
  
  // Image optimization for mobile
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https', 
        hostname: '*.supabase.in',
        pathname: '/storage/v1/object/public/**',
      }
    ],
  },
  
  // PWA and mobile features
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          // Mobile touch optimization
          {
            key: 'X-Mobile-Optimized',
            value: 'width=device-width, initial-scale=1.0',
          },
        ],
      },
    ]
  },
  
  // Webpack optimizations for mobile bundle size
  webpack: (config, { isServer }) => {
    // Optimize bundle for mobile
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }
    
    // Canvas optimization for Konva
    config.externals = config.externals || []
    config.externals.push({
      canvas: 'canvas',
    })
    
    return config
  },
  
  // Performance optimizations
  swcMinify: true,
  compress: true,
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Mobile-specific redirects
  redirects: async () => {
    return [
      {
        source: '/mobile',
        destination: '/',
        permanent: false,
      },
    ]
  },
}

module.exports = nextConfig