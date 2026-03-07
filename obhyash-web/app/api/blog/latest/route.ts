import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog-data';

export async function GET() {
  try {
    const allPosts = await getAllPosts();
    // Return the latest 6 posts for the marquee
    const latestPosts = allPosts.slice(0, 6);

    // Data is already deduplicated via unstable_cache (revalidate: 3600)
    // Mirror that TTL in the HTTP layer so CDNs/browsers respect it
    return NextResponse.json(latestPosts, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
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
