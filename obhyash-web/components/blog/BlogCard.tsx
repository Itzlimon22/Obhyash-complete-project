import Link from 'next/link';
import { BlogPost } from '@/lib/blog-data';
import { Clock, ArrowRight, Tag } from 'lucide-react';

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Study Tips':
    'bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border-rose-100 dark:border-rose-500/20',
  'MCQ Techniques':
    'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 border-violet-100 dark:border-violet-500/20',
  'Exam Prep':
    'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20',
  'Time Management':
    'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-100 dark:border-amber-500/20',
  Motivation:
    'bg-sky-50 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400 border-sky-100 dark:border-sky-500/20',
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
        <article className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/60 shadow-sm hover:shadow-xl hover:shadow-rose-500/10 transition-all duration-300 hover:-translate-y-1">
          {/* Gradient top bar */}
          <div className={`h-1.5 w-full bg-gradient-to-r ${post.coverColor}`} />

          <div className="p-6 sm:p-8 md:p-10">
            {/* Featured badge + Category */}
            <div className="flex flex-wrap items-center gap-2.5 mb-5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-500 text-white text-xs font-bold rounded-full uppercase tracking-wider">
                ⭐ Featured
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${categoryStyle}`}
              >
                <Tag className="w-3 h-3" />
                {post.category}
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mb-4 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-200 leading-snug">
              {post.title}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-base leading-relaxed mb-6 line-clamp-3">
              {post.excerpt}
            </p>

            {/* Meta + CTA */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {/* Author avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center text-white text-xs font-bold shadow-md shadow-rose-500/30">
                  {post.author.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {post.author.name}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime} min read</span>
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white text-sm font-semibold rounded-xl shadow-md shadow-rose-500/30 group-hover:shadow-rose-500/50 group-hover:scale-[1.03] transition-all duration-200">
                Read Article
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${post.slug}`} className="group block h-full">
      <article className="flex flex-col h-full overflow-hidden rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/60 shadow-sm hover:shadow-lg hover:shadow-rose-500/10 transition-all duration-300 hover:-translate-y-1">
        {/* Gradient top bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${post.coverColor}`} />

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

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3 line-clamp-2 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors duration-200 leading-snug">
            {post.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-5 line-clamp-3 flex-grow">
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

          {/* Author & meta */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full bg-gradient-to-br ${post.coverColor} flex items-center justify-center text-white text-[10px] font-bold`}
              >
                {post.author.initials}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{post.readTime} min</span>
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
