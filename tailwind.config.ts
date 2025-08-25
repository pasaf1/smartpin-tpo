import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        
        // Construction Industry Premium Colors
        construction: {
          50: "hsl(210, 100%, 98%)",
          100: "hsl(210, 100%, 95%)",
          200: "hsl(210, 100%, 88%)",
          300: "hsl(210, 100%, 78%)",
          400: "hsl(210, 100%, 65%)",
          500: "hsl(210, 100%, 50%)",
          600: "hsl(210, 85%, 43%)",
          700: "hsl(210, 75%, 36%)",
          800: "hsl(210, 65%, 30%)",
          900: "hsl(210, 55%, 25%)",
          950: "hsl(210, 60%, 15%)",
        },
        
        steel: {
          50: "hsl(220, 15%, 98%)",
          100: "hsl(220, 15%, 95%)",
          200: "hsl(220, 15%, 88%)",
          300: "hsl(220, 15%, 78%)",
          400: "hsl(220, 15%, 65%)",
          500: "hsl(220, 15%, 50%)",
          600: "hsl(220, 20%, 40%)",
          700: "hsl(220, 25%, 32%)",
          800: "hsl(220, 30%, 25%)",
          900: "hsl(220, 35%, 20%)",
          950: "hsl(220, 40%, 12%)",
        },
        
        safety: {
          50: "hsl(30, 100%, 98%)",
          100: "hsl(30, 95%, 94%)",
          200: "hsl(30, 95%, 85%)",
          300: "hsl(30, 95%, 73%)",
          400: "hsl(30, 95%, 60%)",
          500: "hsl(30, 95%, 50%)",
          600: "hsl(30, 85%, 45%)",
          700: "hsl(30, 75%, 38%)",
          800: "hsl(30, 65%, 32%)",
          900: "hsl(30, 55%, 26%)",
          950: "hsl(30, 60%, 18%)",
        },
        
        danger: {
          50: "hsl(0, 86%, 97%)",
          100: "hsl(0, 93%, 94%)",
          200: "hsl(0, 96%, 89%)",
          300: "hsl(0, 94%, 82%)",
          400: "hsl(0, 91%, 71%)",
          500: "hsl(0, 84%, 60%)",
          600: "hsl(0, 72%, 51%)",
          700: "hsl(0, 74%, 42%)",
          800: "hsl(0, 70%, 35%)",
          900: "hsl(0, 63%, 31%)",
          950: "hsl(0, 75%, 15%)",
        },
        
        success: {
          50: "hsl(142, 76%, 96%)",
          100: "hsl(142, 71%, 91%)",
          200: "hsl(142, 69%, 83%)",
          300: "hsl(142, 69%, 70%)",
          400: "hsl(142, 69%, 58%)",
          500: "hsl(142, 71%, 45%)",
          600: "hsl(142, 76%, 36%)",
          700: "hsl(142, 72%, 29%)",
          800: "hsl(142, 64%, 24%)",
          900: "hsl(142, 61%, 20%)",
          950: "hsl(142, 69%, 10%)",
        },
        
        warning: {
          50: "hsl(48, 100%, 96%)",
          100: "hsl(48, 96%, 89%)",
          200: "hsl(48, 97%, 77%)",
          300: "hsl(48, 96%, 64%)",
          400: "hsl(48, 96%, 53%)",
          500: "hsl(48, 96%, 45%)",
          600: "hsl(43, 96%, 38%)",
          700: "hsl(37, 92%, 31%)",
          800: "hsl(32, 81%, 29%)",
          900: "hsl(28, 73%, 26%)",
          950: "hsl(25, 83%, 14%)",
        },

        // Luxury Design System Colors
        luxury: {
          50: "hsl(210, 40%, 98%)",
          100: "hsl(210, 40%, 95%)",
          200: "hsl(214, 32%, 91%)",
          300: "hsl(213, 27%, 84%)",
          400: "hsl(215, 20%, 65%)",
          500: "hsl(215, 16%, 47%)",
          600: "hsl(215, 19%, 35%)",
          700: "hsl(215, 25%, 27%)",
          800: "hsl(217, 33%, 17%)",
          900: "hsl(222, 84%, 5%)",
        },

        gold: {
          50: "hsl(48, 100%, 96%)",
          100: "hsl(48, 96%, 89%)",
          200: "hsl(48, 97%, 77%)",
          300: "hsl(46, 97%, 65%)",
          400: "hsl(43, 96%, 56%)",
          500: "hsl(38, 92%, 50%)",
          600: "hsl(32, 95%, 44%)",
          700: "hsl(26, 90%, 37%)",
          800: "hsl(23, 83%, 31%)",
          900: "hsl(22, 78%, 26%)",
          950: "hsl(15, 86%, 15%)",
        },
      },
      
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        "3d": "0.75rem",
        "premium": "1rem",
        "card": "1.25rem",
      },
      
      boxShadow: {
        // Neumorphic Shadows
        "neu-sm": "4px 4px 8px rgba(0, 0, 0, 0.1), -4px -4px 8px rgba(255, 255, 255, 0.8)",
        "neu-md": "6px 6px 12px rgba(0, 0, 0, 0.15), -6px -6px 12px rgba(255, 255, 255, 0.8)",
        "neu-lg": "8px 8px 16px rgba(0, 0, 0, 0.2), -8px -8px 16px rgba(255, 255, 255, 0.8)",
        "neu-inset-sm": "inset 2px 2px 4px rgba(0, 0, 0, 0.1), inset -2px -2px 4px rgba(255, 255, 255, 0.8)",
        "neu-inset-md": "inset 4px 4px 8px rgba(0, 0, 0, 0.15), inset -4px -4px 8px rgba(255, 255, 255, 0.8)",
        
        // Glass Morphism Shadows
        "glass-sm": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)",
        "glass-md": "0 8px 16px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -4px rgba(0, 0, 0, 0.1)",
        "glass-lg": "0 16px 32px -8px rgba(0, 0, 0, 0.15), 0 8px 16px -8px rgba(0, 0, 0, 0.1)",
        
        // Construction Themed Shadows
        "construction-sm": "0 2px 4px rgba(37, 99, 235, 0.1), 0 1px 2px rgba(37, 99, 235, 0.06)",
        "construction-md": "0 4px 8px rgba(37, 99, 235, 0.15), 0 2px 4px rgba(37, 99, 235, 0.1)",
        "construction-lg": "0 8px 16px rgba(37, 99, 235, 0.2), 0 4px 8px rgba(37, 99, 235, 0.15)",
        
        // 3D Effect Shadows
        "sm-3d": "0 2px 4px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        "md-3d": "0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        "lg-3d": "0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        "xl-3d": "0 12px 24px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.3)",
        
        // Interactive Shadows
        "hover-sm": "0 4px 8px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08)",
        "hover-md": "0 8px 16px rgba(0, 0, 0, 0.15), 0 4px 8px rgba(0, 0, 0, 0.1)",
        "hover-lg": "0 12px 24px rgba(0, 0, 0, 0.2), 0 6px 12px rgba(0, 0, 0, 0.15)",
        
        // Focus Shadows
        "focus-construction": "0 0 0 4px rgba(37, 99, 235, 0.1), 0 2px 4px rgba(0, 0, 0, 0.1)",

        // Luxury Shadows from HTML
        "luxury": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        "luxury-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        "luxury-xl": "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        "luxury-3d": "0 15px 35px rgba(0, 0, 0, 0.1), 0 5px 15px rgba(0, 0, 0, 0.07), inset 0 1px 0 rgba(255, 255, 255, 0.9), inset 0 -1px 0 rgba(0, 0, 0, 0.05)",
      },
      
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "bounce-subtle": "bounce-subtle 2s infinite",
        "pulse-glow": "pulse-glow 2s infinite",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "scale-in": "scale-in 0.2s ease-out",
        "pulse-highlight": "pulse-highlight 2s infinite",
      },
      
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "bounce-subtle": {
          "0%, 20%, 53%, 80%, 100%": {
            transform: "translate3d(0,0,0)",
          },
          "40%, 43%": {
            transform: "translate3d(0,-5px,0)",
          },
          "70%": {
            transform: "translate3d(0,-3px,0)",
          },
          "90%": {
            transform: "translate3d(0,-1px,0)",
          },
        },
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            transform: "scale(1)",
          },
          "50%": {
            opacity: "0.8",
            transform: "scale(1.05)",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
            transform: "translateY(10px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "slide-up": {
          from: {
            opacity: "0",
            transform: "translateY(20px)",
          },
          to: {
            opacity: "1",
            transform: "translateY(0)",
          },
        },
        "scale-in": {
          from: {
            opacity: "0",
            transform: "scale(0.95)",
          },
          to: {
            opacity: "1",
            transform: "scale(1)",
          },
        },
        "pulse-highlight": {
          "0%, 100%": { 
            transform: "scale(1)", 
            boxShadow: "0 0 0 0 rgba(251, 191, 36, 0.7)" 
          },
          "50%": { 
            transform: "scale(1.1)", 
            boxShadow: "0 0 0 10px rgba(251, 191, 36, 0)" 
          },
        },
      },
      
      transitionTimingFunction: {
        "construction": "cubic-bezier(0.4, 0.0, 0.2, 1)",
        "bounce-construction": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      
      backdropBlur: {
        xs: "2px",
      },
      
      scale: {
        "102": "1.02",
        "105": "1.05",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config