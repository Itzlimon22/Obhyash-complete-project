import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog-data';

export const revalidate = 86400;

export async function GET() {
  try {
    const allPosts = await getAllPosts();
    // Return the latest 6 posts for the marquee
    const latestPosts = allPosts.slice(0, 6);

    // Aggressive Edge CDN caching: served instantly from Vercel Edge POPs with 0ms compute time
    return NextResponse.json(latestPosts, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
        'Vercel-CDN-Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  } catch (error) {
    console.error('Failed to fetch latest blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 },
    );
  }
}
