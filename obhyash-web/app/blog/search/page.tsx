import type { Metadata } from 'next';
import { Suspense } from 'react';
import { getAllPosts } from '@/lib/blog-data';
import { getBlogPostCounts } from '@/lib/blog-recommendations';
import BlogSearchPage from '@/components/blog/BlogSearchPage';

export const metadata: Metadata = {
  title: 'আর্টিকেল খুঁজুন — Obhyash Blog',
  description:
    'সকল ব্লগ আর্টিকেলে শিরোনাম, ট্যাগ, বিষয় বা লেখকের নাম দিয়ে অনুসন্ধান করুন।',
  robots: { index: false },
};

export default async function BlogSearchRoute() {
  const allPosts = await getAllPosts();
  const postCounts = await getBlogPostCounts(allPosts.map((p) => p.slug));

  return (
    <Suspense>
      <BlogSearchPage posts={allPosts} postCounts={postCounts} />
    </Suspense>
  );
}
