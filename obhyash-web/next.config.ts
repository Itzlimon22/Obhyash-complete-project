import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.google.com',
      },
      {
        protocol: 'https',
        hostname: '*.r2.dev',
      },
      {
        protocol: 'https',
        hostname: 'ufeepgzheopyaefuyegg.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      // Notion-hosted images (uploaded files & page covers)
      {
        protocol: 'https',
        hostname: 'prod-files-secure.s3.us-east-1.amazonaws.com',
      },
      {
        protocol: 'https',
        hostname: '*.amazonaws.com',
      },
      // Unsplash (commonly used as Notion cover sources)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      // Notion CDN
      {
        protocol: 'https',
        hostname: 'www.notion.so',
      },
      {
        protocol: 'https',
        hostname: 'notion.so',
      },
    ],
  },
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'framer-motion',
      'date-fns',
      '@tiptap/react',
      '@tiptap/starter-kit',
    ],
  },

  async headers() {
    const commonHeaders = [
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=()',
      },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
    ];

    // Strict CSP — no unsafe-eval — applied to all routes except blog post pages
    const strictCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dicebear.com",
      "media-src 'self' https:",
      "frame-src 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ');

    // Relaxed CSP for blog post pages — Mermaid requires unsafe-eval for diagram parsing
    const blogCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dicebear.com",
      "media-src 'self' https:",
      "frame-src 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ');

    return [
      // ── Security headers (CSP) ──────────────────────────────────────
      // Blog post pages: allow unsafe-eval for Mermaid diagram rendering
      {
        source: '/blog/:slug*',
        headers: [
          ...commonHeaders,
          { key: 'Content-Security-Policy', value: blogCsp },
        ],
      },
      // All other routes: strict CSP without unsafe-eval
      {
        source: '/((?!blog).*)',
        headers: [
          ...commonHeaders,
          { key: 'Content-Security-Policy', value: strictCsp },
        ],
      },

      // ── Cache-Control ───────────────────────────────────────────────
      // Next.js static assets have content hashes in their filenames — safe to cache forever
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // Next.js image optimisation responses
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=3600',
          },
        ],
      },
      // Landing page (middleware redirects authenticated users before this renders)
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      // Blog post pages — ISR aligned with unstable_cache revalidate: 3600
      {
        source: '/blog/:slug+',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
      // Static public info pages
      {
        source: '/(faq|privacy|terms|refund|referral-program)(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=3600',
          },
        ],
      },
      // Blog listing — personalised recommendations differ per user; must NOT be CDN-cached
      {
        source: '/blog',
        headers: [{ key: 'Cache-Control', value: 'private, no-store' }],
      },
      // Authenticated student routes — all contain user-specific content
      {
        source:
          '/(dashboard|practice|profile|settings|history|notifications|subscription|analysis|complaint|referral|setup|leaderboard)(.*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      // Admin routes — must never be served from cache
      {
        source: '/admin(.*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      // Teacher routes — must never be served from cache
      {
        source: '/teacher(.*)',
        headers: [
          { key: 'Cache-Control', value: 'private, no-store' },
          { key: 'Pragma', value: 'no-cache' },
        ],
      },
      // API routes — no-store by default; individual routes may override via NextResponse headers
      {
        source: '/api/(.*)',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
