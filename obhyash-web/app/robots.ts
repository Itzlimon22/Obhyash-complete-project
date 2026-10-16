import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://obhyash.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/blog',
          '/blog/',
          '/notes',
          '/notes/',
          '/about-us',
          '/demo',
          '/referral-program',
          '/privacy-policy',
          '/terms-and-conditions',
          '/refund-policy',
          '/login',
          '/signup',
        ],
        disallow: [
          // App Core (Requires Login)
          '/dashboard/',
          '/setup/',
          '/history/',
          '/practice/',
          '/analysis/',
          '/notifications/',
          '/subscription/',
          '/profile/',
          '/settings/',
          '/exam/',
          // Admin & Teacher Dashboards
          '/admin/',
          '/teacher/',
          // API routes
          '/api/',
          // Internal/utility routes
          '/deactivated/',
          '/debug/',
          '/test-upload/',
          '/affiliate/',
        ],
      },
      // Block aggressive AI scrapers & spam bots from draining Serverless CPU quota
      {
        userAgent: [
          'Bytespider',
          'PetalBot',
          'GPTBot',
          'ChatGPT-User',
          'CCBot',
          'anthropic-ai',
          'Claude-Web',
          'ClaudeBot',
          'Amazonbot',
          'SemrushBot',
          'AhrefsBot',
          'MJ12bot',
        ],
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
