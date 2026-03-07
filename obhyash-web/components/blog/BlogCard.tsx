'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BlogPost } from '@/lib/blog-data';
import {
  Clock,
  ArrowRight,
  Tag,
  Heart,
  Eye,
  Bookmark,
  CheckCheck,
} from 'lucide-react';

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  return String(n);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
  stats?: { likes: number; views: number };
  isBookmarked?: boolean;
  onToggleBookmark?: (slug: string) => void;
  isRead?: boolean;
}

export default function BlogCard({
  post,
  featured = false,
  stats,
  isBookmarked,
  onToggleBookmark,
  isRead,
}: BlogCardProps) {
  const router = useRouter();
  const categoryStyle =
    'bg-slate-50 text-slate-600 dark:bg-[#1a1a1a] dark:text-slate-400 border border-slate-100 dark:border-white/5';

  if (featured) {
    return (
      <Link href={`/blog/${post.slug}`} className="group block">
        <article className="relative bg-white dark:bg-[#111] overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
          {/* Cover image or gradient strip */}
          {post.coverImage ? (
            <div className="relative w-full h-52 sm:h-64 md:h-72 overflow-hidden">
              <Image
                src={post.coverImage}
                alt={post.title}
                fill
                className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                sizes="(max-width: 768px) 100vw, 80vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            </div>
          ) : (
            <div className={`w-full h-2 bg-gradient-to-r ${post.coverColor}`} />
          )}
          {/* Bookmark button — featured card */}
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleBookmark(post.slug);
              }}
              aria-label={isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করো'}
              className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center shadow transition-all
                ${isBookmarked ? 'bg-rose-500 text-white' : 'bg-white/80 dark:bg-black/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-black/80'}`}
            >
              <Bookmark
                className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`}
              />
            </button>
          )}
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
              {isRead && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                  <CheckCheck className="w-3 h-3" />
                  পড়েছেন
                </span>
              )}
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
                  <Link
                    href={`/blog/author/${post.author.name}`}
                    onClick={(e) => e.stopPropagation()}
                    className="text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                  >
                    {post.author.name}
                  </Link>
                  <div className="flex items-center gap-2 text-xs text-slate-400 font-anek mt-0.5">
                    <span>{formatDate(post.publishedAt)}</span>
                    <span>·</span>
                    <Clock className="w-3 h-3" />
                    <span>{post.readTime} মিনিট</span>
                  </div>
                </div>
              </div>

              <span className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-[#1e1e1e] hover:bg-slate-200 dark:hover:bg-[#2b2b2b] text-slate-700 dark:text-slate-300 text-sm font-semibold rounded-lg transition-all duration-200 font-anek">
                বিস্তারিত পড়ো
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </span>
            </div>
            {/* Engagement stats */}
            {stats?.likes || stats?.views ? (
              <div className="flex items-center gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-[#2b2b2b]">
                {stats.likes > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-anek">
                    <Heart className="w-3.5 h-3.5" />
                    {formatCount(stats.likes)}
                  </span>
                )}
                {stats.views > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400 dark:text-slate-500 font-anek">
                    <Eye className="w-3.5 h-3.5" />
                    {formatCount(stats.views)}
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </article>
      </Link>
    );
  }

  return (
    <div
      role="article"
      onClick={() => router.push(`/blog/${post.slug}`)}
      className="group block h-full cursor-pointer"
    >
      <div className="flex flex-col h-full bg-white dark:bg-[#111] overflow-hidden rounded-2xl border border-black/5 dark:border-white/5 hover:border-black/10 dark:hover:border-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300">
        {/* Cover image or gradient strip */}
        {post.coverImage ? (
          <div className="relative w-full h-44 overflow-hidden shrink-0">
            <Image
              src={post.coverImage}
              alt={post.title}
              fill
              className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Bookmark overlay — regular card */}
            {onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(post.slug);
                }}
                aria-label={isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করো'}
                className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow transition-all
                  ${isBookmarked ? 'bg-rose-500 text-white' : 'bg-white/80 dark:bg-black/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-black/80'}`}
              >
                <Bookmark
                  className={`w-3 h-3 ${isBookmarked ? 'fill-white' : ''}`}
                />
              </button>
            )}
          </div>
        ) : (
          <div className="relative">
            <div
              className={`w-full h-1.5 bg-gradient-to-r ${post.coverColor} shrink-0`}
            />
            {/* Bookmark for no-cover cards */}
            {onToggleBookmark && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBookmark(post.slug);
                }}
                aria-label={isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করো'}
                className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-full flex items-center justify-center shadow transition-all
                  ${isBookmarked ? 'bg-rose-500 text-white' : 'bg-slate-100 dark:bg-[#2b2b2b] text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-[#333]'}`}
              >
                <Bookmark
                  className={`w-3 h-3 ${isBookmarked ? 'fill-white' : ''}`}
                />
              </button>
            )}
          </div>
        )}
        <div className="flex flex-col flex-1 p-5 sm:p-6">
          {/* Category badge */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full border ${categoryStyle}`}
            >
              <Tag className="w-3 h-3" />
              {post.category}
            </span>
            {isRead && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCheck className="w-2.5 h-2.5" />
                পড়েছেন
              </span>
            )}
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
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2.5 py-1 text-[11px] font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-md border border-slate-100 dark:border-slate-700 hover:text-rose-600 dark:hover:text-rose-400 hover:border-rose-200 dark:hover:border-rose-900 transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-[#2b2b2b]">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-6 h-6 shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 text-[9px] font-bold`}
              >
                {post.author.initials}
              </div>
              <div className="min-w-0">
                <Link
                  href={`/blog/author/${post.author.name}`}
                  onClick={(e) => e.stopPropagation()}
                  className="block text-[12px] font-medium text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors truncate font-anek"
                >
                  {post.author.name}
                </Link>
                <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-anek mt-0.5">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  <span>{post.readTime} মি.</span>
                  <span className="mx-0.5 opacity-40">·</span>
                  <span className="truncate">
                    {formatDate(post.publishedAt)}
                  </span>
                </div>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0 text-slate-300 dark:text-slate-600 group-hover:text-rose-500 group-hover:translate-x-1 transition-all duration-200" />
          </div>
          {/* Engagement stats */}
          {stats?.likes || stats?.views ? (
            <div className="flex items-center gap-3 pt-3 border-t border-slate-100 dark:border-[#2b2b2b] mt-1">
              {stats.likes > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-anek">
                  <Heart className="w-3 h-3" />
                  {formatCount(stats.likes)}
                </span>
              )}
              {stats.views > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 font-anek">
                  <Eye className="w-3 h-3" />
                  {formatCount(stats.views)}
                </span>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
