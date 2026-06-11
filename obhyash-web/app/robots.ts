import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://obhyash.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
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
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
