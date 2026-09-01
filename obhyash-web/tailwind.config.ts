import type { Config } from 'tailwindcss';

const config = {
  darkMode: 'class', // ✅ Standard Tailwind class-based dark mode
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
        // --- 🟢 STRICT BRAND PALETTE ---
        brand: {
          50: '#ecfdf5',  // Soft Mint (Backgrounds)
          100: '#d1fae5',
          500: '#047857', // Primary Deep Green
          600: '#065f46',
          700: '#064e3b',
          900: '#022c22',
        },
        danger: {
          50: '#fef2f2',  // Soft Rose (Backgrounds)
          500: '#b91c1c', // Primary Deep Red
          700: '#991b1b',
          900: '#450a0a',
        },
        warning: {
          50: '#fffbeb',
          500: '#f59e0b', // Primary Warm Gold
          700: '#b45309',
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
        sans: ['var(--font-anek)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        anek: ['var(--font-anek)', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        bengali: ['var(--font-anek)', 'system-ui', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      boxShadow: {
        // --- 🟢 NEW: Custom Shadows ---
        glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
        glow: '0 0 15px rgba(4, 120, 87, 0.15)',
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
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.8', transform: 'scale(1.05)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        // --- 🟢 NEW: Fade In Animation ---
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate'), require('@tailwindcss/typography')],
} satisfies Config;

export default config;
