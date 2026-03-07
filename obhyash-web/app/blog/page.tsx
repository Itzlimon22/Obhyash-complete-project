import type { Metadata } from 'next';
import { Suspense } from 'react';

import {
  getAllPosts,
  getFeaturedPost,
  BLOG_CATEGORIES,
  BlogPost,
} from '@/lib/blog-data';
import BlogListingClient from '@/components/blog/BlogListingClient';
import { createClient } from '@/utils/supabase/server';
import {
  getAdvancedRecommendations,
  getMostViewedPosts,
  getBlogPostCounts,
} from '@/lib/blog-recommendations';

// Personalised per user (recommendations differ for known vs. guest users)
export const dynamic = 'force-dynamic';

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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let recommendedPosts: BlogPost[] = [];
  let isGuest = true;

  try {
    if (user) {
      isGuest = false;
      recommendedPosts = await getAdvancedRecommendations(null, user.id);
    } else {
      recommendedPosts = await getMostViewedPosts();
    }
  } catch (error) {
    console.error('Failed to load recommended posts:', error);
  }

  const allSlugs = allPosts.map((p) => p.slug);
  const postCounts = await getBlogPostCounts(allSlugs);

  return (
    <Suspense>
      <BlogListingClient
        posts={allPosts}
        featuredPost={featured}
        categories={BLOG_CATEGORIES}
        recommendedPosts={recommendedPosts}
        isGuest={isGuest}
        postCounts={postCounts}
      />
    </Suspense>
  );
}
