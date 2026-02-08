import React from 'react';
import { PenTool, BookOpen } from 'lucide-react';

const InitialLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-black overflow-hidden">
      {/* Background Micro-elements */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none">
        <div className="absolute top-10 left-10 animate-pulse">
          <BookOpen size={120} />
        </div>
        <div className="absolute bottom-20 right-20 animate-pulse delay-700">
          <PenTool size={150} />
        </div>
      </div>

      <div className="relative flex flex-col items-center">
        {/* Animated Pencil/Pen Icon */}
        <div className="relative mb-8">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center animate-bounce duration-[2000ms]">
            <PenTool className="w-10 h-10 text-rose-600 dark:text-rose-400 rotate-12 transition-transform" />
          </div>
          {/* Scribble path animation (Simplified SVG) */}
          <svg
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-4 overflow-visible"
            viewBox="0 0 100 20"
          >
            <path
              d="M0,10 Q25,0 50,10 T100,10"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              className="text-rose-600/30 dark:text-rose-400/30 stroke-dasharray-[200] animate-[draw_2s_ease-in-out_infinite]"
            />
          </svg>
        </div>

        {/* Brand Name with Gradient */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tighter mb-2 bg-gradient-to-r from-rose-600 via-indigo-600 to-rose-600 bg-[length:200%_auto] animate-[gradient_3s_linear_infinite] bg-clip-text text-transparent">
          অভ্যাস
        </h1>

        {/* Bengali Tagline */}
        <p className="text-sm font-bold text-neutral-500 dark:text-neutral-400 tracking-wide uppercase">
          অভ্যাস • শিখুন • জয় করুন
        </p>

        {/* Loading Bar */}
        <div className="mt-12 w-48 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden border border-neutral-200 dark:border-neutral-700/50">
          <div className="h-full bg-rose-600 dark:bg-rose-500 rounded-full animate-[loading_1.5s_ease-in-out_infinite] w-1/3"></div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes draw {
          0% { stroke-dashoffset: 200; opacity: 0; }
          50% { stroke-dashoffset: 0; opacity: 1; }
          100% { stroke-dashoffset: -200; opacity: 0; }
        }
        @keyframes loading {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        @keyframes gradient {
          0% { bg-position: 0% center; }
          100% { bg-position: 200% center; }
        }
        .stroke-dasharray-\\[200\\] {
          stroke-dasharray: 200;
        }
      `,
        }}
      />
    </div>
  );
};

export default InitialLoader;
