'use client';

import React, { useEffect, useRef, useState } from "react";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };
const screens = [
  {
    src: "/landing/screens/s1.png",
    t: "নিজের মতো মক পরীক্ষা",
    d: "বিষয়, অধ্যায়, পরীক্ষার ধরন আর কঠিনতা বেছে নিজের পরীক্ষা বানাও।",
    c: "#3fb68b",
  },
  {
    src: "/landing/screens/s6.png",
    t: "প্রতিষ্ঠানভিত্তিক প্রশ্নব্যাংক",
    d: "বুয়েট, মেডিকেল, ঢাবিসহ সব ভর্তি পরীক্ষার বিগত প্রশ্ন।",
    c: "#e5534b",
  },
  {
    src: "/landing/screens/s5.png",
    t: "ভুল থেকে শেখো",
    d: "সব ভুল আর বুকমার্ক এক জায়গায়, আবার প্র্যাকটিস করো।",
    c: "#f2a93b",
  },
  {
    src: "/landing/screens/s3.png",
    t: "স্মার্ট এনালাইসিস",
    d: "গড় স্কোর, নির্ভুলতা, গতি আর কোন বিষয়ে জোর দিতে হবে।",
    c: "#5aa9e6",
  },
  {
    src: "/landing/screens/s2.png",
    t: "লিডারবোর্ড ও লিগ",
    d: "লিজেন্ড, টাইটান, ওয়ারিয়র — কলেজ আর সারা দেশের সাথে প্রতিযোগিতা।",
    c: "#f2a93b",
  },
  {
    src: "/landing/screens/s4.png",
    t: "নোটস ও রিভিশন",
    d: "দ্রুত রিভিশন শিট, অনুশীলনী সমাধান, হ্যান্ডরিটেন নোট আর মাইন্ড ম্যাপ।",
    c: "#8b5cf6",
  },
];
const n = screens.length;

export default function Showcase() {
  const [active, setActive] = useState(0);
  const [w, setW] = useState(1200);
  const touch = useRef<number | null>(null);

  useEffect(() => {
    const f = () => setW(window.innerWidth);
    f();
    window.addEventListener("resize", f);
    return () => window.removeEventListener("resize", f);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % n), 3500);
    return () => clearTimeout(t);
  }, [active]);

  const go = (d: number) => setActive((a) => (a + d + n) % n);
  const mobile = w < 768;
  const phoneW = mobile ? 230 : 280;
  const gap = mobile ? 150 : 230;
  const cur = screens[active];

  return (
    <section id="app" className="relative overflow-hidden py-16 md:py-24">
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px] transition-colors duration-700"
        style={{ background: cur.c, opacity: 0.18 }}
      />

      <div data-reveal className="relative mx-auto max-w-6xl px-5 text-center">
        <h2 className="text-4xl font-bold md:text-5xl" style={display}>
          পুরো প্রস্তুতি,{" "}
          <span className="bg-gradient-to-r from-[#7ee0a4] to-[#3fb68b] bg-clip-text text-transparent">
            এক অ্যাপে
          </span>
        </h2>
        <p className="mt-3 text-white/50">
          পরীক্ষা, প্রশ্নব্যাংক, এনালাইসিস, লিডারবোর্ড আর নোটস — সবকিছু হাতের
          মুঠোয়।
        </p>
      </div>

      <div
        className="relative mx-auto mt-10 select-none md:mt-14"
        style={{ height: phoneW * 1.99 + 20, perspective: 1400 }}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current === null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {screens.map((s, i) => {
          let off = i - active;
          if (off > n / 2) off -= n;
          if (off < -n / 2) off += n;
          const abs = Math.abs(off);
          const hidden = abs > (mobile ? 1 : 2);
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActive(i)}
              aria-label={s.t}
              className="absolute left-1/2 top-0 transition-all duration-700 ease-[cubic-bezier(.2,.7,.2,1)]"
              style={{
                width: phoneW,
                transform: `translateX(calc(-50% + ${
                  off * gap
                }px)) scale(${1 - abs * 0.14}) rotateY(${off * -14}deg)`,
                zIndex: 10 - abs,
                opacity: hidden ? 0 : abs === 0 ? 1 : abs === 1 ? 0.55 : 0.25,
                filter: abs === 0 ? "none" : `blur(${abs}px) saturate(.7)`,
                pointerEvents: hidden ? "none" : "auto",
              }}
            >
              <img
                src={s.src}
                alt={s.t}
                loading="lazy"
                draggable={false}
                className="w-full mix-blend-lighten"
                style={{
                  filter:
                    abs === 0
                      ? `drop-shadow(0 40px 60px ${s.c}55)`
                      : "none",
                }}
              />
            </button>
          );
        })}

        {!mobile && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="আগের"
              className="absolute left-[calc(50%-300px)] top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 backdrop-blur transition hover:bg-white/10 lg:left-[calc(50%-560px)]"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="পরের"
              className="absolute right-[calc(50%-300px)] top-1/2 z-20 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-black/50 backdrop-blur transition hover:bg-white/10 lg:right-[calc(50%-560px)]"
            >
              ›
            </button>
          </>
        )}
      </div>

      <div className="relative mx-auto mt-8 max-w-md px-5 text-center">
        <div key={active} className="animate-[fadeUp_.6s_ease]">
          <h3
            className="text-lg font-bold"
            style={{ ...display, color: cur.c }}
          >
            {cur.t}
          </h3>
          <p className="mt-1 text-sm text-white/55">{cur.d}</p>
        </div>
      </div>
    </section>
  );
}
