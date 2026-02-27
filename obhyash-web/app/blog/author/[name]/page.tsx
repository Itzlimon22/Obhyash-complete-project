import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getAllPosts, BlogPost } from '@/lib/blog-data';
import BlogCard from '@/components/blog/BlogCard';
import { PencilLine, BookOpen } from 'lucide-react';

export async function generateMetadata({
  params,
}: {
  params: { name: string };
}): Promise<Metadata> {
  const decodedName = decodeURIComponent(params.name).replace(/\+/g, ' ');
  return {
    title: `${decodedName} - Author Profile | Obhyash Blog`,
    description: `Read all articles and study tips written by ${decodedName} on Obhyash.`,
  };
}

// ISR Revalidation
export const revalidate = 3600;

export default async function AuthorProfilePage({
  params,
}: {
  params: { name: string };
}) {
  const decodedName = decodeURIComponent(params.name)
    .replace(/\+/g, ' ')
    .trim();
  const allPosts = await getAllPosts();

  // Find all posts by this precise author name
  const authorPosts = allPosts.filter(
    (post) =>
      post.author.name.trim().toLowerCase() === decodedName.toLowerCase(),
  );

  // If this author doesn't exist or has 0 posts, show 404
  if (authorPosts.length === 0) {
    notFound();
  }

  // Extract author info from their first post
  const authorInfo = authorPosts[0].author;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-black font-anek">
      {/* ─── Hero Section ─── */}
      <section className="bg-white dark:bg-[#121212] border-b border-slate-200 dark:border-[#2b2b2b] pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-500 to-rose-700 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-xl shadow-rose-500/20 mb-6 border-4 border-white dark:border-[#121212]">
            {authorInfo.initials}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            {authorInfo.name}
          </h1>

          <p className="text-lg font-medium text-rose-600 dark:text-rose-400 mb-6">
            {authorInfo.role}
          </p>

          <p className="max-w-xl mx-auto text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
            অভ্যাস টিম প্রোফাইল। স্মার্ট প্রযুক্তি এবং পরীক্ষিত শিক্ষার
            কৌশলগুলির মাধ্যমে বাংলাদেশী শিক্ষার্থীদের তাদের একাডেমিক লক্ষ্য
            অর্জনে সহায়তা করতে অঙ্গীকারবদ্ধ।
          </p>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#1a1a1a] px-4 py-2 rounded-full border border-slate-200 dark:border-[#2b2b2b]">
              <PencilLine className="w-4 h-4 text-slate-400" />
              <span>{authorPosts.length} টি আর্টিকেল</span>
            </div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-[#1a1a1a] px-4 py-2 rounded-full border border-slate-200 dark:border-[#2b2b2b]">
              <BookOpen className="w-4 h-4 text-slate-400" />
              <span>Edu Creator</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Articles Grid ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
        <div className="flex items-center gap-3 mb-10 border-b border-slate-200 dark:border-[#2b2b2b] pb-4">
          <PencilLine className="w-6 h-6 text-rose-500" />
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
            প্রকাশিত আর্টিকেলসমূহ
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 hover:!opacity-100">
          {authorPosts.map((post) => (
            <BlogCard key={post.slug} post={post} />
          ))}
        </div>
      </section>
    </div>
  );
}
