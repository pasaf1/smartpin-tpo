// SmartPin TPO Design System
// Based on construction industry requirements with accessibility and clarity

export const designTokens = {
  // Brand Colors
  colors: {
    brand: {
      primary: '#2563EB', // Blue 600 - Trust, reliability
      secondary: '#7C3AED', // Violet 600 - Innovation
      accent: '#059669', // Emerald 600 - Success, completion
    },
    
    // Status Colors (High contrast for visibility)
    status: {
      open: '#DC2626', // Red 600 - Critical attention needed
      ready: '#D97706', // Amber 600 - Ready for inspection
      closed: '#059669', // Emerald 600 - Completed
      
      // Severity levels
      critical: '#DC2626', // Red 600
      high: '#EA580C', // Orange 600
      medium: '#D97706', // Amber 600
      low: '#65A30D', // Lime 600
    },
    
    // Pin Colors (Parent/Child differentiation)
    pins: {
      parent: {
        fill: '#2563EB',
        stroke: '#1D4ED8',
        hover: '#3B82F6',
      },
      child: {
        fill: '#7C3AED',
        stroke: '#6D28D9',
        hover: '#8B5CF6',
      },
    },
    
    // Background & Surface
    background: {
      primary: '#FFFFFF',
      secondary: '#F8FAFC', // Slate 50
      tertiary: '#F1F5F9', // Slate 100
      inverse: '#0F172A', // Slate 900
    },
    
    // Text Colors
    text: {
      primary: '#0F172A', // Slate 900
      secondary: '#475569', // Slate 600
      tertiary: '#94A3B8', // Slate 400
      inverse: '#FFFFFF',
      accent: '#2563EB',
    },
    
    // Border & Divider
    border: {
      default: '#E2E8F0', // Slate 200
      strong: '#CBD5E1', // Slate 300
      interactive: '#2563EB',
    },
  },
  
  // Typography Scale
  typography: {
    fontFamily: {
      sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
    },
    
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }], // 12px
      sm: ['0.875rem', { lineHeight: '1.25rem' }], // 14px
      base: ['1rem', { lineHeight: '1.5rem' }], // 16px
      lg: ['1.125rem', { lineHeight: '1.75rem' }], // 18px
      xl: ['1.25rem', { lineHeight: '1.75rem' }], // 20px
      '2xl': ['1.5rem', { lineHeight: '2rem' }], // 24px
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    },
    
    fontWeight: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
  },
  
  // Spacing System (8px grid)
  spacing: {
    px: '1px',
    0.5: '0.125rem', // 2px
    1: '0.25rem', // 4px
    1.5: '0.375rem', // 6px
    2: '0.5rem', // 8px
    2.5: '0.625rem', // 10px
    3: '0.75rem', // 12px
    3.5: '0.875rem', // 14px
    4: '1rem', // 16px
    5: '1.25rem', // 20px
    6: '1.5rem', // 24px
    7: '1.75rem', // 28px
    8: '2rem', // 32px
    9: '2.25rem', // 36px
    10: '2.5rem', // 40px
    11: '2.75rem', // 44px
    12: '3rem', // 48px
    14: '3.5rem', // 56px
    16: '4rem', // 64px
    20: '5rem', // 80px
    24: '6rem', // 96px
    28: '7rem', // 112px
    32: '8rem', // 128px
  },
  
  // Border Radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem', // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem', // 8px
    xl: '0.75rem', // 12px
    '2xl': '1rem', // 16px
    '3xl': '1.5rem', // 24px
    full: '9999px',
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
  },
  
  // Z-Index Scale
  zIndex: {
    auto: 'auto',
    0: '0',
    10: '10',
    20: '20',
    30: '30',
    40: '40',
    50: '50',
    drawer: '100',
    modal: '200',
    tooltip: '300',
    toast: '400',
  },
  
  // Pin Sizes (Parent/Child differentiation)
  pins: {
    parent: {
      size: '24px',
      fontSize: '14px',
      strokeWidth: '2px',
    },
    child: {
      size: '16px',
      fontSize: '10px',
      strokeWidth: '1.5px',
    },
    
    // Interactive states
    hover: {
      scale: '1.1',
      transition: '150ms ease-in-out',
    },
    
    selected: {
      scale: '1.15',
      glow: '0 0 0 3px rgb(37 99 235 / 0.3)',
    },
  },
  
  // Animation & Transitions
  animation: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    
    easing: {
      DEFAULT: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0.0, 1, 1)',
      out: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
  
  // Breakpoints (Mobile-first approach)
  screens: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const

// Type definitions for design tokens
export type DesignTokens = typeof designTokens
export type ColorToken = keyof typeof designTokens.colors
export type SpacingToken = keyof typeof designTokens.spacing
export type FontSizeToken = keyof typeof designTokens.typography.fontSize

// Utility function to get design token values
export function getToken<T extends keyof DesignTokens>(
  category: T,
  token: keyof DesignTokens[T]
): DesignTokens[T][keyof DesignTokens[T]] {
  return designTokens[category][token]
}

// CSS Custom Properties for runtime access
export const cssVariables = {
  '--color-brand-primary': designTokens.colors.brand.primary,
  '--color-brand-secondary': designTokens.colors.brand.secondary,
  '--color-brand-accent': designTokens.colors.brand.accent,
  '--color-status-open': designTokens.colors.status.open,
  '--color-status-ready': designTokens.colors.status.ready,
  '--color-status-closed': designTokens.colors.status.closed,
  '--pin-parent-size': designTokens.pins.parent.size,
  '--pin-child-size': designTokens.pins.child.size,
  '--animation-duration-fast': designTokens.animation.duration.fast,
  '--animation-duration-normal': designTokens.animation.duration.normal,
  '--animation-easing-default': designTokens.animation.easing.DEFAULT,
} as const