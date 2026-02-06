import type { Config } from 'tailwindcss';

const config = {
  darkMode: ['class', '.dark'], // ✅ Preserved existing dark mode config
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // --- 🟢 NEW: Brand Colors ---
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          900: '#312e81',
        },
        // --- 🟢 NEW: Custom Dark Backgrounds ---
        obsidian: {
          950: '#020204',
          900: '#0A0A0C',
          800: '#18181B',
          700: '#27272A',
        },
        // --- 🟢 NEW: Custom Light Backgrounds ---
        paper: {
          50: '#fafafa',
          100: '#ffffff',
          200: '#e5e5e5',
          900: '#171717',
        },

        // --- 🔵 EXISTING: Shadcn Colors ---
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      fontFamily: {
        // --- 🟢 NEW: Font Integration ---
        sans: ['var(--font-hind)', 'var(--font-inter)', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // --- 🟢 NEW: Custom Shadows ---
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
        glow: '0 0 15px rgba(99, 102, 241, 0.15)',
        subtle: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        // --- 🟢 NEW: Fade In Animation ---
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // --- 🟢 NEW: Fade In Animation ---
        'fade-in': 'fadeIn 0.5s ease-out forwards',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;

export default config;
