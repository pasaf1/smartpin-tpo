/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  // Simplified for Vercel deployment - remove problematic tracing config
  // outputFileTracingRoot: path.join(__dirname, '../../'),
  
  // Remove standalone output for standard Vercel deployment
  // output: 'standalone',
  
  // Prevent Konva from loading on server - SSR fix (Next.js 15 uses serverExternalPackages)
  serverExternalPackages: ['konva', 'react-konva', 'canvas'],

  // Simplified experimental features for Vercel compatibility
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query'
    ],
    scrollRestoration: true,
    // Konva-specific optimizations
    webpackBuildWorker: process.env.NODE_ENV === 'production',
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
    
    // Fix for Konva canvas module resolution - all environments for Vercel
    config.externals = config.externals || []
    config.externals.push({
      canvas: 'canvas',
      'node-canvas': 'node-canvas',
    })

    // Konva-specific optimizations for Vercel
    config.resolve.alias = {
      ...config.resolve.alias,
      // Optimize Konva imports
      'konva/lib/shapes': 'konva/lib/shapes/index.js',
      'konva/lib/filters': 'konva/lib/filters/index.js',
    }

    // Edge runtime compatibility
    if (process.env.VERCEL_ENV || process.env.VERCEL) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        canvas: false,
        'node-canvas': false,
      }
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
          // Canvas and graphics libraries - optimized for Vercel
          konva: {
            test: /[\\/]node_modules[\\/](konva|react-konva)[\\/]/,
            name: 'konva',
            priority: 30,
            chunks: 'all',
            enforce: true,
            maxSize: 250000, // 250KB limit for better loading
          },
          graphics: {
            test: /[\\/]node_modules[\\/](fabric|html2canvas)[\\/]/,
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
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://*.supabase.com wss://*.supabase.co wss://*.supabase.com https://vercel.live; font-src 'self' data:; worker-src 'self' blob:;"
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
    // Konva performance optimizations
    NEXT_PUBLIC_KONVA_PERFORMANCE_MODE: process.env.NODE_ENV === 'production' ? 'true' : 'false',
    NEXT_PUBLIC_ENABLE_CANVAS_OPTIMIZATION: 'true',
    NEXT_PUBLIC_KONVA_PIXEL_RATIO: process.env.NODE_ENV === 'production' ? '2' : 'auto',
    NEXT_PUBLIC_KONVA_MAX_MEMORY_MB: process.env.VERCEL ? '50' : '100',
    NEXT_PUBLIC_ENABLE_VIEWPORT_CULLING: 'true',
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