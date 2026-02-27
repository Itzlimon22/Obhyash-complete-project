'use client';

import { useState, FormEvent } from 'react';
import useSWR from 'swr';
import { Send, User as UserIcon, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

import { BlogComment } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CommentSectionProps {
  postSlug: string;
}

export default function CommentSection({ postSlug }: CommentSectionProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data, error, mutate, isLoading } = useSWR<{
    comments: BlogComment[];
  }>(`/api/blog/comments?slug=${postSlug}`, fetcher);

  const comments = data?.comments || [];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slug: postSlug,
          content: content.trim(),
        }),
      });

      if (!res.ok) throw new Error('Failed to post comment');

      // Refresh the comments list locally & clear input
      await mutate();
      setContent('');
      toast.success('আপনার মতামত সফলভাবে পোস্ট করা হয়েছে!');
    } catch (err: any) {
      toast.error('মতামত পোস্ট করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date natively without massive date-fns library
  const formatCommentDate = (ds: string) => {
    return new Date(ds).toLocaleDateString('bn-BD', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div
      className="mt-16 pt-10 border-t border-slate-100 dark:border-slate-800 font-anek"
      id="comments"
    >
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-2">
        <span className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">
          {comments.length}
        </span>
        মতামত
      </h2>

      {/* ─── Comment Input Area ─── */}
      <div className="mb-12">
        {user ? (
          <form onSubmit={handleSubmit} className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="আপনার মতামত লিখুন..."
              className="w-full min-h-[120px] p-4 rounded-xl border border-slate-200 dark:border-[#333] bg-slate-50 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 dark:focus:ring-rose-500/30 transition-all resize-none text-[15px] leading-relaxed"
              maxLength={1000}
            />
            <div className="absolute right-3 bottom-3 flex items-center gap-3">
              <span className="text-xs text-slate-400">
                {1000 - content.length} ক্যারেক্টার বাকি
              </span>
              <button
                type="submit"
                disabled={isSubmitting || !content.trim()}
                className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    পোস্ট করুন <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] p-6 rounded-xl flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-slate-800 dark:text-slate-200 font-semibold mb-1">
                মতামত জানাতে লগইন করুন
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400">
                কমেন্ট সেকশনে যুক্ত হতে আপনার একাউন্টে প্রবেশ করুন।
              </span>
            </div>
            <a
              href={`/login?redirect=/blog/${postSlug}#comments`}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-lg text-sm font-semibold transition-colors"
            >
              লগইন করুন
            </a>
          </div>
        )}
      </div>

      {/* ─── Comments List ─── */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            কমেন্ট লোড করতে সমস্যা হয়েছে। দয়া করে পেজটি রিফ্রেশ করুন।
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-slate-500 dark:text-slate-400 text-[15px]">
              এখনো কেউ মতামত জানায়নি। আপনিই প্রথম মতামত দিন!
            </p>
          </div>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="flex gap-4 p-5 rounded-xl bg-white dark:bg-[#121212] border border-slate-100 dark:border-[#2b2b2b]"
            >
              {/* Avatar */}
              <div
                className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${
                  comment.user?.avatarColor || 'bg-slate-800'
                }`}
              >
                {comment.user?.avatarUrl ? (
                  <img
                    src={comment.user.avatarUrl}
                    alt={comment.user.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : comment.user?.name ? (
                  comment.user.name.charAt(0).toUpperCase()
                ) : (
                  <UserIcon className="w-5 h-5 text-slate-300" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 text-[15px]">
                    {comment.user?.name || 'অজ্ঞাত ব্যবহারকারী'}
                  </span>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {formatCommentDate(comment.created_at)}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
