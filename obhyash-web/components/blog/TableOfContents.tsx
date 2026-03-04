'use client';

import { useEffect, useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
}

export default function TableOfContents({ items }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>('');
  const [isOpen, setIsOpen] = useState(false);

  // Auto-expand on desktop (md = 768px)
  useEffect(() => {
    if (window.innerWidth >= 768) setIsOpen(true);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: '-100px 0px -60% 0px' },
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl bg-slate-50 dark:bg-[#1a1a1a] border border-slate-200 dark:border-[#383838] font-anek overflow-hidden">
      {/* Header / Toggle */}
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="w-full flex items-center justify-between p-4 sm:p-5 text-left"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-[14px] sm:text-[15px] text-slate-900 dark:text-slate-100">
          সূচিপত্র
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Collapsible body */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="overflow-hidden">
          <nav className="flex flex-col space-y-2 sm:space-y-2.5 relative px-4 sm:px-5 pb-4 sm:pb-5">
            {/* Vertical track line */}
            <div className="absolute left-4 sm:left-5 top-1 bottom-4 sm:bottom-5 w-px bg-slate-200 dark:bg-slate-700" />

            {items.map((item, index) => {
              const isActive = activeId === item.id;

              return (
                <a
                  key={index}
                  href={`#${item.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    const target = document.getElementById(item.id);
                    if (target) {
                      const yOffset = -100;
                      const y =
                        target.getBoundingClientRect().top +
                        window.pageYOffset +
                        yOffset;
                      window.scrollTo({ top: y, behavior: 'smooth' });
                    }
                    // Close drawer on mobile after navigating
                    if (window.innerWidth < 768) setIsOpen(false);
                  }}
                  className={`
                    relative pl-4 text-[13px] leading-[1.6] transition-colors
                    ${item.level === 3 ? 'ml-3' : ''}
                    ${
                      isActive
                        ? 'text-rose-600 dark:text-rose-400 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }
                  `}
                >
                  <div
                    className={`absolute left-0 top-[8px] w-1.5 h-1.5 rounded-full bg-rose-500 transition-opacity duration-300 ${
                      isActive ? 'opacity-100' : 'opacity-0'
                    }`}
                    style={{ transform: 'translateX(-2px)' }}
                  />
                  {item.text}
                </a>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
