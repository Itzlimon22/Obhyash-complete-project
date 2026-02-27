import Link from 'next/link';
import { BlogPost } from '@/lib/blog-data';
import { Clock, ArrowRight, Tag } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Study Tips':
    'bg-slate-100 text-slate-700 dark:bg-[#202020] dark:text-slate-300 border-slate-200 dark:border-[#383838]',
  'MCQ Techniques':
    'bg-slate-100 text-slate-700 dark:bg-[#202020] dark:text-slate-300 border-slate-200 dark:border-[#383838]',
  'Exam Prep':
    'bg-slate-100 text-slate-700 dark:bg-[#202020] dark:text-slate-300 border-slate-200 dark:border-[#383838]',
  'Time Management':
    'bg-slate-100 text-slate-700 dark:bg-[#202020] dark:text-slate-300 border-slate-200 dark:border-[#383838]',
  Motivation:
    'bg-slate-100 text-slate-700 dark:bg-[#202020] dark:text-slate-300 border-slate-200 dark:border-[#383838]',
};

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
  const categoryStyle =
    CATEGORY_COLORS[post.category] ??
    'bg-slate-50 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600';

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b] hover:border-slate-300 dark:hover:border-[#404040] shadow-sm hover:shadow-md transition-all duration-200">
          <div className="p-6 sm:p-8 md:p-10">
            {/* Featured badge + Category */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5 font-anek">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500 text-white text-[11px] font-bold rounded-full uppercase tracking-wider">
                ⭐ নির্বাচিত
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${categoryStyle}`}
              >
                <Tag className="w-3 h-3" />
                {post.category}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-200 leading-[1.6] font-anek">
              {post.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-[15px] sm:text-base leading-[1.7] mb-6 line-clamp-3 font-anek">
              {post.excerpt}
            </p>

            {/* Meta + CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Author avatar */}
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                  {post.author.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {post.author.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-anek">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime} মিনিট</span>
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200 dark:hover:bg-[#2b2b2b] text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-all duration-200 font-anek">
                বিস্তারিত পড়ুন
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex flex-col h-full overflow-hidden rounded-2xl bg-white dark:bg-[#121212] border border-slate-200 dark:border-[#2b2b2b] hover:border-slate-300 dark:hover:border-[#404040] shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex flex-col flex-1 p-5 sm:p-6">
          {/* Category badge */}
          <div className="mb-4">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${categoryStyle}`}
            >
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
          </div>

          <h3 className="text-[17px] font-bold text-slate-900 dark:text-slate-100 mb-2.5 line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-200 leading-[1.6] font-anek">
            {post.title}
          </h3>
          <p className="text-[14px] text-slate-500 dark:text-slate-400 leading-[1.7] mb-5 line-clamp-3 flex-grow font-anek">
            {post.excerpt}
          </p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {post.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2b2b2b]">
            <div className="flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-[9px] font-bold`}
              >
                {post.author.initials}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400 font-anek">
                <Clock className="w-3 h-3" />
                <span>{post.readTime} মিনিট</span>
                <span>·</span>
                <span>{formatDate(post.publishedAt)}</span>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-rose-500 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </div>
      </article>
    </Link>
  );
}
