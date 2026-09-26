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
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
