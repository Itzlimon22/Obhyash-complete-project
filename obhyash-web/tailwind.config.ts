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
        // --- 🟢 STRICT BRAND PALETTE (1:1 with Flutter AppColors) ---
        brand: {
          50: '#E6F0EC',  // softMint
          100: '#d1fae5',
          500: '#12544F', // viridianForest / brandGreen (Primary)
          600: '#0E4440',
          700: '#092328', // deepMidnightTeal / brandGreenDark
          900: '#06171A',
          teal: '#12544F',
          dark: '#092328',
          mulberry: '#601D49',
          charcoal: '#2C2C2C',
        },
        danger: {
          50: '#fef2f2',  // Soft Rose
          500: '#740A03', // deepCrimson / brandRed
          700: '#520702',
          900: '#3F0502',
        },
        warning: {
          50: '#fffbeb',
          500: '#601D49', // royalMulberry / warningGold
          700: '#471436',
        },
        // --- 🟢 NEW: Custom Dark Backgrounds ---
        obsidian: {
          950: '#020204',
          900: '#0A0A0C',
          800: '#18181B',
          700: '#27272A',
        },
        paper: {
          50: '#fafafa',
          100: '#ffffff',
          200: '#e5e5e5',
          900: '#171717',
        },
        // --- 🟢 Niond Soft Pastel & Neo-Lime Tokens ---
        canvas: {
          DEFAULT: '#f4f5f8',
          dark: '#0d0d0f',
        },
        surface: {
          DEFAULT: '#ffffff',
          dark: '#151515',
        },
        lime: {
          DEFAULT: '#c6f634',
          hover: '#b8ea27',
          ink: '#0f172a',
        },
        niondLime: {
          DEFAULT: '#c6f634',
          hover: '#b8ea27',
          ink: '#0f172a',
        },
        pastel: {
          lavender: '#e0d6ff',
          periwinkle: '#d0e2ff',
          mint: '#c2f2d0',
          'lavender-dark': '#2d224d',
          'periwinkle-dark': '#223552',
          'mint-dark': '#1e3d2b',
        },
        teal: {
          deep: '#0a666b',
          'deep-dark': '#07484b',
        },
        neutral: {
          750: '#212124',
          850: '#17171a',
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
        sans: [
          'var(--font-hind)',
          "'Hind Siliguri'",
          'HindSiliguri',
          'var(--font-inter)',
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        hind: [
          'var(--font-hind)',
          "'Hind Siliguri'",
          'HindSiliguri',
          'sans-serif',
        ],
        HindSiliguri: [
          'var(--font-hind)',
          "'Hind Siliguri'",
          'HindSiliguri',
          'sans-serif',
        ],
        anek: [
          'var(--font-anek)',
          "'Anek Bangla'",
          'var(--font-hind)',
          'sans-serif',
        ],
        bengali: [
          'var(--font-hind)',
          "'Hind Siliguri'",
          'var(--font-inter)',
          'system-ui',
          'sans-serif',
        ],
        noto: [
          'var(--font-inter)',
          'var(--font-noto-sans-bengali)',
          "'Noto Sans Bengali'",
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        'noto-bengali': [
          'var(--font-inter)',
          'var(--font-noto-sans-bengali)',
          "'Noto Sans Bengali'",
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        blog: [
          'var(--font-inter)',
          'var(--font-noto-sans-bengali)',
          "'Noto Sans Bengali'",
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
        math: ['KaTeX_Math', 'KaTeX_Main', 'KaTeX_AMS', 'serif'],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
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
        card: '0 10px 35px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 14px 40px rgba(0, 0, 0, 0.06)',
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
