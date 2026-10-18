'use client';

import Link from "next/link";
import React, { useEffect } from "react";
import { GooglePlayIcon } from "./BrandIcons";
import Header from "./Header";
import Pricing from "./Pricing";
import Features from "./Features";
import Steps from "./Steps";
import Showcase from "./Showcase";
import AppBanner from "./AppBanner";
import Testimonials from "./Testimonials";
import Footer from "./Footer";
import PhoneMock from "./PhoneMock";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.obhyash.app";

export default function Landing({ onStart }: { onStart: () => void }) {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.setAttribute("data-reveal", "in");
            io.unobserve(e.target);
          }
        }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    els.forEach((el) => io.observe(el));
    // Safety net: never leave content hidden
    const t = setInterval(
      () =>
        els.forEach((el) => {
          if (el.getBoundingClientRect().top < window.innerHeight)
            el.setAttribute("data-reveal", "in");
        }),
      1000
    );
    return () => {
      io.disconnect();
      clearInterval(t);
    };
  }, []);

  return (
    <div
      className="relative min-h-screen w-full max-w-full overflow-x-hidden bg-[#0a0b0b] text-white landing-root font-kalpurush"
      style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] overflow-hidden">
        <div className="mx-auto h-[600px] w-[min(900px,100vw)] rounded-full bg-[#e5534b]/15 blur-[140px]" />
      </div>

      <Header onStart={onStart} />

      <section className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 pb-20 pt-8 lg:grid-cols-[1.1fr_1fr] lg:pt-12">
        <div className="text-center lg:self-start lg:pt-28 lg:text-left">
          <h1
            className="text-[34px] sm:text-5xl md:text-7xl font-extrabold leading-[1.18]"
            style={display}
          >
            ভুল থেকেই
            <br />
            শুরু হোক
            <br />
            <span className="a-shimmer bg-gradient-to-r from-[#0e9aae] via-[#6fe3f2] to-[#0e9aae] bg-clip-text text-transparent">
              নিখুঁত প্রস্তুতি
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base lg:mx-0 leading-relaxed text-white/60 sm:mt-6 sm:text-lg">
            প্রশ্নব্যাংক, রিয়েল টাইমার এক্সাম আর পাঠ্যবইয়ের প্রমাণসহ সমাধান — সবকিছু
            এক প্ল্যাটফর্মে।
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:mt-9 sm:flex-row sm:flex-wrap sm:justify-center lg:justify-start">
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Google Play থেকে ইনস্টল করো"
              className="flex h-[58px] items-center justify-center gap-3 rounded-xl border border-white/25 bg-black px-4 text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5 hover:border-white/50"
              style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
            >
              <GooglePlayIcon className="h-7 w-7" />
              <span className="leading-tight">
                <span className="block text-[11px] font-medium">GET IT ON</span>
                <span className="block text-[21px] font-semibold tracking-tight">
                  Google Play
                </span>
              </span>
            </a>
            <Link
              href="/demo"
              className="group flex h-[58px] items-center justify-center gap-3 rounded-xl bg-[#8f1915] px-5 font-semibold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_4px_0_#4a0b09] transition hover:bg-[#a3201c] active:translate-y-0.5 active:shadow-none"
            >
              <span className="grid h-7 w-7 place-items-center">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="13" r="8" />
                  <path d="M12 9v4l2.5 2.5M9.5 2h5" />
                </svg>
              </span>
              ডেমো পরীক্ষা দাও
              <span className="ml-1 transition group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </div>

        <div id="demo" className="flex justify-center lg:mt-24 lg:justify-end">
          <div className="a-float">
            <PhoneMock />
          </div>
        </div>
      </section>

      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-5 py-10 text-center md:grid-cols-4">
          {[
            ["২ লক্ষ+", "প্রশ্ন"],
            ["৫০০+", "শিক্ষার্থী"],
            ["১০০০+", "মডেল টেস্ট"],
            ["৪.৯★", "রেটিং"],
          ].map(([a, b]) => (
            <div key={b}>
              <div className="text-3xl font-bold" style={display}>
                {a}
              </div>
              <div className="text-sm text-white/50">{b}</div>
            </div>
          ))}
        </div>
      </section>

      <Features />
      <Steps onStart={onStart} />
      <Showcase />
      <AppBanner />
      <Testimonials />

      <Pricing onStart={onStart} />

      <Footer onStart={onStart} />
    </div>
  );
}
