'use client';

import React from "react";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };

type R = {
  q: string;
  n: string;
  i: string;
  tag: string;
  col: string;
  goal: string;
  c: string;
  s: number;
};

const reviews: R[] = [
  {
    q: 'টেস্ট পরীক্ষার আগে রিভিশনের জন্য "মিস্টেক নোটবুক" ফিচারটা জাস্ট লাইফসেভার ছিল! যেসব প্রশ্ন আগে ভুল করতাম, সেগুলো আলাদা করে স্পেশাল টেস্ট দিতে পেরে দুর্বল চ্যাপ্টারগুলো খুব দ্রুত কভার হয়ে গেছে।',
    n: "তৌহিদুল ইসলাম",
    i: "তৌ",
    tag: "HSC '25",
    col: "ঢাকা কলেজ",
    goal: 'HSC বোর্ড ও ঢাবি "ক" ইউনিট',
    c: "#3fb68b",
    s: 5,
  },
  {
    q: "বাজারের গাইড বইগুলোতে প্রচুর ভুল উত্তর থাকে, যা নিয়ে সবসময় টেনশনে থাকতাম। অভ্যাসের প্রতিটা সলিউশনে এনসিটিবি অনুমোদিত বইয়ের পৃষ্ঠা নম্বর সহ নিখুঁত প্রমাণ দেওয়া থাকে, তাই চোখ বন্ধ করে ভরসা করা যায়।",
    n: "মেহজাবিন চৌধুরী",
    i: "মে",
    tag: "HSC '24",
    col: "ভিকারুননিসা নূন কলেজ",
    goal: "মেডিকেল ও ডেন্টাল প্রস্তুতি",
    c: "#8b5cf6",
    s: 5,
  },
  {
    q: "কোচিংয়ের দীর্ঘ ট্রাফিক জ্যাম এড়িয়ে ঘরে বসেই ডেইলি অধ্যায় শেষ করে এখানে স্পিড টেস্ট দেই। সাবমিট করার সাথে সাথে ইনস্ট্যান্ট লিডারবোর্ড র‍্যাঙ্ক ও পার্সেন্টাইল দেখে প্রস্তুতি কোন লেভেলে আছে স্পষ্ট বোঝা যায়।",
    n: "ফারহান সাদিক",
    i: "ফা",
    tag: "HSC '25",
    col: "রাজউক উত্তরা মডেল কলেজ",
    goal: "ইঞ্জিনিয়ারিং ও আইইউটি",
    c: "#e8833a",
    s: 5,
  },
  {
    q: "বিগত ২০ বছরের সব শিক্ষা বোর্ডের প্রশ্ন এত সুন্দরভাবে অধ্যায় ও টপিক অনুযায়ী সাজানো যে বোর্ড পেপারের প্রতিটি সৃজনশীল প্রশ্নের প্যাটার্ন এক নজরে বোঝা যায়। এর চেয়ে গোছানো সিস্টেম আর দেখিনি।",
    n: "সাদিয়া তাসনিম",
    i: "সা",
    tag: "HSC '24",
    col: "চট্টগ্রাম কলেজ",
    goal: "HSC বোর্ড প্রস্তুতি",
    c: "#3fb68b",
    s: 4.5,
  },
  {
    q: "রিয়েল টাইমার আর অপশন লকিং-এর কারণে আসল পরীক্ষার হলের মতো চাপ নিয়ে প্র্যাকটিস করা যায়। ভর্তি পরীক্ষায় সময় ম্যানেজমেন্টে এটা সবচেয়ে বেশি কাজে দিয়েছে।",
    n: "আরিফ হোসেন",
    i: "আ",
    tag: "HSC '24",
    col: "নটর ডেম কলেজ",
    goal: "বুয়েট ও কুয়েট",
    c: "#5aa9e6",
    s: 5,
  },
  {
    q: "এনালাইসিস পেজটা দেখে বুঝলাম জৈব রসায়নে আমি সবচেয়ে দুর্বল। দুই সপ্তাহ শুধু ওই অধ্যায় প্র্যাকটিস করে নির্ভুলতা ৪০% থেকে ৮৫%-এ নিয়ে গেছি।",
    n: "নুসরাত জাহান",
    i: "নু",
    tag: "HSC '25",
    col: "হলি ক্রস কলেজ",
    goal: "মেডিকেল প্রস্তুতি",
    c: "#e5534b",
    s: 5,
  },
  {
    q: "অফলাইন PDF ফিচারটার জন্য গ্রামের বাড়িতে নেট না থাকলেও পড়া থামেনি। প্রশ্ন ডাউনলোড করে রেখে যেকোনো জায়গায় প্র্যাকটিস করেছি।",
    n: "রাকিবুল হাসান",
    i: "রা",
    tag: "HSC '24",
    col: "রাজশাহী কলেজ",
    goal: "রুয়েট ও গুচ্ছ",
    c: "#f2a93b",
    s: 4.5,
  },
  {
    q: "লিডারবোর্ডে বন্ধুদের সাথে প্রতিযোগিতা করতে গিয়ে প্রতিদিন প্র্যাকটিস একটা অভ্যাসে পরিণত হয়েছে। ৬০ দিনের স্ট্রিক এখনো চলছে!",
    n: "তানজিলা আক্তার",
    i: "তা",
    tag: "HSC '25",
    col: "সিলেট সরকারি মহিলা কলেজ",
    goal: 'ঢাবি "খ" ইউনিট',
    c: "#8b5cf6",
    s: 5,
  },
];

const Star = ({ fill }: { fill: number }) => (
  <span className="relative inline-block h-4 w-4">
    <svg
      viewBox="0 0 20 20"
      className="absolute inset-0 h-4 w-4 text-white/15"
      fill="currentColor"
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
    <span
      className="absolute inset-0 overflow-hidden"
      style={{ width: `${fill * 100}%` }}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 text-[#f5c04a] drop-shadow-[0_0_6px_rgba(245,192,74,0.5)]"
        fill="currentColor"
      >
        <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
      </svg>
    </span>
  </span>
);

function Card({ r }: { r: R }) {
  return (
    <figure
      className="group relative w-[340px] shrink-0 rounded-[24px] bg-gradient-to-b from-white/12 to-white/[0.03] p-px transition duration-500 hover:-translate-y-1.5 sm:w-[400px]"
      style={{ ["--c" as string]: r.c }}
    >
      <div
        className="absolute inset-0 rounded-[24px] opacity-0 transition duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(180deg, ${r.c}, ${r.c}10)` }}
      />
      <div className="relative flex h-full flex-col rounded-[23px] bg-[#111313] p-6">
        <span
          aria-hidden
          className="pointer-events-none absolute right-5 top-2 text-[90px] leading-none opacity-[0.06]"
          style={{ ...display, color: r.c }}
        >
          "
        </span>
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map((k) => (
              <Star key={k} fill={Math.max(0, Math.min(1, r.s - k))} />
            ))}
          </div>
          <span className="flex items-center gap-1 rounded-full bg-[#3fb68b]/10 px-2.5 py-1 text-[11px] font-semibold text-[#7ee0a4] ring-1 ring-[#3fb68b]/25">
            <svg
              viewBox="0 0 20 20"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="10" cy="10" r="7.5" />
              <path
                d="m6.8 10.2 2.2 2.2 4.2-4.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            ভেরিফাইড শিক্ষার্থী
          </span>
        </div>
        <blockquote className="mt-5 flex-1 text-[15px] leading-[1.75] text-white/75">
          "{r.q}"
        </blockquote>
        <div className="my-5 h-px bg-gradient-to-r from-white/10 via-white/10 to-transparent" />
        <figcaption className="flex items-center gap-3">
          <span
            className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full text-sm font-bold text-white"
            style={{
              background: `linear-gradient(135deg, ${r.c}, ${r.c}99)`,
              boxShadow: `0 0 0 3px #111313, 0 0 0 4px ${r.c}55`,
              ...display,
            }}
          >
            {r.i}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold" style={display}>
                {r.n}
              </span>
              <span
                className="rounded-md bg-white/8 px-1.5 py-0.5 text-[11px] text-white/60 ring-1 ring-white/10"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                {r.tag}
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5 truncate text-xs">
              <span className="text-[#7ee0a4]">{r.col}</span>
              <span className="h-1 w-1 rounded-full bg-white/25" />
              <span className="truncate text-white/45">{r.goal}</span>
            </div>
          </div>
        </figcaption>
      </div>
    </figure>
  );
}

function Row({
  items,
  reverse,
  speed,
}: {
  items: R[];
  reverse?: boolean;
  speed: number;
}) {
  return (
    <div className="marquee group/row flex overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_8%,#000_92%,transparent)]">
      {[0, 1].map((k) => (
        <div
          key={k}
          aria-hidden={k === 1}
          className="flex shrink-0 gap-5 pr-5 group-hover/row:[animation-play-state:paused]"
          style={{
            animation: `marquee ${speed}s linear infinite ${
              reverse ? "reverse" : "normal"
            }`,
          }}
        >
          {items.map((r) => (
            <Card key={r.n} r={r} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const half = Math.ceil(reviews.length / 2);
  const row1 = reviews.slice(0, half);
  const row2 = reviews.slice(half);

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      <div data-reveal className="relative mx-auto max-w-6xl px-5 text-center">
        <h2 className="text-4xl font-bold md:text-5xl" style={display}>
          শিক্ষার্থীদের{" "}
          <span className="bg-gradient-to-r from-[#ff7a6e] to-[#e5534b] bg-clip-text text-transparent">
            মতামত
          </span>
        </h2>
        <p className="mt-3 text-white/50">
          সারা দেশের হাজারো শিক্ষার্থী অভ্যাস দিয়ে প্রস্তুতি নিচ্ছে প্রতিদিন।
        </p>
      </div>

      <div className="mt-12 space-y-5">
        <Row items={row1} speed={42} />
        <Row items={row2} reverse speed={48} />
      </div>
    </section>
  );
}
