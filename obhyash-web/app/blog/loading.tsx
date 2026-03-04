// Shown automatically by Next.js App Router (Suspense) while blog/page.tsx fetches data

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-200 dark:bg-[#2a2a2a] ${className ?? ''}`}
    />
  );
}

function BlogCardSkeleton() {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
      {/* cover */}
      <Shimmer className="w-full h-44 rounded-none" />
      <div className="flex flex-col flex-1 p-5 sm:p-6 gap-3">
        {/* category badge */}
        <Shimmer className="w-20 h-5" />
        {/* title */}
        <Shimmer className="w-full h-5" />
        <Shimmer className="w-4/5 h-5" />
        {/* excerpt lines */}
        <Shimmer className="w-full h-3.5 mt-1" />
        <Shimmer className="w-full h-3.5" />
        <Shimmer className="w-2/3 h-3.5" />
        {/* tags */}
        <div className="flex gap-2 mt-1">
          <Shimmer className="w-12 h-4" />
          <Shimmer className="w-14 h-4" />
        </div>
        {/* author row */}
        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-100 dark:border-[#2b2b2b]">
          <Shimmer className="w-6 h-6 rounded-full" />
          <Shimmer className="w-32 h-3.5" />
        </div>
      </div>
    </div>
  );
}

function FeaturedCardSkeleton() {
  return (
    <div className="bg-white dark:bg-[#111] rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden">
      {/* cover */}
      <Shimmer className="w-full h-56 sm:h-64 rounded-none" />
      <div className="p-6 sm:p-8 md:p-10 space-y-4">
        {/* badges */}
        <div className="flex gap-2">
          <Shimmer className="w-20 h-6 rounded-full" />
          <Shimmer className="w-24 h-6 rounded-full" />
        </div>
        {/* title */}
        <Shimmer className="w-3/4 h-8" />
        <Shimmer className="w-1/2 h-8" />
        {/* excerpt */}
        <Shimmer className="w-full h-4" />
        <Shimmer className="w-full h-4" />
        <Shimmer className="w-2/3 h-4" />
        {/* meta row */}
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center gap-3">
            <Shimmer className="w-8 h-8 rounded-full" />
            <div className="space-y-2">
              <Shimmer className="w-24 h-3.5" />
              <Shimmer className="w-32 h-3" />
            </div>
          </div>
          <Shimmer className="w-28 h-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export default function BlogLoading() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="bg-[#FAF6F3] dark:bg-[#0a0a0a]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center space-y-6">
          <Shimmer className="mx-auto w-3/4 h-12 sm:h-14" />
          <Shimmer className="mx-auto w-1/2 h-12 sm:h-14" />
          <Shimmer className="mx-auto w-2/3 h-5 mt-2" />
          <Shimmer className="mx-auto w-1/2 h-5" />
          {/* stats row */}
          <div className="flex justify-center gap-8 mt-4">
            <Shimmer className="w-24 h-4" />
            <Shimmer className="w-24 h-4" />
            <Shimmer className="w-24 h-4" />
          </div>
          {/* search bar */}
          <Shimmer className="mx-auto w-full max-w-lg h-12 rounded-2xl mt-2" />
        </div>
      </section>

      {/* ─── Category bar ─── */}
      <div className="bg-[#FAF6F3] dark:bg-[#0a0a0a] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-2 overflow-x-hidden justify-center flex-wrap">
          {Array.from({ length: 7 }).map((_, i) => (
            <Shimmer key={i} className="w-16 sm:w-20 h-8 rounded-lg" />
          ))}
        </div>
      </div>

      {/* ─── Main content ─── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
        {/* Recommended strip */}
        <div className="mb-16 pb-16 border-b border-slate-100 dark:border-[#2b2b2b]">
          <div className="flex items-center gap-2 mb-6">
            <Shimmer className="w-5 h-5 rounded" />
            <Shimmer className="w-44 h-5" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <BlogCardSkeleton key={i} />
            ))}
          </div>
        </div>

        {/* Featured card */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-4">
            <Shimmer className="w-4 h-4 rounded" />
            <Shimmer className="w-28 h-4" />
          </div>
          <FeaturedCardSkeleton />
        </div>

        {/* Section heading */}
        <div className="flex items-center gap-2 mb-6">
          <Shimmer className="w-4 h-4 rounded" />
          <Shimmer className="w-24 h-4" />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <BlogCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </>
  );
}
