import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
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
  experimental: {},
};

export default nextConfig;
