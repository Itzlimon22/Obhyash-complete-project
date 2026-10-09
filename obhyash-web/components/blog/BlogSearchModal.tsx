'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, BookOpen, CornerDownLeft, Sparkles } from 'lucide-react';
import { BlogPost } from '@/lib/blog-data';

interface BlogSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  posts: BlogPost[];
  initialQuery?: string;
}

const POPULAR_SEARCH_TAGS = [
  'বিশ্ববিদ্যালয় ভর্তি ২০২৬',
  'মেডিকেল সার্কুলার ২০২৬',
  'বুয়েট ভর্তি পরীক্ষা',
  'গুচ্ছ ভর্তি পরীক্ষা ২০২৬',
  'এইচএসসি টেস্ট পেপার',
  'ক্যালকুলেটর হ্যাকস',
];

export default function BlogSearchModal({
  isOpen,
  onClose,
  posts,
  initialQuery = '',
}: BlogSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        document.body.style.overflow = '';
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen]);

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      // Show recently published or popular 5 posts when query is empty
      return posts.slice(0, 5);
    }

    return posts
      .filter((post) => {
        const titleMatch = post.title.toLowerCase().includes(q);
        const excerptMatch = post.excerpt.toLowerCase().includes(q);
        const tagsMatch = post.tags.some((t) => t.toLowerCase().includes(q));
        const categoryMatch = post.category.toLowerCase().includes(q);
        return titleMatch || excerptMatch || tagsMatch || categoryMatch;
      })
      .slice(0, 8);
  }, [query, posts]);

  // Keyboard navigation through results
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : searchResults.length - 1,
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (searchResults[selectedIndex]) {
        router.push(`/blog/${searchResults[selectedIndex].slug}`);
        onClose();
      }
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (resultsContainerRef.current) {
      const activeElement = resultsContainerRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (activeElement) {
        activeElement.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#121212] rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 gap-3">
          <Search className="w-5 h-5 text-rose-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="কী বিষয়ে পড়তে চাও? (উদা: বুয়েট, মেডিকেল, টেস্ট পেপার...)"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-[16px] sm:text-[17px] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none font-noto"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 rounded-md border border-slate-200 dark:border-slate-700">
            Esc
          </kbd>
        </div>

        {/* Quick Search Tag Pills */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50/60 dark:bg-slate-900/40 border-b border-slate-100 dark:border-slate-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest shrink-0 font-noto">
            জনপ্রিয়:
          </span>
          {POPULAR_SEARCH_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                setQuery(tag);
                setSelectedIndex(0);
              }}
              className="px-2.5 py-1 text-[12px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/90 rounded-full border border-slate-200 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-500/50 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shrink-0 font-noto"
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div
          ref={resultsContainerRef}
          className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 custom-scrollbar"
        >
          {searchResults.length > 0 ? (
            searchResults.map((post, index) => {
              const isSelected = index === selectedIndex;
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  onClick={onClose}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`block p-3.5 sm:p-4 rounded-2xl transition-all ${
                    isSelected
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-noto">
                          <BookOpen className="w-2.5 h-2.5 text-rose-500" />
                          {post.category}
                        </span>
                        <span className="text-[11px] text-slate-400 dark:text-slate-500 font-noto flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> {post.readTime} মিনিট
                        </span>
                      </div>
                      <h4
                        className={`text-[15px] sm:text-[16px] font-bold line-clamp-1 font-noto leading-snug ${
                          isSelected
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-slate-900 dark:text-slate-100'
                        }`}
                      >
                        {post.title}
                      </h4>
                      <p className="text-[13px] text-slate-500 dark:text-slate-400 line-clamp-1 font-noto font-light">
                        {post.excerpt}
                      </p>
                    </div>
                    {isSelected && (
                      <span className="shrink-0 p-1.5 rounded-lg bg-rose-500 text-white mt-1">
                        <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="py-12 text-center space-y-2 font-noto">
              <p className="text-base font-semibold text-slate-700 dark:text-slate-300">
                🔍 &ldquo;{query}&rdquo; দিয়ে কোনো আর্টিকেল পাওয়া যায়নি!
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                বানান সঠিক আছে কিনা দেখুন অথবা উপরের জনপ্রিয় সার্চ ট্যাগগুলো ট্রাই করুন।
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 dark:bg-[#161616] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 font-noto">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded">↓</kbd> নেভিগেট
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border rounded">Enter</kbd> পড়তে যান
            </span>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-rose-500 font-medium">
            <Sparkles className="w-3 h-3" /> অভ্যাস স্মার্ট সার্চ
          </span>
        </div>
      </div>
    </div>
  );
}
