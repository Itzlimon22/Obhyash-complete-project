import type { NextConfig } from 'next';
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  outputFileTracingExcludes: {
    '*': [
      './obhyash-flutter/**',
      './output_pdfs/**',
      './docs/**',
      './scripts/**',
      './sql/**',
      './backups/**',
      './scratch/**',
    ],
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
      'recharts',
      'framer-motion',
      'date-fns',
      '@tiptap/react',
      '@tiptap/starter-kit',
      'lucide-react',
      'sonner',
    ],
  },

  async redirects() {
    return [
      // Old /privacy-policy slug → new canonical public /privacy page
      {
        source: '/privacy-policy',
        destination: '/privacy',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/register',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/reset-password',
        destination: '/forgot-password?type=recovery',
        permanent: false,
      },
      // Blog Consolidation & Cannibalization 301 Redirects
      {
        source: '/blog/hsc-3-month-study-routine',
        destination: '/blog/hsc-2026-last-3-month-revision-routine',
        permanent: true,
      },
      {
        source: '/blog/medical-admission-2026-27',
        destination: '/blog/medical-admission-circular-2026-guide',
        permanent: true,
      },
      {
        source: '/blog/buet-admission-preparation-guideline',
        destination: '/blog/buet-admission-2026-27',
        permanent: true,
      },
      {
        source: '/blog/gst-cluster-admission-circular-2026',
        destination: '/blog/gst-admission-2026-27',
        permanent: true,
      },
    ];
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
      "script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dicebear.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://cloudflareinsights.com https://*.cloudflareinsights.com",
      "media-src 'self' https:",
      "frame-src 'self'",
      "frame-ancestors 'self'",
      "object-src 'none'",
      "base-uri 'self'",
    ].join('; ');

    // Relaxed CSP for blog post pages — Mermaid requires unsafe-eval for diagram parsing
    const blogCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com https://static.cloudflareinsights.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https: http:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.dicebear.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://cloudflareinsights.com https://*.cloudflareinsights.com",
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

      // ── Cache-Control & Edge CDN Caching ───────────────────────────
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
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=86400',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=2592000, stale-while-revalidate=86400',
          },
        ],
      },
      // Public static files & favicon/icons
      {
        source: '/(favicon.ico|icon.svg|icon-512.png|icon.png|og-image.png|robots.txt|sitemap.xml)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=2592000, stale-while-revalidate=2592000',
          },
        ],
      },
      // Public auth & feature 3D icons (immutable images)
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=31536000, immutable',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=31536000, immutable',
          },
        ],
      },
      // Landing page — Edge cached globally (0ms compute)
      {
        source: '/',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      // Blog post pages — Edge cached globally (zero compute & zero ISR writes on repeat hits)
      {
        source: '/blog/:slug+',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      // Blog listing & search routes
      {
        source: '/blog',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      {
        source: '/blog/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      // Notes hub & notes pages
      {
        source: '/notes/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      // Static public info pages
      {
        source: '/(faq|privacy|privacy-policy|terms|terms-and-conditions|refund|refund-policy|about-us|referral-program)(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=604800, stale-while-revalidate=2592000',
          },
        ],
      },
      // Authenticated student routes — all contain user-specific content
      {
        source:
          '/(dashboard|practice|profile|settings|history|notifications|subscription|analysis|complaint|feature-requests|referral|setup|leaderboard)(.*)',
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
      // Default API routes — no-store for dynamic/authenticated APIs
      {
        source: '/api/((?!blog/latest|blog/search|blog/likes|referral/leaderboard|leaderboard).*)',
        headers: [{ key: 'Cache-Control', value: 'no-store' }],
      },
      // High-traffic public blog & referral APIs cached aggressively on Vercel Edge CDN (0ms compute)
      {
        source: '/api/blog/latest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/api/blog/search',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/api/blog/likes',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/api/referral/leaderboard',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/api/leaderboard/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
          },
          {
            key: 'CDN-Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
          {
            key: 'Vercel-CDN-Cache-Control',
            value: 'public, s-maxage=3600, stale-while-revalidate=86400',
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
