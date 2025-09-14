/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Simplified for Vercel deployment - remove problematic tracing config
  // outputFileTracingRoot: path.join(__dirname, '../../'),
  
  // Remove standalone output for standard Vercel deployment
  // output: 'standalone',
  
  // Simplified experimental features for Vercel compatibility
  experimental: {
    optimizePackageImports: [
      'lucide-react', 
      '@tanstack/react-query'
    ],
    // Remove potentially problematic experimental features
    // webpackBuildWorker: true,
    // optimizeServerReact: true,
    scrollRestoration: true,
  },

  // Remove turbopack config that can cause deployment issues
  // turbopack: {
  //   rules: {
  //     '*.svg': {
  //       loaders: ['@svgr/webpack'],
  //       as: '*.js',
  //     },
  //   },
  // },

  // Image optimization
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https', 
        hostname: '*.supabase.com',
        port: '',
        pathname: '/storage/v1/object/public/**',
      }
    ],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 3600, // 1 hour
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // PWA and Service Worker
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        canvas: false, // Fix for Konva
      }
    }
    
    // Fix for Konva canvas module resolution - only in development
    if (process.env.NODE_ENV === 'development') {
      config.externals = config.externals || []
      config.externals.push({
        canvas: 'canvas',
      })
    }

    // Optimize bundle splitting with more granular chunks
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: 25,
        maxAsyncRequests: 25,
        cacheGroups: {
          // Large UI libraries
          radixui: {
            test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
            name: 'radix-ui',
            priority: 20,
            chunks: 'all',
          },
          // Canvas and graphics libraries
          graphics: {
            test: /[\\/]node_modules[\\/](konva|react-konva|fabric|html2canvas)[\\/]/,
            name: 'graphics',
            priority: 20,
            chunks: 'all',
          },
          // Query and state management
          query: {
            test: /[\\/]node_modules[\\/](@tanstack|zustand|immer)[\\/]/,
            name: 'query-state',
            priority: 20,
            chunks: 'all',
          },
          // Animation libraries
          animations: {
            test: /[\\/]node_modules[\\/](framer-motion|react-spring)[\\/]/,
            name: 'animations',
            priority: 20,
            chunks: 'all',
          },
          // Supabase
          supabase: {
            test: /[\\/]node_modules[\\/]@supabase[\\/]/,
            name: 'supabase',
            priority: 20,
            chunks: 'all',
          },
          // Generic vendor chunk for smaller libraries
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            chunks: 'all',
          },
          // Common application code
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'all',
            enforce: true,
          },
        },
      },
      // Better module concatenation
      concatenateModules: true,
      // Remove empty chunks
      removeEmptyChunks: true,
      // Merge duplicate chunks
      mergeDuplicateChunks: true,
    }

    return config
  },

  // Compression and optimization
  compress: true,
  poweredByHeader: false,
  generateEtags: true,

  // Output optimization for production
  // Standalone output is handled by the 'output' configuration above
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://*.supabase.com; font-src 'self' data:; worker-src 'self' blob:;"
          }
        ]
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate'
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=300' // 5 minutes
          }
        ]
      }
    ]
  },

  // Caching configuration
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/sw.js',
          destination: '/sw.js'
        }
      ]
    }
  },

  // Environment-specific configurations
  env: {
    NEXT_PUBLIC_APP_VERSION: process.env.npm_package_version || '1.0.0',
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    ignoreDuringBuilds: false, // Allow warnings, only fail on errors
    dirs: ['src'], // Only lint src directory during builds
  },


  // Monitoring and analytics
  async redirects() {
    return [
      {
        source: '/health',
        destination: '/api/health',
        permanent: false,
      }
    ]
  }
}

module.exports = nextConfig