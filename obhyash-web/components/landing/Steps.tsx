'use client';

import React, { useEffect, useState } from "react";

const display = { fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" };
const ink = "#1d2430";

const Laptop = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col items-center">
    <div
      className="relative h-[84px] w-[124px] rounded-t-xl border-[3px] bg-[#f4f6fb] p-2"
      style={{ borderColor: ink }}
    >
      {children}
    </div>
    <div
      className="h-3 w-[150px] rounded-b-lg border-[3px] bg-[#d9dee6]"
      style={{ borderColor: ink }}
    />
  </div>
);

const AccountArt = ({ on }: { on: boolean }) => (
  <Laptop>
    <span
      className={`absolute -top-5 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-full border-[3px] bg-[#3fb68b] transition duration-700 ${
        on ? "scale-110" : ""
      }`}
      style={{ borderColor: ink }}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="white">
        <circle cx="12" cy="9" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0z" />
      </svg>
    </span>
    <div
      className={`mx-auto mt-8 flex h-6 w-[88px] items-center justify-center gap-1.5 rounded-full border-[3px] bg-[#e5534b] transition duration-500 ${
        on ? "brightness-110" : ""
      }`}
      style={{ borderColor: ink }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`h-1.5 w-1.5 rounded-full bg-white/70 ${
            on ? "animate-bounce" : ""
          }`}
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </div>
  </Laptop>
);

const SubjectArt = ({ on }: { on: boolean }) => (
  <div className="relative flex items-end gap-2.5 pb-10">
    {[
      ["#3fb68b", 0],
      ["#f2a93b", 1],
      ["#6470f0", 2],
    ].map(([c, i]) => (
      <div
        key={c}
        className={`flex h-14 w-9 flex-col items-center justify-center gap-1 rounded-lg border-[3px] transition duration-500 ${
          on && i === 1 ? "-translate-y-3" : ""
        }`}
        style={{ borderColor: ink, background: c as string }}
      >
        <span className="h-0.5 w-4 rounded bg-white" />
        <span className="h-0.5 w-4 rounded bg-white" />
      </div>
    ))}
    <span
      className={`absolute bottom-0 left-1/2 -translate-x-1/2 text-3xl transition duration-500 ${
        on ? "-translate-y-3" : ""
      }`}
    >
      👆
    </span>
    <span
      className={`absolute bottom-6 left-[58%] h-8 w-8 rounded-full bg-[#f2a93b]/30 transition duration-500 ${
        on ? "scale-150 opacity-100" : "opacity-0"
      }`}
    />
  </div>
);

const PracticeArt = ({ on }: { on: boolean }) => (
  <Laptop>
    <div
      className="absolute -top-4 left-1/2 h-[92px] w-[70px] -translate-x-1/2 rounded-lg border-[3px] bg-white p-1.5"
      style={{ borderColor: ink }}
    >
      <span
        className="absolute -top-2 left-1/2 h-2.5 w-6 -translate-x-1/2 rounded-sm border-2 bg-white"
        style={{ borderColor: ink }}
      />
      <div className="mt-2 h-0.5 w-10 rounded bg-[#9aa3ad]" />
      <div
        className={`mt-2 flex items-center gap-1 rounded border-2 bg-[#3fb68b] px-1 py-0.5 transition duration-500 ${
          on ? "scale-110" : ""
        }`}
        style={{ borderColor: ink }}
      >
        <span className="text-[8px] font-bold text-white">✓</span>
        <span className="h-0.5 w-6 rounded bg-white" />
      </div>
      <div className="mt-1.5 flex items-center gap-1 rounded border border-[#d9dee6] px-1 py-0.5">
        <span className="h-1.5 w-1.5 rounded-full border border-[#9aa3ad]" />
        <span className="h-0.5 w-6 rounded bg-[#d9dee6]" />
      </div>
      <svg
        viewBox="0 0 24 24"
        className={`absolute h-6 w-6 transition-all duration-700 ${
          on ? "left-8 top-7" : "left-11 top-12"
        }`}
        fill="#6470f0"
        stroke={ink}
        strokeWidth="1.5"
      >
        <path d="M5 3l14 8-6 1.5L10 19z" />
      </svg>
    </div>
    <span
      className={`absolute -left-4 top-6 text-[#f2a93b] transition duration-500 ${
        on ? "scale-125 opacity-100" : "opacity-0"
      }`}
    >
      ✦
    </span>
  </Laptop>
);

const steps = [
  {
    t: "ফ্রি অ্যাকাউন্ট খুলুন",
    d: "Google বা মোবাইল নম্বর দিয়ে এক ক্লিকে শুরু।",
    time: "৩০ সেকেন্ড",
    Art: AccountArt,
    c: "#3fb68b",
  },
  {
    t: "বিষয় বেছে নিন",
    d: "সিলেবাস অনুযায়ী সাবজেক্ট ও অধ্যায় সিলেক্ট।",
    time: "১ মিনিট",
    Art: SubjectArt,
    c: "#f2a93b",
  },
  {
    t: "প্র্যাকটিস শুরু করুন",
    d: "প্রশ্ন সলভ করে সাথে সাথে ফিডব্যাক ও সমাধান।",
    time: "এখনই",
    Art: PracticeArt,
    c: "#6470f0",
  },
];
const bn = (n: number) => "০১২৩৪৫৬৭৮৯"[n];

export default function Steps({ onStart }: { onStart: () => void }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setActive((a) => (a + 1) % 3), 2800);
    return () => clearTimeout(t);
  }, [active]);

  return (
    <section id="how" className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
      <div data-reveal className="text-center">
        <h2 className="text-4xl font-bold md:text-5xl" style={display}>
          শুরু করা{" "}
          <span className="bg-gradient-to-r from-[#7ee0a4] to-[#3fb68b] bg-clip-text text-transparent">
            খুবই সহজ
          </span>
        </h2>
        <p className="mt-3 text-white/50">
          মাত্র ৩ ধাপে প্র্যাকটিস শুরু — ২ মিনিটেরও কম সময়ে।
        </p>
      </div>

      <div data-reveal className="relative mt-10 md:mt-14">
        <div
          className="pointer-events-none absolute -top-32 h-64 w-96 rounded-full blur-[110px] transition-all duration-700"
          style={{
            background: steps[active].c,
            opacity: 0.18,
            left: `${active * 33 + 5}%`,
          }}
        />

        <div className="relative mb-4 flex items-center px-[13%] md:mb-6 md:px-[16%]">
          {steps.map((s, i) => (
            <div key={s.t} className="contents">
              <button
                type="button"
                onClick={() => setActive(i)}
                aria-label={`ধাপ ${bn(i + 1)}`}
                className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold sm:h-11 sm:w-11 sm:text-lg transition duration-500 ${
                  i <= active
                    ? "border-transparent text-[#0a0b0b]"
                    : "border-white/15 bg-[#121414] text-white/50"
                }`}
                style={
                  i <= active
                    ? {
                        background: s.c,
                        boxShadow: `0 0 0 6px ${s.c}22, 0 0 30px ${s.c}66`,
                        ...display,
                      }
                    : display
                }
              >
                {i < active ? "✓" : bn(i + 1)}
              </button>
              {i < 2 && (
                <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                    style={{
                      width: i < active ? "100%" : "0%",
                      background: `linear-gradient(90deg, ${s.c}, ${
                        steps[i + 1].c
                      })`,
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="relative grid grid-cols-3 gap-2 sm:gap-4 md:gap-5">
          {steps.map(({ t, d, time, Art, c }, i) => {
            const on = i === active;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setActive(i)}
                className={`group relative min-w-0 rounded-[16px] p-px text-left sm:rounded-[24px] transition duration-500 ${
                  on ? "-translate-y-1.5" : "opacity-70 hover:opacity-100"
                }`}
                style={{
                  background: on
                    ? `linear-gradient(180deg, ${c}, ${c}10)`
                    : "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.03))",
                  boxShadow: on ? `0 30px 70px -30px ${c}99` : "none",
                }}
              >
                <div className="h-full rounded-[15px] bg-[#151717] p-2 sm:rounded-[23px] sm:p-4">
                  <div className="hidden items-center justify-between px-1 sm:flex">
                    <span
                      className="grid h-8 w-8 place-items-center rounded-full text-sm font-bold transition"
                      style={
                        on
                          ? { background: c, color: "#0a0b0b", ...display }
                          : { background: "rgba(255,255,255,.07)", ...display }
                      }
                    >
                      {bn(i + 1)}
                    </span>
                    <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-white/50">
                      ⏱ {time}
                    </span>
                  </div>
                  <div className="relative grid h-[96px] place-items-center overflow-hidden rounded-[11px] bg-white sm:mt-4 sm:h-[190px] sm:rounded-[16px]">
                    <div
                      className="absolute inset-0 opacity-50"
                      style={{
                        backgroundImage:
                          "radial-gradient(#dfe3ea 1px, transparent 1px)",
                        backgroundSize: "14px 14px",
                      }}
                    />
                    <div
                      className={`absolute h-32 w-32 rounded-full blur-2xl transition duration-700 ${
                        on ? "scale-150 opacity-40" : "opacity-15"
                      }`}
                      style={{ background: c }}
                    />
                    <div className="relative scale-[0.5] sm:scale-100">
                      <Art on={on} />
                    </div>
                  </div>
                  <div className="px-0.5 pb-0.5 pt-2.5 text-center sm:px-1 sm:pb-1 sm:pt-5 sm:text-left">
                    <p
                      className="text-[10px] font-semibold sm:text-xs"
                      style={{ color: c }}
                    >
                      ধাপ {bn(i + 1)}
                    </p>
                    <h3
                      className="mt-0.5 text-[13px] font-bold leading-snug sm:mt-1 sm:text-xl"
                      style={display}
                    >
                      {t}
                    </h3>
                    <p className="mt-1.5 hidden text-[15px] text-white/50 sm:block">
                      {d}
                    </p>
                  </div>
                  <div className="mx-0.5 mt-2 h-0.5 sm:mx-1 sm:mt-3 overflow-hidden rounded-full bg-white/5">
                    {on && (
                      <div
                        key={active}
                        className="h-full rounded-full"
                        style={{
                          background: c,
                          animation: "step-fill 2.8s linear forwards",
                        }}
                      />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
