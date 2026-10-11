import type { Metadata } from 'next';
import { Suspense } from 'react';

import {
  getAllPosts,
  getFeaturedPost,
  BLOG_CATEGORIES,
} from '@/lib/blog-data';
import BlogListingClient from '@/components/blog/BlogListingClient';
import {
  getMostViewedPosts,
  getBlogPostCounts,
} from '@/lib/blog-recommendations';

// Fully public, statically generated with ISR (revalidates once per hour in background)
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Obhyash Blog — Study Tips, Exam Strategies & More for Students',
  description:
    'Discover expert study tips, MCQ solving techniques, SSC & HSC exam preparation guides, and time management strategies to help you score higher. Written by the Obhyash education team.',
  alternates: {
    canonical: 'https://obhyash.com/blog',
    types: {
      'application/rss+xml': 'https://obhyash.com/blog/rss.xml',
    },
  },
  openGraph: {
    title: 'Obhyash Blog — Study Tips & Exam Strategies',
    description:
      'Expert study tips, MCQ techniques, SSC & HSC exam strategies for Bangladeshi students.',
    url: 'https://obhyash.com/blog',
    type: 'website',
  },
};

export default async function BlogPage() {
  const featured = await getFeaturedPost();
  const allPosts = await getAllPosts();

  // Public recommendations based on trending/most viewed posts (no auth check needed)
  let recommendedPosts = [];
  try {
    recommendedPosts = await getMostViewedPosts();
  } catch (error) {
    console.error('Failed to load recommended posts:', error);
    recommendedPosts = allPosts.slice(0, 3);
  }

  const allSlugs = allPosts.map((p) => p.slug);
  let postCounts = {};
  try {
    postCounts = await getBlogPostCounts(allSlugs);
  } catch {
    // Graceful fallback
  }

  return (
    <Suspense>
      <BlogListingClient
        posts={allPosts}
        featuredPost={featured}
        categories={BLOG_CATEGORIES}
        recommendedPosts={recommendedPosts}
        isGuest={true}
        postCounts={postCounts}
      />
    </Suspense>
  );
}
