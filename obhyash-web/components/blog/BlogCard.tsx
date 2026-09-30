'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BlogPost } from '@/lib/blog-data';
import {
  Clock,
  ArrowRight,
  Heart,
  Eye,
  Bookmark,
  CheckCheck,
} from 'lucide-react';
import { BanglaNameHelper } from '@/lib/bangla-name-helper';

import { getPostCover } from '@/lib/blog-images';

function formatCount(n: number): string {
  if (n >= 1000)
    return `${BanglaNameHelper.toBanglaNumeral((n / 1000).toFixed(1).replace(/\.0$/, ''))}k`;
  return BanglaNameHelper.toBanglaNumeral(n);
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

interface BlogCardProps {
  post: BlogPost;
  featured?: boolean;
  layout?: 'list' | 'grid' | 'featured' | 'compact';
  stats?: { likes: number; views: number };
  isBookmarked?: boolean;
  onToggleBookmark?: (slug: string) => void;
  isRead?: boolean;
}

export default function BlogCard({
  post,
  featured = false,
  layout = 'list',
  stats,
  isBookmarked,
  onToggleBookmark,
  isRead,
}: BlogCardProps) {
  const router = useRouter();
  const coverUrl = getPostCover(post);

  // ─────────────────────────────────────────────────────────────
  // 1. KATEN FEATURED / HERO POST (Large Card with Dark Overlay)
  // ─────────────────────────────────────────────────────────────
  if (featured || layout === 'featured') {
    return (
      <div
        role="article"
        onClick={() => router.push(`/blog/${post.slug}`)}
        className="group relative cursor-pointer font-anek w-full rounded-3xl overflow-hidden border border-slate-200/80 dark:border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.18)] transition-all duration-300"
      >
        <div className="relative w-full h-[400px] sm:h-[460px] md:h-[520px] overflow-hidden bg-slate-900">
          <Image
            src={coverUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            sizes="(max-width: 1200px) 100vw, 1200px"
            priority
          />

          {/* Dark Gradient Overlay (Katen Signature) */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

          {/* Bookmark Button (Top Right) */}
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(post.slug);
              }}
              aria-label={isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করো'}
              className={`absolute top-5 right-5 z-20 w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-md ${
                isBookmarked
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/20 text-white hover:bg-white/40'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>
          )}

          {/* Bottom Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 md:p-12 z-10 flex flex-col justify-end">
            {/* Category Pill + Read Status */}
            <div className="flex flex-wrap items-center gap-2.5 mb-4">
              <span className="px-3.5 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-[#fe4f70] to-[#ffa387] shadow-md uppercase tracking-wider">
                {post.category}
              </span>
              <span className="px-3 py-1 text-[11px] font-black text-amber-300 rounded-full bg-black/40 backdrop-blur-md border border-amber-400/30">
                ⭐ নির্বাচিত আর্টিকেল
              </span>
              {isRead && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                  <CheckCheck className="w-3 h-3" />
                  পড়েছেন
                </span>
              )}
            </div>

            {/* Title */}
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white group-hover:text-[#ffa387] transition-colors duration-200 leading-[1.3] mb-4 line-clamp-2">
              {post.title}
            </h2>

            {/* Excerpt */}
            <p className="text-slate-200 text-sm sm:text-base leading-relaxed line-clamp-2 max-w-3xl mb-6 font-medium">
              {post.excerpt}
            </p>

            {/* Meta Row */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10 text-white/90 text-xs sm:text-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fe4f70] to-[#ffa387] p-0.5 flex items-center justify-center font-bold text-xs text-white">
                  {post.author.initials}
                </div>
                <span className="font-bold">{post.author.name}</span>
                <span className="text-white/40">•</span>
                <span>{formatDate(post.publishedAt)}</span>
                <span className="text-white/40">•</span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {BanglaNameHelper.toBanglaNumeral(post.readTime)} মিনিট
                </span>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-white/80">
                {stats?.views ? (
                  <span className="inline-flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {formatCount(stats.views)}
                  </span>
                ) : null}
                {stats?.likes ? (
                  <span className="inline-flex items-center gap-1">
                    <Heart className="w-4 h-4 text-rose-400" />
                    {formatCount(stats.likes)}
                  </span>
                ) : null}
                <span className="inline-flex items-center gap-1 font-bold text-white group-hover:translate-x-1 transition-transform">
                  পড়ুন <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. KATEN COMPACT POST (For Sidebar Trending/Popular List)
  // ─────────────────────────────────────────────────────────────
  if (layout === 'compact') {
    return (
      <div
        role="article"
        onClick={() => router.push(`/blog/${post.slug}`)}
        className="group flex items-center gap-3.5 cursor-pointer font-anek py-3 border-b border-slate-100 dark:border-white/5 last:border-0"
      >
        <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-sm border border-slate-200/60 dark:border-white/10">
          <Image
            src={coverUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="64px"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13.5px] font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors line-clamp-2 leading-snug">
            {post.title}
          </h4>
          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            <span>{formatDate(post.publishedAt)}</span>
            <span>•</span>
            <span>{BanglaNameHelper.toBanglaNumeral(post.readTime)} মিনিট</span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. KATEN GRID CARD (Vertical layout)
  // ─────────────────────────────────────────────────────────────
  if (layout === 'grid') {
    return (
      <div
        role="article"
        onClick={() => router.push(`/blog/${post.slug}`)}
        className="group flex flex-col h-full cursor-pointer font-anek bg-white dark:bg-[#161616] rounded-2xl border border-slate-200/80 dark:border-white/10 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 shadow-sm"
      >
        {/* Thumbnail with floating category pill */}
        <div className="relative w-full h-48 sm:h-52 overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
          <Image
            src={coverUrl}
            alt={post.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 100vw, 50vw"
          />

          {/* Floating Category Badge */}
          <span className="absolute top-3 left-3 z-10 px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-[#10b981] to-[#047857] shadow-md">
            {post.category}
          </span>

          {/* Bookmark Button */}
          {onToggleBookmark && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(post.slug);
              }}
              aria-label={isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করো'}
              className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
                isBookmarked
                  ? 'bg-rose-500 text-white'
                  : 'bg-white/80 dark:bg-black/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-black'
              }`}
            >
              <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 flex flex-col flex-1">
          {/* Metadata */}
          <div className="flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2.5">
            <span>{post.author.name}</span>
            <span>•</span>
            <span>{formatDate(post.publishedAt)}</span>
          </div>

          {/* Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#059669] dark:group-hover:text-[#34d399] transition-colors line-clamp-2 leading-snug mb-2.5">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4 flex-1">
            {post.excerpt}
          </p>

          {/* Footer Bar */}
          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-xs text-slate-400">
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {BanglaNameHelper.toBanglaNumeral(post.readTime)} মিনিট পাঠ
            </span>
            <span className="font-bold text-[#059669] dark:text-[#34d399] group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
              পড়ুন <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 4. KATEN SIGNATURE HORIZONTAL LIST CARD (Default Standard)
  // ─────────────────────────────────────────────────────────────
  return (
    <div
      role="article"
      onClick={() => router.push(`/blog/${post.slug}`)}
      className="group flex flex-col sm:flex-row gap-5 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white dark:bg-[#161616] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer font-anek shadow-sm"
    >
      {/* Thumbnail Left (Katen List Format) */}
      <div className="relative w-full sm:w-60 md:w-64 h-48 sm:h-auto shrink-0 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
        <Image
          src={coverUrl}
          alt={post.title}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          sizes="(max-width: 640px) 100vw, 260px"
        />

        {/* Floating Category Pill */}
        <span className="absolute top-3 left-3 z-10 px-3 py-1 text-xs font-bold text-white rounded-full bg-gradient-to-r from-[#10b981] to-[#047857] shadow-md">
          {post.category}
        </span>

        {/* Bookmark Overlay Button */}
        {onToggleBookmark && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(post.slug);
            }}
            aria-label={isBookmarked ? 'বুকমার্ক সরান' : 'বুকমার্ক করো'}
            className={`absolute top-3 right-3 z-10 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all shadow-sm ${
              isBookmarked
                ? 'bg-rose-500 text-white'
                : 'bg-white/80 dark:bg-black/60 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-black'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-white' : ''}`} />
          </button>
        )}
      </div>

      {/* Content Right */}
      <div className="flex flex-col justify-between flex-1 py-1">
        <div>
          {/* Top Metadata */}
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 dark:text-slate-500 mb-2.5">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              {post.author.name}
            </span>
            <span>•</span>
            <span>{formatDate(post.publishedAt)}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {BanglaNameHelper.toBanglaNumeral(post.readTime)} মিনিট
            </span>
            {isRead && (
              <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <CheckCheck className="w-2.5 h-2.5" />
                পড়েছেন
              </span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#fe4f70] dark:group-hover:text-[#ffa387] transition-colors duration-200 line-clamp-2 leading-snug mb-2.5">
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 line-clamp-2 sm:line-clamp-3 leading-relaxed">
            {post.excerpt}
          </p>
        </div>

        {/* Bottom Bar: Stats + Action */}
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-4 text-xs text-slate-400">
            {stats?.views ? (
              <span className="inline-flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                {formatCount(stats.views)}
              </span>
            ) : null}
            {stats?.likes ? (
              <span className="inline-flex items-center gap-1">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                {formatCount(stats.likes)}
              </span>
            ) : null}
          </div>

          <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#fe4f70] dark:text-[#ffa387] group-hover:translate-x-1 transition-transform">
            সম্পূর্ণ পড়ুন <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
