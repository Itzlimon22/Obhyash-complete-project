'use client';

import { useState, FormEvent } from 'react';
import useSWR from 'swr';
import {
  Send,
  User as UserIcon,
  Loader2,
  AlertCircle,
  Reply,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

import { BlogComment } from '@/lib/types';
import { useAuth } from '@/components/auth/AuthProvider';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface CommentSectionProps {
  postSlug: string;
}

// Build avatar letter/image element
function Avatar({
  user,
  size = 10,
}: {
  user?: BlogComment['user'];
  size?: number;
}) {
  const cls = `w-${size} h-${size} shrink-0 rounded-full flex items-center justify-center text-white font-semibold text-sm ${user?.avatarColor || 'bg-slate-600'}`;
  return (
    <div className={cls}>
      {user?.avatarUrl ? (
        <img
          src={user.avatarUrl}
          alt={user.name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : user?.name ? (
        user.name.charAt(0).toUpperCase()
      ) : (
        <UserIcon className="w-4 h-4 text-slate-300" />
      )}
    </div>
  );
}

function formatCommentDate(ds: string) {
  return new Date(ds).toLocaleDateString('bn-BD', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface ReplyFormProps {
  postSlug: string;
  parentId: string;
  parentAuthor: string;
  onDone: () => void;
  mutate: () => void;
}

function ReplyForm({
  postSlug,
  parentId,
  parentAuthor,
  onDone,
  mutate,
}: ReplyFormProps) {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: postSlug,
          content: content.trim(),
          parentId,
        }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      setContent('');
      onDone();
      toast.success('রিপ্লাই সফলভাবে পোস্ট করা হয়েছে!');
    } catch {
      toast.error('রিপ্লাই পোস্ট করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-3 ml-8 sm:ml-14">
      <div className="relative">
        <p className="text-[12px] text-slate-400 mb-1.5 font-anek">
          @{parentAuthor} কে রিপ্লাই করছেন
        </p>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="আপনার রিপ্লাই লিখুন..."
          autoFocus
          className="w-full min-h-[90px] p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/30 dark:bg-[#1a1a1a] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40 transition-all resize-none text-[14px] leading-relaxed font-anek"
          maxLength={1000}
        />
        <div className="flex items-center justify-end gap-2 mt-2">
          <button
            type="button"
            onClick={onDone}
            className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors font-anek"
          >
            বাতিল
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="bg-rose-600 hover:bg-rose-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 font-anek"
          >
            {isSubmitting ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <Send className="w-3 h-3" /> রিপ্লাই
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}

interface ThreadedCommentProps {
  comment: BlogComment;
  replies: BlogComment[];
  postSlug: string;
  currentUserId?: string;
  replyingTo: string | null;
  onReply: (id: string) => void;
  mutate: () => void;
}

function ThreadedComment({
  comment,
  replies,
  postSlug,
  currentUserId,
  replyingTo,
  onReply,
  mutate,
}: ThreadedCommentProps) {
  return (
    <div className="flex gap-3">
      <Avatar user={comment.user} size={10} />
      <div className="flex-1 min-w-0">
        {/* Bubble */}
        <div className="bg-white dark:bg-[#121212] border border-slate-100 dark:border-[#2b2b2b] rounded-2xl px-4 py-3.5">
          <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-[14px]">
              {comment.user?.name || 'অজ্ঞাত ব্যবহারকারী'}
            </span>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-anek">
              {formatCommentDate(comment.created_at)}
            </span>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-[14px] leading-relaxed whitespace-pre-wrap break-words font-anek">
            {comment.content}
          </p>
        </div>

        {/* Actions */}
        {currentUserId && (
          <div className="flex items-center gap-3 mt-1.5 ml-1">
            <button
              onClick={() =>
                onReply(replyingTo === comment.id ? '' : comment.id)
              }
              className="inline-flex items-center gap-1 text-[12px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors font-anek"
            >
              <Reply className="w-3.5 h-3.5" />
              রিপ্লাই
            </button>
          </div>
        )}

        {/* Inline reply form */}
        {replyingTo === comment.id && currentUserId && (
          <ReplyForm
            postSlug={postSlug}
            parentId={comment.id}
            parentAuthor={comment.user?.name || 'অজ্ঞাত'}
            onDone={() => onReply('')}
            mutate={mutate}
          />
        )}

        {/* Nested replies */}
        {replies.length > 0 && (
          <div className="mt-3 space-y-3 pl-4 border-l-2 border-slate-100 dark:border-[#2b2b2b]">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar user={reply.user} size={8} />
                <div className="flex-1 min-w-0">
                  <div className="bg-slate-50 dark:bg-[#1a1a1a] border border-slate-100 dark:border-[#2b2b2b] rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-1 flex-wrap gap-1">
                      <span className="font-semibold text-slate-900 dark:text-slate-100 text-[13px]">
                        {reply.user?.name || 'অজ্ঞাত ব্যবহারকারী'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-anek">
                        {formatCommentDate(reply.created_at)}
                      </span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 text-[13px] leading-relaxed whitespace-pre-wrap break-words font-anek">
                      {reply.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CommentSection({ postSlug }: CommentSectionProps) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  const { data, error, mutate, isLoading } = useSWR<{
    comments: BlogComment[];
  }>(`/api/blog/comments?slug=${postSlug}`, fetcher);

  const allComments = data?.comments || [];
  // Separate top-level and replies
  const topLevel = allComments.filter((c) => !c.parent_id);
  const getReplies = (id: string) =>
    allComments.filter((c) => c.parent_id === id);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !user) return;
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/blog/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: postSlug, content: content.trim() }),
      });
      if (!res.ok) throw new Error();
      await mutate();
      setContent('');
      toast.success('আপনার মতামত সফলভাবে পোস্ট করা হয়েছে!');
    } catch {
      toast.error('মতামত পোস্ট করতে সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="mt-16 pt-10 border-t border-slate-100 dark:border-slate-800 font-anek"
      id="comments"
    >
      <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-8 flex items-center gap-2">
        <span className="bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 w-8 h-8 rounded-full flex items-center justify-center text-sm">
          {topLevel.length}
        </span>
        মতামত
      </h2>

      {/* ─── Comment Input ─── */}
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

      {/* ─── Comment Thread ─── */}
      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-500/10 text-red-600 flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4" />
            কমেন্ট লোড করতে সমস্যা হয়েছে। দয়া করে পেজটি রিফ্রেশ করুন।
          </div>
        ) : topLevel.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
            <p className="text-slate-500 dark:text-slate-400 text-[15px]">
              এখনো কেউ মতামত জানায়নি। আপনিই প্রথম মতামত দিন!
            </p>
          </div>
        ) : (
          topLevel.map((comment) => (
            <ThreadedComment
              key={comment.id}
              comment={comment}
              replies={getReplies(comment.id)}
              postSlug={postSlug}
              currentUserId={user?.id}
              replyingTo={replyingTo}
              onReply={(id) => setReplyingTo(id || null)}
              mutate={mutate}
            />
          ))
        )}
      </div>
    </div>
  );
}
