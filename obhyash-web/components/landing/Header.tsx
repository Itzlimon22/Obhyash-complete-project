'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };
const exams = [
  ["এসএসসি", "বোর্ড প্রস্তুতি · ৯ম-১০ম"],
  ["এইচএসসি", "বোর্ড প্রস্তুতি · ১১শ-১২শ"],
  ["ভর্তি পরীক্ষা", "মেডিকেল · ইঞ্জিনিয়ারিং · ভার্সিটি"],
];
const links = [
  ["ফিচার", "#features"],
  ["কীভাবে কাজ করে", "#how"],
  ["প্রাইসিং", "#pricing"],
  ["ব্লগ", "/blog"],
];

export default function Header({ onStart }: { onStart: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [drop, setDrop] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const f = () => {
      const y = window.scrollY;
      setScrolled(y > 12);
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > 120);
        last = y;
      }
    };
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);

  return (
    <div
      className={`sticky top-0 z-40 transition-transform duration-500 ease-[cubic-bezier(.2,.7,.2,1)] ${
        hidden && !drop ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <header
        className={`transition-all duration-300 ${
          scrolled
            ? "border-b border-white/10 bg-[#0a0b0b]/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.8)] backdrop-blur-2xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div
          className={`relative mx-auto flex max-w-6xl items-center gap-3 px-4 transition-all sm:gap-6 sm:px-5 ${
            scrolled ? "py-2.5" : "py-4"
          }`}
        >
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/landing/logo-white.svg"
              alt="অভ্যাস"
              className="h-8 w-auto sm:h-9"
            />
          </Link>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 text-[15px] lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setDrop(true)}
              onMouseLeave={() => setDrop(false)}
            >
              <button
                type="button"
                onClick={() => setDrop(!drop)}
                className="flex items-center gap-1 rounded-lg px-3.5 py-2 text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                পরীক্ষা{" "}
                <svg
                  viewBox="0 0 20 20"
                  className={`h-4 w-4 transition ${drop ? "rotate-180" : ""}`}
                  fill="currentColor"
                >
                  <path
                    d="M5.5 7.5 10 12l4.5-4.5"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    fill="none"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <div
                className={`absolute left-0 top-full pt-2 transition ${
                  drop
                    ? "visible translate-y-0 opacity-100"
                    : "invisible -translate-y-1 opacity-0"
                }`}
              >
                <div className="grid w-[420px] grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#131515]/95 p-2 shadow-2xl backdrop-blur-xl">
                  {exams.map(([t, d], i) => (
                    <button
                      key={t}
                      type="button"
                      onClick={onStart}
                      className="group rounded-xl p-3 text-left transition hover:bg-white/5"
                    >
                      <span className="flex items-center gap-2 font-semibold">
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{
                            background: [
                              "#e5534b",
                              "#3fb68b",
                              "#f2b84b",
                              "#5aa9e6",
                            ][i],
                          }}
                        />
                        {t}
                      </span>
                      <span className="mt-0.5 block text-xs text-white/45">
                        {d}
                      </span>
                    </button>
                  ))}
                  <div className="col-span-2 mt-1 flex items-center justify-between rounded-xl bg-[#e5534b]/10 px-3 py-2.5 text-sm">
                    <span className="text-white/80">
                      নতুন: বিগত ১০ বছরের প্রশ্ন
                    </span>
                    <button
                      type="button"
                      onClick={onStart}
                      className="font-semibold text-[#ff6b5e]"
                    >
                      দেখো →
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {links.map(([l, h]) => (
              <a
                key={l}
                href={h}
                className="rounded-lg px-3.5 py-2 text-white/70 transition hover:bg-white/5 hover:text-white"
              >
                {l}
              </a>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={onStart}
              className="flex items-center gap-2 rounded-xl bg-[#0b5a50] px-4 py-2.5 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_0_#063b34] transition hover:bg-[#0e6b5f] active:translate-y-0.5 active:shadow-none"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M4 21a8 8 0 0 1 16 0" />
              </svg>
              <span className="hidden sm:inline">লগইন / রেজিস্ট্রেশন</span>
              <span className="sm:hidden">লগইন</span>
            </button>
          </div>
        </div>
      </header>
    </div>
  );
}
