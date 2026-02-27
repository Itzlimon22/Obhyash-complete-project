import type { Metadata } from 'next';
import { blogPosts, getFeaturedPost, BLOG_CATEGORIES } from '@/lib/blog-data';
import BlogListingClient from '@/components/blog/BlogListingClient';

export const metadata: Metadata = {
  title: 'Obhyash Blog — Study Tips, Exam Strategies & More for Students',
  description:
    'Discover expert study tips, MCQ solving techniques, SSC & HSC exam preparation guides, and time management strategies to help you score higher. Written by the Obhyash education team.',
  alternates: {
    canonical: 'https://obhyash.com/blog',
  },
  openGraph: {
    title: 'Obhyash Blog — Study Tips & Exam Strategies',
    description:
      'Expert study tips, MCQ techniques, SSC & HSC exam strategies for Bangladeshi students.',
    url: 'https://obhyash.com/blog',
    type: 'website',
  },
};

export default function BlogPage() {
  const featured = getFeaturedPost();
  const allPosts = blogPosts;

  return (
    <BlogListingClient
      posts={allPosts}
      featuredPost={featured}
      categories={BLOG_CATEGORIES}
    />
  );
}
