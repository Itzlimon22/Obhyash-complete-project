'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BlogPost } from '@/lib/blog-data';
import { getPostCover } from '@/lib/blog-images';

function formatBanglaDate(dateStr: string) {
  try {
    return new Date(dateStr).toLocaleDateString('bn-BD', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }
}

export default function InArticleRelatedCard({ post }: { post: BlogPost }) {
  if (!post) return null;

  return (
    <aside className="not-prose my-8 sm:my-10" aria-label="সম্পর্কিত আর্টিকেল">
      <p className="text-[14px] sm:text-[15px] font-bold text-slate-800 dark:text-slate-200 mb-2 font-noto">
        আরও পড়ুন
      </p>
      <Link
        href={`/blog/${post.slug}`}
        className="group flex items-center justify-between gap-4 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#121212] hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md transition-all duration-200"
      >
        <div className="flex-1 min-w-0 pr-2">
          <h4 className="text-[16px] sm:text-[18px] font-bold text-slate-900 dark:text-slate-100 group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors line-clamp-2 leading-snug font-noto mb-2">
            {post.title}
          </h4>
          <p className="text-xs text-slate-400 dark:text-slate-500 font-noto">
            {formatBanglaDate(post.publishedAt)}
          </p>
        </div>
        <div className="relative w-28 sm:w-36 aspect-[16/10] shrink-0 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-white/5">
          <Image
            src={getPostCover(post)}
            alt={post.title}
            fill
            className="object-contain group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 112px, 144px"
          />
        </div>
      </Link>
    </aside>
  );
}
