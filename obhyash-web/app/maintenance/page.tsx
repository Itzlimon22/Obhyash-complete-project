import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';

export const dynamic = 'force-static';
export const revalidate = false;

export const metadata: Metadata = {
  title: 'সিস্টেম রক্ষণাবেক্ষণ | অভ্যাস (Obhyash)',
  description:
    'অভ্যাস ওয়েবসাইট রক্ষণাবেক্ষণে রয়েছে। লাইভ পরীক্ষা দিতে মোবাইল অ্যাপ ব্যবহার করুন।',
  robots: {
    index: false,
    follow: true,
  },
};

const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app&referrer=utm_source%3Dweb_maintenance%26utm_medium%3Dmaintenance_page';

function GooglePlayColorIcon({ className = 'w-7 h-7 sm:w-8 sm:h-8' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3.609 1.814L13.793 12 3.61 22.186A2.37 2.37 0 0 1 3 20.5V3.5c0-.653.228-1.25.609-1.686z"
        fill="#00E676"
      />
      <path
        d="M17.228 8.565L5.05 1.733A2.348 2.348 0 0 0 3.61 1.814L13.793 12l3.435-3.435z"
        fill="#FFD600"
      />
      <path
        d="M3.609 22.186c.433.155.932.124 1.44-.162l12.179-6.832L13.793 12 3.61 22.186z"
        fill="#FF1744"
      />
      <path
        d="M20.893 10.627l-3.665-2.062L13.793 12l3.435 3.435 3.665-2.062a1.58 1.58 0 0 0 0-2.746z"
        fill="#00B0FF"
      />
    </svg>
  );
}

export default function MaintenancePage() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 select-none font-sans">
      <div className="max-w-md w-full text-center flex flex-col items-center">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <Image
            src="/icon-512.png"
            alt="Obhyash Logo"
            width={44}
            height={44}
            className="w-11 h-11 rounded-xl"
          />
          <span className="text-2xl font-bold tracking-tight text-white font-sans">
            অভ্যাস
          </span>
        </div>

        {/* Maintenance Message */}
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-3 font-noto">
          ওয়েবসাইট মেইনটেন্যান্স চলছে
        </h1>
        <p className="text-sm text-neutral-400 font-noto leading-relaxed mb-8 max-w-sm">
          আমাদের ওয়েবসাইট সিস্টেম আপগ্রেড চলছে। কিছুক্ষণের মধ্যে ওয়েবসাইট সচল হবে।
        </p>

        {/* Divider */}
        <div className="w-16 h-px bg-neutral-800 mb-8" />

        {/* App Install Notice */}
        <p className="text-base sm:text-lg font-semibold text-white font-noto mb-2">
          লাইভ পরীক্ষা দিতে অ্যাপটি ইনস্টল করো
        </p>
        <p className="text-xs text-neutral-400 font-noto mb-6 max-w-xs">
          মোবাইল অ্যাপে যথারীতি সব পরীক্ষা ও ফিচার চালু রয়েছে।
        </p>

        {/* Google Play Store Button */}
        <div className="w-full flex justify-center mb-8">
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full max-w-xs flex items-center justify-center gap-3.5 py-3.5 px-6 rounded-xl bg-white hover:bg-neutral-100 text-black font-sans transition-all duration-150 active:scale-[0.98] cursor-pointer"
          >
            <GooglePlayColorIcon className="w-7 h-7 shrink-0" />
            <div className="flex flex-col items-start leading-tight">
              <span className="text-[10px] text-neutral-600 font-bold tracking-wider uppercase">
                GET IT ON
              </span>
              <span className="text-lg sm:text-xl font-black text-black font-sans tracking-tight">
                Google Play
              </span>
            </div>
          </a>
        </div>

        {/* Link to Blog (Blog is live) */}
        <Link
          href="/blog"
          className="text-xs text-neutral-400 hover:text-white font-noto transition-colors underline underline-offset-4"
        >
          ব্লগ ও গাইডলাইন পড়ুন →
        </Link>
      </div>

      <footer className="absolute bottom-5 text-[11px] text-neutral-600 font-noto">
        © {new Date().getFullYear()} Obhyash
      </footer>
    </main>
  );
}
