'use client';

import React, { useState } from "react";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };
const pro = [
  "আনলিমিটেড মক টেস্ট ও প্র্যাকটিস",
  "প্রতিটি প্রশ্নের বিস্তারিত ব্যাখ্যা ও সমাধান",
  "৫০+ ও ১০০ প্রশ্নের ফুল মডেল টেস্ট",
  "আনলিমিটেড বুকমার্ক ও রিভিশন লিস্ট",
  "বিষয়ভিত্তিক দুর্বলতা ট্র্যাকার ও গ্রাফ",
  "সম্পূর্ণ বিজ্ঞাপনমুক্ত প্রিমিয়াম অভিজ্ঞতা",
];

const plans = [
  {
    n: "ফ্রি প্ল্যান",
    p: "০",
    per: "চিরকাল ফ্রি",
    f: [
      "প্রতিদিন ২টি ফ্রি এক্সাম",
      "সর্বোচ্চ ৫০টি প্রশ্নের এক্সাম সেটআপ",
      "সর্বোচ্চ ২৫টি বুকমার্ক সংরক্ষণ",
      "লাইভ এক্সামে পূর্ণ এক্সেস",
      "স্ট্রিক ও বেসিক লিডারবোর্ড",
    ],
    cta: "বিনামূল্যে শুরু করো",
  },
  {
    n: "মাসিক প্ল্যান",
    sub: "১ মাস",
    p: "১৪৯",
    per: "/মাস",
    f: pro,
    cta: "প্ল্যানটি বেছে নাও",
  },
  {
    n: "এডমিশন প্যাক",
    sub: "৩ মাস",
    p: "৩৪৯",
    old: "৪৪৭",
    per: "/৩ মাস",
    save: "২২% সাশ্রয়",
    f: pro,
    cta: "প্ল্যানটি বেছে নাও",
    hi: true,
  },
  {
    n: "ফুল সেশন প্যাক",
    sub: "৬ মাস",
    p: "৫৯৯",
    old: "৮৯৪",
    per: "/৬ মাস",
    save: "৩৩% সাশ্রয়",
    f: pro,
    cta: "প্ল্যানটি বেছে নাও",
  },
];

const paid = plans.slice(1);

const Check = ({ c }: { c: string }) => (
  <svg
    viewBox="0 0 20 20"
    className="mt-[3px] h-4 w-4 shrink-0"
    fill="none"
    stroke={c}
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m4.5 10.5 3.5 3.5 7.5-8" />
  </svg>
);

export default function Pricing({ onStart }: { onStart: () => void }) {
  const [sel, setSel] = useState(1);

  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-5 py-16 md:py-24">
      <div className="pointer-events-none absolute left-1/2 top-40 h-[420px] w-[700px] -translate-x-1/2 rounded-full bg-[#5fcf6b]/10 blur-[130px]" />
      <div data-reveal className="relative text-center">
        <h2 className="text-4xl font-extrabold leading-tight md:text-5xl" style={display}>
          তোমার প্রস্তুতির সেরা প্ল্যানটি{" "}
          <span className="bg-gradient-to-r from-[#7ee0a4] to-[#5fcf6b] bg-clip-text text-transparent">
            বেছে নাও
          </span>
        </h2>
      </div>

      <div
        data-reveal
        className="relative mx-auto mt-8 flex w-full max-w-md rounded-2xl sm:mt-12 sm:w-fit sm:max-w-none border border-white/10 bg-white/[0.03] p-1.5 backdrop-blur"
      >
        {paid.map((p, i) => (
          <button
            key={p.n}
            type="button"
            onClick={() => setSel(i)}
            className={`relative flex-1 whitespace-nowrap rounded-xl px-1.5 py-2.5 text-[13px] font-semibold transition sm:flex-none sm:px-6 sm:py-2.5 sm:text-sm ${
              sel === i ? "text-white" : "text-white/60 hover:text-white"
            }`}
            style={display}
          >
            {sel === i && (
              <span className="absolute inset-0 rounded-xl bg-[#0b5a50] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_6px_24px_-6px_#0b5a50]" />
            )}
            <span className="relative">{p.n}</span>
            {p.hi && (
              <span
                className={`relative ml-1 rounded px-1 text-[10px] sm:ml-1.5 ${
                  sel === i ? "bg-white/15" : "bg-[#5fcf6b]/15 text-[#7ee0a4]"
                }`}
              >
                ★
              </span>
            )}
          </button>
        ))}
      </div>

      <div
        data-reveal
        className="relative mx-auto mt-8 grid max-w-3xl items-stretch gap-6 sm:mt-10 md:grid-cols-2"
      >
        {[plans[0], paid[sel]].map((p, i) => {
          const on = i === 1;
          return (
            <div
              key={on ? p.n : "free"}
              className={`group relative rounded-[26px] p-px transition duration-300 hover:-translate-y-1.5 ${
                on
                  ? "order-first md:order-none bg-gradient-to-b from-[#7ee0a4] via-[#5fcf6b]/60 to-[#5fcf6b]/10 a-halo"
                  : "bg-gradient-to-b from-white/15 to-white/[0.03]"
              }`}
            >
              {on && p.hi && (
                <span className="absolute -top-3.5 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#5fcf6b] px-4 py-1 text-xs font-bold text-[#06210c] shadow-[0_6px_20px_-4px_#5fcf6b]">
                  ★ মোস্ট পপুলার
                </span>
              )}
              <div
                className={`flex h-full flex-col rounded-[25px] p-6 sm:p-7 ${
                  on
                    ? "animate-[fadeUp_.5s_ease] bg-gradient-to-b from-[#14231a] to-[#111413]"
                    : "bg-[#121313]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      on ? "text-[#7ee0a4]" : "text-white/60"
                    }`}
                  >
                    {p.n}
                    {p.sub && (
                      <span className="text-white/35"> · {p.sub}</span>
                    )}
                  </span>
                  {p.save && (
                    <span className="rounded-md bg-[#5fcf6b]/12 px-2 py-0.5 text-[11px] font-semibold text-[#7ee0a4] ring-1 ring-[#5fcf6b]/25">
                      {p.save}
                    </span>
                  )}
                </div>
                <div className="mt-5 flex items-end gap-2">
                  <span
                    className="text-5xl font-extrabold tracking-tight"
                    style={display}
                  >
                    ৳{p.p}
                  </span>
                  {p.old && (
                    <span className="mb-1.5 text-sm text-white/30 line-through">
                      ৳{p.old}
                    </span>
                  )}
                </div>
                <span className="mt-1 text-sm text-white/40">{p.per}</span>

                <div className="my-6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                <ul className="flex-1 space-y-3 text-[15px] text-white/75">
                  {p.f.map((f) => (
                    <li key={f} className="flex gap-3">
                      <Check c={on ? "#5fcf6b" : "#6cb6f0"} />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={onStart}
                  className={`mt-8 w-full rounded-xl py-3.5 font-semibold transition active:translate-y-0.5 active:shadow-none ${
                    on
                      ? "bg-[#5fcf6b] text-[#06210c] shadow-[0_4px_0_#3aa145] hover:bg-[#6ee67b]"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {p.cta} →
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
