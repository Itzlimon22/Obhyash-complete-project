'use client';

import React, { useState } from "react";
import Link from "next/link";
import {
  GooglePlayIcon,
  FacebookIcon,
  YouTubeIcon,
  WhatsAppIcon,
} from "./BrandIcons";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };
const quick = [
  ["হোম", "/"],
  ["ফিচারসমূহ", "#features"],
  ["কীভাবে কাজ করে", "#how"],
  ["প্রাইসিং", "#pricing"],
  ["ব্লগ", "/blog"],
];
const policy = [
  { name: "About Us", href: "/about-us" },
  { name: "Privacy Policy", href: "/privacy-policy" },
  { name: "Terms & Conditions", href: "/terms-and-conditions" },
  { name: "Refund Policy", href: "/refund-policy" },
  { name: "FAQ", href: "/about-us#faq" },
];

const Icon = ({
  d,
  className = "h-4 w-4",
}: {
  d: string;
  className?: string;
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d={d} />
  </svg>
);

const socials = [
  { n: "Facebook", href: "https://facebook.com/obhyash", I: FacebookIcon },
  { n: "YouTube", href: "https://www.youtube.com/@obhyash", I: YouTubeIcon },
  { n: "WhatsApp", href: "https://wa.me/8801409583992", I: WhatsAppIcon },
];

const contact = [
  {
    d: "M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Zm0-9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
    t: "লেভেল ৪, উত্তরা সেক্টর ১৩,\nঢাকা-১২৩০, বাংলাদেশ",
    h: "https://maps.google.com/?q=Uttara+Sector+13+Dhaka",
  },
  {
    d: "M5 4h3l1.5 4-2 1.5a11 11 0 0 0 7 7l1.5-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z",
    t: "+880 1409-583992",
    h: "tel:+8801409583992",
  },
  {
    d: "M3 6.5A1.5 1.5 0 0 1 4.5 5h15A1.5 1.5 0 0 1 21 6.5v11a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 17.5v-11Zm0 .5 9 6 9-6",
    t: "support@obhyash.com",
    h: "mailto:support@obhyash.com",
  },
];

const Heading = ({ children }: { children: string }) => (
  <h4 className="flex items-center gap-2 text-lg font-bold" style={display}>
    <span className="h-4 w-1 rounded-full bg-gradient-to-b from-[#3fb68b] to-[#0b5a50]" />
    {children}
  </h4>
);

const linkCls =
  "group inline-flex items-center gap-2 text-sm text-white/55 sm:text-base transition hover:text-white";
const Arrow = () => (
  <span className="-ml-4 opacity-0 transition-all group-hover:ml-0 group-hover:opacity-100 text-[#3fb68b]">
    ›
  </span>
);

export default function Footer({ onStart }: { onStart: () => void }) {
  const [copied, setCopied] = useState(false);

  return (
    <footer className="relative overflow-hidden border-t border-white/[0.06] bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#3fb68b]/25 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-5">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 pt-14 pb-12 sm:gap-12 sm:pt-16 sm:pb-14 lg:grid-cols-[1.3fr_0.8fr_1.2fr_1.1fr]">
          <div className="col-span-2 sm:col-span-1">
            <Link href="/" className="flex items-center gap-3">
              <img
                src="/landing/logo-white.svg"
                alt="অভ্যাস"
                className="h-11 w-auto"
              />
            </Link>
            <p className="mt-5 max-w-xs text-[15px] leading-relaxed text-white/50">
              HSC, ইঞ্জিনিয়ারিং, মেডিকেল ও ভার্সিটি ভর্তি পরীক্ষার জন্য
              বাংলাদেশের সবচেয়ে দ্রুত ও আধুনিক অনলাইন এক্সাম ও প্র্যাকটিস
              প্ল্যাটফর্ম।
            </p>
            <div className="mt-6 flex gap-2.5">
              {socials.map(({ n, href, I }) => (
                <a
                  key={n}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={n}
                  className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/[0.04] transition hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.08]"
                >
                  <I className="h-5 w-5" />
                </a>
              ))}
            </div>
            <a
              href="https://play.google.com/store/apps/details?id=com.obhyash.app"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 transition hover:border-white/25 hover:bg-white/[0.06]"
            >
              <GooglePlayIcon className="h-7 w-7" />
              <span
                className="leading-tight"
                style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}
              >
                <span className="block text-[10px] font-medium uppercase tracking-wider text-white/55">
                  Get it on
                </span>
                <span className="text-lg font-semibold">Google Play</span>
              </span>
            </a>
          </div>

          <div className="hidden sm:block">
            <Heading>দ্রুত লিংক</Heading>
            <ul className="mt-5 space-y-3.5">
              {quick.map(([l, h]) => (
                <li key={l}>
                  <a href={h} className={linkCls}>
                    <Arrow />
                    {l}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1">
            <Heading>রিসোর্স ও পলিসি</Heading>
            <ul className="mt-5 space-y-3.5">
              {policy.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={linkCls}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <Arrow />
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href="/referral-program" className={linkCls}>
                  <Arrow />
                  রেফারেল প্রোগ্রাম
                </Link>
              </li>
              <li>
                <Link href="/affiliate" className={linkCls}>
                  <Arrow />
                  অ্যাফিলিয়েট প্রোগ্রাম
                </Link>
              </li>
            </ul>
          </div>

          <div className="col-span-1 min-w-0">
            <Heading>যোগাযোগ</Heading>
            <ul className="mt-5 space-y-3">
              {contact.map((c, i) => (
                <li key={c.t}>
                  <a
                    href={c.h}
                    target={i === 0 ? "_blank" : undefined}
                    rel="noreferrer"
                    onClick={
                      i === 2
                        ? (e) => {
                            if (navigator.clipboard) {
                              navigator.clipboard.writeText(c.t);
                              setCopied(true);
                              setTimeout(() => setCopied(false), 1800);
                            }
                          }
                        : undefined
                    }
                    className="group flex items-start gap-2 rounded-xl p-2 -m-2 sm:gap-3 transition hover:bg-white/[0.04]"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg sm:h-9 sm:w-9 bg-[#3fb68b]/10 text-[#3fb68b] ring-1 ring-[#3fb68b]/20 transition group-hover:bg-[#3fb68b] group-hover:text-[#06210c]">
                      <Icon d={c.d} />
                    </span>
                    <span className="min-w-0 whitespace-pre-line break-words pt-1 text-[13px] leading-snug sm:pt-1.5 sm:text-[15px] text-white/60 group-hover:text-white">
                      {c.t}
                      {i === 2 && copied && (
                        <span className="ml-2 text-xs text-[#7ee0a4]">
                          কপি হয়েছে
                        </span>
                      )}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 py-6 text-sm text-white/40 sm:flex-row">
          <p>© ২০২৬ Obhyash Platform. সর্বস্বত্ব সংরক্ষিত।</p>
          <div
            className="flex items-center gap-2 text-white/60"
            style={display}
          >
            অভ্যাসে শুরু{" "}
            <span className="h-px w-6 bg-gradient-to-r from-[#e5534b] to-[#3fb68b]" />{" "}
            সাফল্যে শেষ
          </div>
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-1.5 transition hover:border-white/25 hover:text-white"
          >
            ওপরে যাও ↑
          </button>
        </div>
      </div>
    </footer>
  );
}
