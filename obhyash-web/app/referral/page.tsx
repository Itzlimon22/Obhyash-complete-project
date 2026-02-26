import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'রেফারেল প্রোগ্রাম | Obhyash',
  description:
    'বন্ধুকে Obhyash-এ আমন্ত্রণ জানাও এবং দুজনেই পাও বিনামূল্যে প্রিমিয়াম সাবস্ক্রিপশন! জানুন কিভাবে কাজ করে।',
};

const steps = [
  {
    num: '০১',
    color: 'emerald',
    title: 'তোমার কোড খুঁজে নাও',
    desc: 'লগইন করার পর "প্রোফাইল → রেফারেল" সেকশন থেকে তোমার ইউনিক রেফারেল কোড কপি করো।',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z"
        />
      </svg>
    ),
  },
  {
    num: '০২',
    color: 'red',
    title: 'বন্ধুকে শেয়ার করো',
    desc: 'তোমার রেফারেল লিংক বা কোডটি বন্ধু, ক্লাসমেট বা পরিবারের সাথে শেয়ার করো।',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
        />
      </svg>
    ),
  },
  {
    num: '০৩',
    color: 'emerald',
    title: 'বন্ধু সাইনআপ করুক',
    desc: 'তোমার বন্ধু তোমার কোড দিয়ে রেজিস্ট্রেশন ও রেফারেল রিডিম করলেই শুরু হবে প্রক্রিয়া।',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM3 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z"
        />
      </svg>
    ),
  },
  {
    num: '০৪',
    color: 'red',
    title: 'দুজনেই পুরস্কার পাও!',
    desc: 'অ্যাডমিন অনুমোদনের পর তুমি এবং তোমার বন্ধু উভয়েই ১ মাসের ফ্রি প্রিমিয়াম সাবস্ক্রিপশন পাবে।',
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.8}
        stroke="currentColor"
        className="w-7 h-7"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 11.25v8.25a1.5 1.5 0 0 1-1.5 1.5H5.25a1.5 1.5 0 0 1-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 1 0 9.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1 1 14.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
        />
      </svg>
    ),
  },
];

const faqs = [
  {
    q: 'রেফারেল পুরস্কার কখন পাবো?',
    a: 'তোমার বন্ধু রেফারেল রিডিম করার পর অ্যাডমিন টিম সেটি যাচাই করে অনুমোদন দেবে। সাধারণত ১-৩ কার্যদিবসের মধ্যে পুরস্কার অ্যাকাউন্টে যোগ হয়।',
  },
  {
    q: 'একজন কতজনকে রেফার করতে পারবে?',
    a: 'তুমি যত খুশি তত বন্ধুকে রেফার করতে পারো! তবে প্রতি মাসে সর্বোচ্চ ১০টি রেফারেল রিডিম হবে।',
  },
  {
    q: 'রেফারেল কোড কোথায় পাবো?',
    a: 'লগইন করার পর প্রোফাইল বা ড্যাশবোর্ডের "রেফারেল" সেকশনে তোমার ইউনিক কোড দেখতে পাবে।',
  },
  {
    q: 'আমি কি নিজের কোড দিয়ে নিজেকে রেফার করতে পারবো?',
    a: 'না, সেলফ-রেফারেল সম্পূর্ণ নিষিদ্ধ। শুধুমাত্র নতুন ব্যবহারকারী রিডিম করতে পারবে।',
  },
  {
    q: 'প্রিমিয়াম না থাকলেও রেফার করা যাবে?',
    a: 'হ্যাঁ! যেকোনো অ্যাকাউন্টধারী রেফার করতে পারবে। পুরস্কারটি সাবস্ক্রিপশন এক্সটেনশন হিসেবে যোগ হবে।',
  },
];

export default function ReferralPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* ── Sticky Header ── */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-neutral-950/80 backdrop-blur border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-600 to-red-600 flex items-center justify-center text-white text-xs font-bold shadow">
              অ
            </span>
            <span className="font-bold text-neutral-800 dark:text-white text-sm group-hover:text-emerald-600 transition-colors">
              Obhyash
            </span>
          </Link>
          <span className="text-neutral-300 dark:text-neutral-700">/</span>
          <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            রেফারেল প্রোগ্রাম
          </span>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Background blobs */}
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-emerald-400/10 dark:bg-emerald-600/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[300px] bg-red-400/10 dark:bg-red-600/5 rounded-full blur-3xl" />
        </div>

        <div className="max-w-5xl mx-auto px-4 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-200 dark:border-emerald-800 mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            সক্রিয় প্রোগ্রাম
          </span>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
            বন্ধুকে আমন্ত্রণ দাও,
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-red-500">
              দুজনেই পাও পুরস্কার!
            </span>
          </h1>

          <p className="text-lg md:text-xl text-neutral-500 dark:text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            তোমার বন্ধু তোমার রেফারেল কোড ব্যবহার করে সাইনআপ করলে, তুমি এবং
            তোমার বন্ধু উভয়েই পাবে{' '}
            <strong className="text-emerald-600 dark:text-emerald-400">
              ১ মাসের বিনামূল্যে প্রিমিয়াম সাবস্ক্রিপশন!
            </strong>
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-500/20 transition-all active:scale-95 inline-flex items-center gap-2 justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z"
                />
              </svg>
              আমার রেফারেল কোড দেখো
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 bg-white dark:bg-neutral-900 border-2 border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:border-emerald-400 rounded-xl font-bold text-base transition-all active:scale-95 inline-flex items-center gap-2 justify-center"
            >
              নতুন অ্যাকাউন্ট খুলুন
            </Link>
          </div>
        </div>
      </section>

      {/* ── Reward Banner ── */}
      <section className="py-10 bg-gradient-to-r from-emerald-700 to-emerald-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-white text-center">
            {[
              { label: 'তুমি পাবে', value: '১ মাস', sub: 'প্রিমিয়াম ফ্রি' },
              {
                label: 'তোমার বন্ধু পাবে',
                value: '১ মাস',
                sub: 'প্রিমিয়াম ফ্রি',
              },
              { label: 'সর্বোচ্চ রেফারেল', value: '১০টি', sub: 'প্রতি মাসে' },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <p className="text-sm font-semibold uppercase tracking-widest opacity-75">
                  {item.label}
                </p>
                <p className="text-4xl md:text-5xl font-extrabold">
                  {item.value}
                </p>
                <p className="text-sm opacity-70">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <span className="text-red-600 dark:text-red-400 font-bold uppercase tracking-widest text-sm">
            কিভাবে কাজ করে?
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold mt-2 text-neutral-900 dark:text-white">
            মাত্র ৪টি সহজ ধাপ
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <div
              key={i}
              className={`relative flex gap-5 p-6 rounded-2xl border bg-white dark:bg-neutral-900 
                ${
                  step.color === 'emerald'
                    ? 'border-emerald-100 dark:border-emerald-900/40'
                    : 'border-red-100 dark:border-red-900/40'
                }
                shadow-sm hover:shadow-md transition-shadow`}
            >
              {/* Number badge */}
              <div
                className={`absolute top-4 right-4 text-[11px] font-black tracking-widest 
                ${step.color === 'emerald' ? 'text-emerald-300 dark:text-emerald-800' : 'text-red-300 dark:text-red-900'}`}
              >
                {step.num}
              </div>

              {/* Icon */}
              <div
                className={`shrink-0 w-14 h-14 rounded-xl flex items-center justify-center
                ${
                  step.color === 'emerald'
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                    : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                }`}
              >
                {step.icon}
              </div>

              <div>
                <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1">
                  {step.title}
                </h3>
                <p className="text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who Can Use It ── */}
      <section className="py-16 bg-white dark:bg-neutral-900 border-y border-neutral-100 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white">
              কারা অংশ নিতে পারবে?
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400 mt-2 text-sm max-w-xl mx-auto">
              Obhyash-এর যেকোনো নিবন্ধিত ব্যবহারকারী এই প্রোগ্রামে অংশ নিতে
              পারবে।
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🏫', label: 'HSC পরীক্ষার্থী' },
              { emoji: '🏥', label: 'মেডিকেল ভর্তিচ্ছু' },
              { emoji: '🎓', label: 'বিশ্ববিদ্যালয় ভর্তিচ্ছু' },
              { emoji: '📚', label: 'যেকোনো শিক্ষার্থী' },
            ].map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center gap-2 p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-100 dark:border-neutral-700 text-center hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <span className="text-3xl">{item.emoji}</span>
                <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 max-w-3xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-neutral-900 dark:text-white">
            সচরাচর জিজ্ঞাসিত প্রশ্ন
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details
              key={i}
              className="group bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
            >
              <summary className="flex items-center justify-between gap-4 px-6 py-5 cursor-pointer list-none">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-[15px]">
                  {faq.q}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="w-4 h-4 shrink-0 text-neutral-400 group-open:rotate-180 transition-transform duration-200"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="m19.5 8.25-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </summary>
              <div className="px-6 pb-5 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed border-t border-neutral-100 dark:border-neutral-800 pt-4">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-20 bg-gradient-to-br from-emerald-700 via-emerald-800 to-red-700 text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-5xl mb-6">🎁</div>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            এখনই শুরু করো!
          </h2>
          <p className="text-emerald-100 mb-8 max-w-xl mx-auto leading-relaxed">
            তোমার বন্ধুকে আমন্ত্রণ জানাও এবং দুজনেই উপভোগ করো ফ্রি প্রিমিয়াম।
            Obhyash-এ একসাথে এগিয়ে যাও।
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="px-8 py-4 bg-white text-emerald-700 rounded-xl font-extrabold text-base hover:bg-neutral-50 transition-all active:scale-95 shadow-xl shadow-black/20 inline-flex items-center gap-2 justify-center"
            >
              রেফারেল কোড পান
            </Link>
            <Link
              href="/"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 rounded-xl font-bold text-base transition-all active:scale-95 inline-flex items-center gap-2 justify-center"
            >
              হোমে ফিরুন
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer note ── */}
      <div className="py-6 text-center text-xs text-neutral-400 dark:text-neutral-600 border-t border-neutral-100 dark:border-neutral-900">
        © {new Date().getFullYear()} Obhyash Platform · রেফারেল প্রোগ্রামের
        শর্তাবলী পরিবর্তনের অধিকার Obhyash সংরক্ষণ করে।
      </div>
    </div>
  );
}
