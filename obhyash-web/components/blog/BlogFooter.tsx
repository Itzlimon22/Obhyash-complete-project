import Link from 'next/link';
import { Flame } from 'lucide-react';

export default function BlogFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col items-center md:items-start gap-3">
            <Link href="/blog" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-rose-700 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:scale-110 transition-transform duration-200">
                <Flame className="w-[18px] h-[18px]" />
              </div>
              <span className="text-lg font-extrabold text-slate-900 dark:text-white">
                Obhyash Blog
              </span>
            </Link>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs text-center md:text-left">
              Study smarter. Score higher. Expert tips, exam strategies, and
              insights for Bangladeshi students.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center md:justify-end gap-x-8 gap-y-3 text-sm font-medium text-slate-500 dark:text-slate-400">
            <Link
              href="/"
              className="hover:text-rose-500 transition-colors duration-200"
            >
              Home
            </Link>
            <Link
              href="/blog"
              className="hover:text-rose-500 transition-colors duration-200"
            >
              Blog
            </Link>
            <Link
              href="/faq"
              className="hover:text-rose-500 transition-colors duration-200"
            >
              FAQ
            </Link>
            <Link
              href="/privacy"
              className="hover:text-rose-500 transition-colors duration-200"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="hover:text-rose-500 transition-colors duration-200"
            >
              Terms
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-8 border-t border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 dark:text-slate-500">
          <span>
            © {new Date().getFullYear()} Obhyash. All rights reserved.
          </span>
          <span className="flex items-center gap-1">
            Made with{' '}
            <span className="text-rose-500 text-base leading-none">♥</span> for
            Bangladeshi students
          </span>
        </div>
      </div>
    </footer>
  );
}
