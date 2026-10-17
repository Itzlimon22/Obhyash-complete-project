'use client';

import React from "react";
import { GooglePlayIcon } from "./BrandIcons";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };
const sans = { fontFamily: "'DM Sans', system-ui, sans-serif" };

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.obhyash.app";

const Badge = ({
  href,
  icon,
  top,
  bottom,
}: {
  href: string;
  icon: React.ReactNode;
  top: string;
  bottom: string;
}) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className="group flex h-[58px] items-center gap-3 rounded-xl border border-white/25 bg-black px-4 text-white shadow-[0_10px_30px_-10px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5 hover:border-white/50"
    style={sans}
  >
    {icon}
    <span className="leading-tight">
      <span className="block text-[11px] font-medium">{top}</span>
      <span className="block text-[21px] font-semibold tracking-tight">
        {bottom}
      </span>
    </span>
  </a>
);

export default function AppBanner() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#0e7a8a] via-[#0a6170] to-[#074652]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/30" />
      <div className="pointer-events-none absolute -left-20 -top-24 h-72 w-72 rounded-full bg-[#5fe0f0]/20 blur-[90px]" />

      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-[55%] overflow-hidden opacity-[0.12]"
      >
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="absolute -top-10 h-[150%] w-16 rotate-[20deg] bg-white"
            style={{ right: `${18 + i * 9}%` }}
          />
        ))}
        <svg
          viewBox="0 0 24 24"
          className="absolute right-[6%] top-2 h-24 w-24 text-white a-float"
          fill="currentColor"
        >
          <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.7 7.3L12 17.6l-6.3 3.9 1.7-7.3L2 9.5l7.1-.6L12 2z" />
        </svg>
        <svg
          viewBox="0 0 24 24"
          className="absolute right-[36%] top-3 h-16 w-16 text-white a-drop"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
        >
          <path d="M12 3v12m-5-5 5 5 5-5M4 19h16" />
        </svg>
      </div>

      <div className="relative mx-auto flex max-w-6xl flex-col items-center justify-between gap-7 px-5 py-10 md:flex-row md:py-12">
        <div className="text-center md:text-left">
          <h2
            className="flex flex-wrap items-center justify-center gap-3 text-3xl font-bold text-white md:justify-start md:text-[42px]"
            style={display}
          >
            ডাউনলোড অভ্যাস অ্যাপ
          </h2>
        </div>
        <div className="flex flex-wrap justify-center gap-3">
          <Badge
            href={PLAY_STORE_URL}
            icon={<GooglePlayIcon className="h-7 w-7" />}
            top="GET IT ON"
            bottom="Google Play"
          />
        </div>
      </div>
    </section>
  );
}
