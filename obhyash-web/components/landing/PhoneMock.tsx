'use client';

import React, { useEffect, useState } from "react";

const bnNum = (n: number | string) => String(n).replace(/\d/g, (d) => "০১২৩৪৫৬৭৮৯"[+d]);
const qs = [
  { n: 41, q: "√২ একটি —", o: ["মূলদ সংখ্যা", "অমূলদ সংখ্যা", "পূর্ণসংখ্যা", "স্বাভাবিক সংখ্যা"] },
  { n: 42, q: "4+16+64+........গুণোত্তর ধারার সাধারণ অনুপাত কত?", o: ["-4", "4", "8", "12"] },
  { n: 43, q: "যে সেটের কোন উপাদান নেই তাকে বলা হয় -", o: ["সংযোগ সেট", "পূরক সেট", "ফাঁকা সেট", "নিশ্চেদ সেট"] },
  { n: 44, q: "x² − 5x + 6 = 0 সমীকরণের মূলদ্বয় কত?", o: ["1, 6", "2, 3", "-2, -3", "3, 4"] },
];

export default function PhoneMock() {
  const [picked, setPicked] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Record<number, boolean>>({});
  const [secs, setSecs] = useState(48 * 60 + 57);
  const [dark, setDark] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setSecs((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [done]);

  const count = Object.keys(picked).length;
  const time = `${String(Math.floor(secs / 60)).padStart(2, "0")} : ${String(secs % 60).padStart(2, "0")}`;
  const d = dark;

  return (
    <div className="relative w-[280px] shrink-0 rounded-[46px] border-[6px] border-[#8a8a8e] bg-black p-[6px] shadow-[0_40px_120px_-30px_rgba(229,83,75,0.45)] sm:w-[310px]">
      <span className="absolute -right-[10px] top-36 h-14 w-1 rounded-r bg-[#8a8a8e]" />
      <span className="absolute -right-[10px] top-56 h-24 w-1 rounded-r bg-[#8a8a8e]" />
      <div className={`relative flex h-[590px] flex-col overflow-hidden rounded-[36px] ${d ? "bg-[#0f1514] text-white" : "bg-white text-[#1d2327]"}`} style={{ fontFamily: "'Kalpurush', 'Hind Siliguri', sans-serif" }}>
        <div className={d ? "bg-[#16201e]" : "bg-[#e8f1ef]"}>
          <div className="flex items-center justify-between px-7 pb-2 pt-4 text-[13px] font-semibold" style={{ fontFamily: "system-ui" }}>
            <span>9:41</span>
            <span className="h-3.5 w-3.5 rounded-full bg-black" />
            <span className="flex items-center gap-1.5 text-[11px]">4G ▂▄▆ <span>85%</span><span className="inline-block h-2.5 w-5 rounded-sm border border-current p-px"><span className="block h-full w-4/5 rounded-[1px] bg-[#3fb68b]" /></span></span>
          </div>
          <div className="flex items-center justify-between px-4 pb-3 pt-1 text-sm font-semibold">
            <span className={`rounded-xl px-3 py-2 ${d ? "bg-white/5" : "bg-white/70"}`}>{bnNum(count)} / {bnNum(50)}</span>
            <span className={`rounded-xl border px-4 py-2 font-mono tabular-nums ${d ? "border-white/10 bg-white/5" : "border-[#d6e3e0] bg-white/70"}`}>⏱ {time}</span>
            <div className="flex gap-1.5">
              <button aria-label="Download PDF" className={`grid h-9 w-9 place-items-center rounded-xl ${d ? "bg-white/5" : "bg-white/70"}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M11 4h2v8l3-3 1.4 1.4L12 15.8 6.6 10.4 8 9l3 3V4Zm-6 14h14v2H5v-2Z" /></svg>
              </button>
              <button aria-label="Toggle dark mode" onClick={() => setDark(!d)} className={`grid h-9 w-9 place-items-center rounded-xl ${d ? "bg-white/5" : "bg-white/70"}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 3a9 9 0 1 0 9 9 7 7 0 0 1-9-9Z" /></svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto px-3.5 py-3 pb-24 [scrollbar-width:none]">
          {qs.map((q) => (
            <div key={q.n} className={`rounded-3xl border p-4 ${d ? "border-white/10 bg-white/[0.03]" : "border-[#e6eaec]"}`}>
              <p className="text-[15px] leading-relaxed">{bnNum(q.n)}. {q.q}</p>
              <div className="flex justify-end">
                <button aria-label="Flag" onClick={() => setFlags({ ...flags, [q.n]: !flags[q.n] })} className={flags[q.n] ? "text-[#e5534b]" : "text-[#9aa3a8]"}>
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill={flags[q.n] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8"><path d="M5 21V4h11l-2 4 2 4H5" /></svg>
                </button>
              </div>
              <div className="mt-2 space-y-2">
                {q.o.map((o, i) => {
                  const on = picked[q.n] === i;
                  const locked = picked[q.n] !== undefined;
                  return (
                    <button key={o} disabled={locked || done} onClick={() => setPicked({ ...picked, [q.n]: i })}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-left text-[15px] transition ${on ? "border-[#0b5a50] bg-[#0b5a50]/10" : d ? "border-white/10 bg-white/[0.02]" : "border-[#e6eaec] bg-[#f7f8f9]"} ${locked && !on ? "opacity-60" : ""}`}>
                      <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border text-sm ${on ? "border-[#0b5a50] bg-[#0b5a50] text-white" : d ? "border-white/15 bg-white/5" : "border-[#d9dde0] bg-[#eceef0] text-[#4a5358]"}`}>{"কখগঘ"[i]}</span>
                      {o}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className={`absolute inset-x-0 bottom-0 flex justify-center border-t py-3 ${d ? "border-white/10 bg-[#0f1514]" : "border-[#eef0f1] bg-white"}`}>
          <button onClick={() => setDone(true)} className="rounded-2xl bg-[#0b5a50] px-10 py-2.5 font-semibold text-white shadow-[0_4px_0_#063b34] transition active:translate-y-0.5 active:shadow-none">
            {done ? `জমা হয়েছে · ${bnNum(count)}টি উত্তর` : "জমা দাও"}
          </button>
        </div>
      </div>
    </div>
  );
}
