import { NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog-data';

export async function GET() {
  try {
    const allPosts = await getAllPosts();
    // Return the latest 6 posts for the marquee
    const latestPosts = allPosts.slice(0, 6);

    return NextResponse.json(latestPosts);
  } catch (error) {
    console.error('Failed to fetch latest blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 },
    );
  }
}
