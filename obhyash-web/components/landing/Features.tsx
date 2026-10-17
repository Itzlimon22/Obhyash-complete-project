'use client';

import React, { useEffect, useState, type ReactNode } from "react";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };
const ink = "#1d2430";

const Laptop = ({ children, dark }: { children: ReactNode; dark?: boolean }) => (
  <div className="flex flex-col items-center">
    <div
      className={`h-[92px] w-[140px] rounded-t-xl border-[3px] p-2 ${
        dark ? "bg-[#1d2430]" : "bg-white"
      }`}
      style={{ borderColor: ink }}
    >
      {children}
    </div>
    <div
      className="h-3 w-[168px] rounded-b-lg border-[3px] bg-[#d9dee6]"
      style={{ borderColor: ink }}
    />
  </div>
);

const ExamArt = () => (
  <Laptop>
    <div className="flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-[#3fb68b]" />
      <span className="h-1 w-10 rounded bg-[#e3e8ee]" />
      <span className="ml-auto h-1 w-5 rounded bg-[#bfe6d2]" />
    </div>
    <div className="mt-2 flex items-center gap-1.5 rounded-md border border-[#d9dee6] px-1.5 py-1">
      <span className="h-2 w-2 rounded-full border border-[#9aa3ad]" />
      <span className="h-1 w-12 rounded bg-[#d9dee6]" />
    </div>
    <div className="mt-1.5 flex items-center gap-1.5 rounded-md bg-[#3fb68b] px-1.5 py-1 a-pop">
      <span className="grid h-2.5 w-2.5 place-items-center rounded-full bg-white text-[6px] text-[#3fb68b]">
        ✓
      </span>
      <span className="h-1 w-10 rounded bg-white/80" />
      <span className="ml-auto grid h-3 w-4 place-items-center rounded-sm bg-[#1d5c45] text-[6px] text-white">
        🔒
      </span>
    </div>
  </Laptop>
);

const BookArt = () => (
  <div className="relative">
    <div className="flex">
      <div
        className="h-[86px] w-[78px] -skew-y-3 rounded-l-md border-[3px] bg-white p-2"
        style={{ borderColor: ink }}
      >
        {[12, 9, 11].map((w, i) => (
          <div
            key={i}
            className="mb-1.5 h-1 rounded bg-[#9aa3ad]"
            style={{ width: w * 4 }}
          />
        ))}
        <div className="mt-3 flex items-center gap-0.5">
          <span className="h-2 w-2 rounded-full border-2 border-[#6470f0]" />
          <span className="h-0.5 w-4 bg-[#9aa3ad]" />
          <span className="h-2 w-2 rounded-full border-2 border-[#e5534b]" />
        </div>
      </div>
      <div
        className="h-[86px] w-[78px] skew-y-3 rounded-r-md border-[3px] border-l-0 bg-[#f4f6fb] p-2"
        style={{ borderColor: ink }}
      >
        <div className="rounded border-2 border-[#f2a93b] bg-[#fde7c2] p-1">
          <div className="h-0.5 w-8 bg-[#d98a1c]" />
          <div className="mt-1 h-0.5 w-6 bg-[#d98a1c]" />
        </div>
        {[10, 8].map((w, i) => (
          <div
            key={i}
            className="mt-1.5 h-1 rounded bg-[#9aa3ad]"
            style={{ width: w * 4 }}
          />
        ))}
      </div>
    </div>
    <span
      className="absolute left-[70px] -top-3 h-6 w-2.5 bg-[#e5534b]"
      style={{ clipPath: "polygon(0 0,100% 0,100% 100%,50% 75%,0 100%)" }}
    />
    <span
      className="absolute -right-4 -top-5 grid h-8 w-8 place-items-center rounded-full border-[3px] bg-[#3fb68b] text-sm font-bold text-white a-spin-pop"
      style={{ borderColor: ink }}
    >
      ✓
    </span>
  </div>
);

const PdfArt = () => (
  <div className="relative h-[92px] w-[76px]">
    <div
      className="absolute left-2 top-0 h-full w-full rounded-lg border-[3px] bg-white"
      style={{ borderColor: ink }}
    />
    <div
      className="absolute left-0 top-1 h-full w-full rounded-lg border-[3px] bg-white p-2"
      style={{ borderColor: ink }}
    >
      <span className="rounded-sm bg-[#e5534b] px-1 text-[7px] font-bold text-white">
        PDF
      </span>
      <div className="mt-2 grid grid-cols-2 gap-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="h-0.5 rounded bg-[#9aa3ad]" />
        ))}
      </div>
    </div>
    <span
      className="absolute -bottom-3 left-1/2 grid h-9 w-9 -translate-x-1/2 place-items-center rounded-full border-[3px] bg-[#3fb68b] text-white a-drop"
      style={{ borderColor: ink }}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M12 5v12m-5-5 5 5 5-5" />
      </svg>
    </span>
  </div>
);

const LiveArt = () => (
  <Laptop dark>
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-0.5 rounded-sm bg-[#e5534b] px-1 text-[6px] font-bold text-white">
        <span className="h-1 w-1 animate-pulse rounded-full bg-white" />
        LIVE
      </span>
      <span
        className="h-3 w-3 animate-spin rounded-full border-2 border-[#e5534b] border-l-transparent"
        style={{ animationDuration: "2.5s" }}
      />
    </div>
    <div className="mt-1 flex items-end justify-center gap-1.5">
      {[
        { h: 26, n: 2, c: "#9aa3ad", b: "#3a4352" },
        { h: 36, n: 1, c: "#3fb68b", b: "#1f6b4f" },
        { h: 20, n: 3, c: "#d98a1c", b: "#3a4352" },
      ].map((x) => (
        <div key={x.n} className="flex flex-col items-center gap-0.5">
          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{ background: x.c }}
          />
          <span
            className="grid w-6 place-items-center rounded-t-sm text-[8px] font-bold text-white"
            style={{ height: x.h, background: x.b }}
          >
            {x.n}
          </span>
        </div>
      ))}
    </div>
  </Laptop>
);

const StreakArt = () => (
  <div className="relative">
    <div
      className="h-[92px] w-[84px] overflow-hidden rounded-xl border-[3px] bg-white"
      style={{ borderColor: ink }}
    >
      <div className="flex h-4 items-center justify-between bg-[#e5534b] px-2">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </div>
      <div className="grid h-[52px] place-items-center text-3xl">
        <span className="a-flicker inline-block">🔥</span>
      </div>
      <div
        className="mx-1.5 flex items-center gap-1 rounded-md bg-[#1d2430] px-1.5 py-0.5 text-[7px] text-white"
        style={display}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#f2a93b]" />৭ দিনের
        স্ট্রিক
      </div>
    </div>
    <span
      className="absolute -right-3 -top-3 grid h-7 w-7 place-items-center rounded-full border-[3px] bg-[#f2a93b] text-[10px] text-white"
      style={{ borderColor: ink }}
    >
      ★
    </span>
  </div>
);

const RevisionArt = () => (
  <div className="relative pl-8">
    <span className="absolute -left-1 -top-3 grid h-7 w-7 place-items-center rounded-md border-2 border-[#3fb68b] bg-[#e3f6ec] text-sm text-[#3fb68b]">
      ✓
    </span>
    <span className="absolute -left-1 top-6 h-0.5 w-6 bg-[#bfe6d2]" />
    <div
      className="relative h-[82px] w-[96px] rounded-lg border-[3px] bg-white p-2.5"
      style={{ borderColor: ink }}
    >
      <div className="absolute -left-2 top-1.5 flex flex-col gap-1.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <span
            key={i}
            className="h-1.5 w-3 rounded-full border-2 bg-white"
            style={{ borderColor: ink }}
          />
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <span className="grid h-6 w-6 place-items-center rounded-md border-2 border-[#e5534b] bg-[#fde8e6] text-xs font-bold text-[#e5534b]">
          ✕
        </span>
        <span className="text-sm font-bold text-[#6470f0] a-nudge">→</span>
      </div>
      <div className="mt-2 h-0.5 w-10 bg-[#9aa3ad]" />
      <div
        className="mt-2 flex items-center gap-1 rounded border border-[#d9dee6] px-1 py-0.5 text-[6px] text-[#4a5358]"
        style={display}
      >
        <span className="h-1 w-1 rounded-full bg-[#3fb68b]" />
        স্মার্ট নোটবুক
      </div>
    </div>
  </div>
);

const items = [
  {
    t: "রিয়েল এক্সাম ও অপশন লকিং",
    d: "আসল পরীক্ষার মতো টাইমার, একবার ক্লিকেই উত্তর লক।",
    art: <ExamArt />,
    glow: "#3fb68b",
  },
  {
    t: "প্রমাণসহ বিস্তারিত সমাধান",
    d: "মূল পাঠ্যবইয়ের রেফারেন্সসহ প্রতিটি উত্তরের ব্যাখ্যা।",
    art: <BookArt />,
    glow: "#f2a93b",
  },
  {
    t: "অফলাইন PDF ডাউনলোড",
    d: "যেকোনো সেট ডাউনলোড করো, ইন্টারনেট ছাড়াই পড়ো।",
    art: <PdfArt />,
    glow: "#e5534b",
  },
  {
    t: "লাইভ মডেল টেস্ট",
    d: "হাজারো শিক্ষার্থীর সাথে একসাথে পরীক্ষা, সাথে সাথে র‍্যাংক।",
    art: <LiveArt />,
    glow: "#e5534b",
    live: true,
  },
  {
    t: "ডেইলি স্ট্রাইক ও লিডারবোর্ড",
    d: "প্রতিদিনের অভ্যাস ধরে রাখো, বন্ধুদের ছাড়িয়ে যাও।",
    art: <StreakArt />,
    glow: "#f2a93b",
  },
  {
    t: "ভুল প্রশ্নের স্মার্ট রিভিশন",
    d: "যেখানে ভুল, সেগুলো আলাদা করে আবার প্র্যাকটিস।",
    art: <RevisionArt />,
    glow: "#6470f0",
  },
];

export default function Features() {
  const [spot, setSpot] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setSpot((s) => (s + 1) % items.length),
      2600
    );
    return () => clearInterval(t);
  }, []);

  return (
    <section id="features" className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div data-reveal className="text-center">
        <h2 className="text-4xl font-bold leading-tight md:text-5xl" style={display}>
          তোমার প্রস্তুতিকে দাও
          <br />
          <span className="bg-gradient-to-r from-[#ff7a6e] to-[#e5534b] bg-clip-text text-transparent">
            নতুন মাত্রা
          </span>
        </h2>
      </div>

      <div className="-mx-5 mt-10 grid snap-x snap-mandatory auto-cols-[82%] grid-flow-col grid-rows-2 gap-4 overflow-x-auto scroll-px-5 px-5 pb-4 pt-2 [scrollbar-width:none] sm:mx-0 sm:auto-cols-auto sm:grid-flow-row sm:grid-cols-2 sm:grid-rows-none sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0 md:mt-16 lg:grid-cols-3">
        {items.map((f, i) => (
          <article
            key={f.t}
            data-reveal
            style={{
              ["--d" as string]: `${(i % 3) * 120}ms`,
              ...(spot === i
                ? {
                    backgroundImage: `linear-gradient(180deg, ${f.glow}, ${f.glow}10)`,
                    boxShadow: `0 30px 70px -30px ${f.glow}`,
                  }
                : {}),
            }}
            className={`group relative snap-start rounded-[20px] bg-gradient-to-b sm:rounded-[26px] from-white/15 to-white/[0.03] p-px transition-all duration-700 hover:-translate-y-1.5 hover:from-white/30 ${
              spot === i ? "-translate-y-1.5" : ""
            }`}
          >
            <div className="h-full rounded-[19px] bg-[#121313] p-3.5 sm:rounded-[25px] sm:p-4">
              <div className="relative grid h-[170px] place-items-center overflow-hidden rounded-[16px] bg-white sm:h-[200px] sm:rounded-[18px]">
                <div
                  className="absolute inset-0 opacity-[0.5]"
                  style={{
                    backgroundImage:
                      "radial-gradient(#dfe3ea 1px, transparent 1px)",
                    backgroundSize: "14px 14px",
                  }}
                />
                <div
                  className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl a-glow"
                  style={{
                    background: f.glow,
                    animationDelay: `${i * 0.6}s`,
                  }}
                />
                <div
                  className="relative origin-center scale-[0.85] a-bob sm:scale-100"
                  style={{ animationDelay: `${i * 0.3}s` }}
                >
                  {f.art}
                </div>
              </div>
              <div className="px-1 pb-1.5 pt-3 text-center sm:px-2 sm:pb-2 sm:pt-5">
                <h3
                  className="flex flex-wrap items-center justify-center gap-1.5 text-center text-lg font-bold leading-snug sm:gap-2 sm:text-xl"
                  style={display}
                >
                  {f.t}
                  {f.live && (
                    <span
                      className="flex items-center gap-1 rounded-full bg-[#e5534b]/15 px-2 py-0.5 text-[11px] font-bold text-[#ff7a6e] ring-1 ring-[#e5534b]/30"
                      style={{ fontFamily: "system-ui" }}
                    >
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#e5534b]" />
                      LIVE
                    </span>
                  )}
                </h3>
                <p className="mt-1 text-sm text-white/50">{f.d}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
