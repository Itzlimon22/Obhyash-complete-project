/**
 * Premium UI Pass for LandingPage.tsx
 * - Fixes light/dark theme colors for better contrast and depth
 * - Adds premiumness: glass effects, richer gradients, better shadows
 * - Improves consistency across all sections
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(
  __dirname,
  'components',
  'landing',
  'LandingPage.tsx',
);
let content = fs.readFileSync(filePath, 'utf8');

// Track changes
let changes = 0;

function replace(from, to, description) {
  if (content.includes(from)) {
    content = content.split(from).join(to);
    console.log(`✅ ${description}`);
    changes++;
  } else {
    console.warn(`⚠️  NOT FOUND: ${description}`);
    // Print first 60 chars for debugging
    console.warn(
      `   Looking for: "${from.substring(0, 80).replace(/\n/g, '\\n')}..."`,
    );
  }
}

// ─────────────────────────────────────────────────────────────────
// 1. ROOT BACKGROUND — more premium white/dark
// ─────────────────────────────────────────────────────────────────
replace(
  `className="min-h-screen bg-neutral-50 dark:bg-black text-neutral-900 dark:text-neutral-100 transition-colors font-sans selection:bg-red-500/20"`,
  `className="min-h-screen bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors font-sans selection:bg-red-500/20"`,
  'Root bg: neutral-50→white / black→neutral-950',
);

// ─────────────────────────────────────────────────────────────────
// 2. BACKGROUND GRADIENT BLOBS — make them visible in dark mode too
// ─────────────────────────────────────────────────────────────────
replace(
  `<div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-500/10 dark:bg-transparent rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-red-500/10 dark:bg-transparent rounded-full blur-[100px]"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-red-500/5 dark:bg-transparent rounded-full blur-[80px]"></div>`,
  `<div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-red-500/8 dark:bg-red-600/4 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-emerald-500/8 dark:bg-emerald-600/4 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-red-500/5 dark:bg-emerald-500/3 rounded-full blur-[80px]"></div>`,
  'Background blobs: visible in dark mode',
);

// ─────────────────────────────────────────────────────────────────
// 3. NAVIGATION — premium glass + better border
// ─────────────────────────────────────────────────────────────────
replace(
  `className="sticky top-0 z-50 w-full backdrop-blur-lg bg-white/70 dark:bg-black/70 border-b border-red-100 dark:border-neutral-800"`,
  `className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/80 dark:bg-neutral-950/80 border-b border-neutral-200/80 dark:border-neutral-800/80 shadow-sm dark:shadow-none"`,
  'Nav: premium glass + consistent border',
);

// ─────────────────────────────────────────────────────────────────
// 4. HERO BADGE — sharper premium badge
// ─────────────────────────────────────────────────────────────────
replace(
  `className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider"`,
  `className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700/50 text-emerald-700 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider shadow-sm"`,
  'Hero badge: sharper in both modes',
);

// ─────────────────────────────────────────────────────────────────
// 5. HERO H1 — premium gradient text
// ─────────────────────────────────────────────────────────────────
replace(
  `className="text-4xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.25]"`,
  `className="text-4xl lg:text-6xl font-extrabold tracking-tight text-neutral-950 dark:text-white leading-[1.2]"`,
  'Hero h1: darker text for more premium contrast',
);

// ─────────────────────────────────────────────────────────────────
// 6. HERO DEMO CARD — premium border + shadow
// ─────────────────────────────────────────────────────────────────
replace(
  `className="w-full relative bg-white dark:bg-black rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-red-100 dark:border-neutral-800 shadow-2xl shadow-neutral-200/50 dark:shadow-black/50 overflow-hidden transform rotate-y-2 hover:rotate-y-0 transition-transform duration-500"`,
  `className="w-full relative bg-white dark:bg-neutral-900 rounded-t-2xl sm:rounded-2xl rounded-b-none sm:rounded-b-2xl animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 border border-neutral-200 dark:border-neutral-700/60 shadow-2xl shadow-neutral-300/40 dark:shadow-black/70 overflow-hidden transform rotate-y-2 hover:rotate-y-0 transition-transform duration-500"`,
  'Hero demo card: premium dark bg + better border/shadow',
);

// ─────────────────────────────────────────────────────────────────
// 7. DEMO CARD BROWSER HEADER BG
// ─────────────────────────────────────────────────────────────────
replace(
  `className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-black/50"`,
  `className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/80"`,
  'Demo card browser header dark bg',
);

// ─────────────────────────────────────────────────────────────────
// 8. DEMO CARD TAB ACTIVE STATE — visible in dark
// ─────────────────────────────────────────────────────────────────
replace(
  `className={\`flex items-center gap-1 px-3 py-1 rounded transition-all \${activeDemoTab === 'generate' ? 'bg-white shadow text-emerald-600' : 'text-neutral-500'}\`}`,
  `className={\`flex items-center gap-1 px-3 py-1 rounded transition-all \${activeDemoTab === 'generate' ? 'bg-white dark:bg-neutral-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}\`}`,
  'Demo tab generate: dark mode active state',
);
replace(
  `className={\`flex items-center gap-1 px-3 py-1 rounded transition-all \${activeDemoTab === 'omr' ? 'bg-white shadow text-emerald-600' : 'text-neutral-500'}\`}`,
  `className={\`flex items-center gap-1 px-3 py-1 rounded transition-all \${activeDemoTab === 'omr' ? 'bg-white dark:bg-neutral-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}\`}`,
  'Demo tab omr: dark mode active state',
);
replace(
  `className={\`flex items-center gap-1 px-3 py-1 rounded transition-all \${activeDemoTab === 'analytics' ? 'bg-white shadow text-emerald-600' : 'text-neutral-500'}\`}`,
  `className={\`flex items-center gap-1 px-3 py-1 rounded transition-all \${activeDemoTab === 'analytics' ? 'bg-white dark:bg-neutral-700 shadow text-emerald-600 dark:text-emerald-400' : 'text-neutral-500 dark:text-neutral-400'}\`}`,
  'Demo tab analytics: dark mode active state',
);

// ─────────────────────────────────────────────────────────────────
// 9. STATS BANNER — better bg and border
// ─────────────────────────────────────────────────────────────────
replace(
  `className="py-10 border-y border-emerald-50 dark:border-neutral-800 bg-white/50 dark:bg-black backdrop-blur-sm"`,
  `className="py-12 border-y border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-white via-neutral-50/50 to-white dark:from-neutral-950 dark:via-neutral-900/40 dark:to-neutral-950"`,
  'Stats banner: premium gradient bg',
);

// Stats banner dividers
replace(
  `className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-neutral-200 dark:divide-neutral-800"`,
  `className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-neutral-200 dark:divide-neutral-800/60"`,
  'Stats banner: subtle dark dividers',
);

// ─────────────────────────────────────────────────────────────────
// 10. AUDIENCE SECTION — richer background
// ─────────────────────────────────────────────────────────────────
replace(
  `className="py-20 bg-white dark:bg-black border-b border-neutral-100 dark:border-neutral-900"`,
  `className="py-24 bg-gradient-to-b from-white to-neutral-50/60 dark:from-neutral-950 dark:to-neutral-900/40 border-b border-neutral-100 dark:border-neutral-800/60"`,
  'Audience section: gradient bg',
);

// ─────────────────────────────────────────────────────────────────
// 11. FEATURES SECTION — bg + heading underline
// ─────────────────────────────────────────────────────────────────
replace(
  `id="features" className="py-24 max-w-7xl mx-auto px-4 lg:px-6"`,
  `id="features" className="py-24 bg-neutral-50/50 dark:bg-neutral-950 max-w-full px-0"`,
  'Features section: subtle bg for separation',
);
// Fix inner container after that
replace(
  `<div className="mb-16 text-center">
          <span className="text-red-600 dark:text-red-400 font-bold tracking-wider uppercase text-sm">
            কেন আমরা সেরা?
          </span>`,
  `<div className="max-w-7xl mx-auto px-4 lg:px-6 pt-0">
        <div className="mb-16 text-center">
          <span className="text-red-600 dark:text-red-400 font-bold tracking-wider uppercase text-sm">
            কেন আমরা সেরা?
          </span>`,
  'Features inner container',
);

// Feature cards — glass effect
replace(
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BarChart3 className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-100 dark:ring-red-900/30">
                <BarChart3 className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  'Feature card 1 (analytics): glass effect',
);

replace(
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <ScanLine className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-100 dark:ring-red-900/30">
                <ScanLine className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  'Feature card 2 (OMR): glass effect',
);

replace(
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-100 dark:ring-red-900/30">
                <Sparkles className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  'Feature card 3 (AI generator): glass effect',
);

replace(
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Trophy className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-100 dark:ring-red-900/30">
                <Trophy className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  'Feature card 4 (leaderboard): glass effect',
);

replace(
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <History className="w-8 h-8 md:w-7 md:h-7 text-emerald-600" />`,
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-emerald-100 dark:ring-emerald-900/30">
                <History className="w-8 h-8 md:w-7 md:h-7 text-emerald-600" />`,
  'Feature card 5 (history): glass effect',
);

replace(
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center md:items-start md:text-left">`,
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 relative overflow-hidden flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">`,
  'Feature card 6 (smart bank): glass effect',
);

replace(
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-red-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <RotateCcw className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-red-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-red-100 dark:ring-red-900/30">
                <RotateCcw className="w-8 h-8 md:w-7 md:h-7 text-red-600" />`,
  'Feature card 7 (ভুল থেকে শেখো): glass effect',
);

replace(
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-black border border-neutral-100 dark:border-neutral-800 shadow-sm hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Target className="w-8 h-8 md:w-7 md:h-7 text-emerald-600" />`,
  `className="min-w-[85%] md:min-w-0 snap-center group p-8 rounded-[2rem] bg-white dark:bg-neutral-900/70 border border-neutral-100 dark:border-neutral-800/80 shadow-sm hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-2 transition-all duration-300 flex flex-col items-center text-center md:items-start md:text-left backdrop-blur-sm">
              <div className="w-16 h-16 md:w-14 md:h-14 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ring-1 ring-emerald-100 dark:ring-emerald-900/30">
                <Target className="w-8 h-8 md:w-7 md:h-7 text-emerald-600" />`,
  'Feature card 8 (দৈনিক লক্ষ্যমাত্রা): glass effect',
);

// ─────────────────────────────────────────────────────────────────
// 12. HOW IT WORKS — darker bg in light for section separation
// ─────────────────────────────────────────────────────────────────
replace(
  `className="py-24 bg-neutral-50 dark:bg-black relative overflow-hidden"`,
  `className="py-24 bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden border-y border-neutral-100 dark:border-neutral-800/60"`,
  'How it works: consistent dark bg',
);

// Step circles in How It Works
replace(
  `className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-full border-4 border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-emerald-600">১</span>`,
  `className="w-24 h-24 bg-white dark:bg-neutral-800/80 rounded-full border-4 border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-6 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20 group-hover:scale-110 group-hover:shadow-emerald-200 dark:group-hover:shadow-emerald-800/30 transition-all duration-300">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">১</span>`,
  'How it works step 1: premium circle',
);

replace(
  `className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-full border-4 border-red-100 dark:border-red-900/50 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-red-600">২</span>`,
  `className="w-24 h-24 bg-white dark:bg-neutral-800/80 rounded-full border-4 border-red-200 dark:border-red-800/60 flex items-center justify-center mb-6 shadow-xl shadow-red-100 dark:shadow-red-900/20 group-hover:scale-110 group-hover:shadow-red-200 dark:group-hover:shadow-red-800/30 transition-all duration-300">
                <span className="text-3xl font-bold text-red-600 dark:text-red-400">২</span>`,
  'How it works step 2: premium circle',
);

replace(
  `className="w-24 h-24 bg-white dark:bg-neutral-800 rounded-full border-4 border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <span className="text-3xl font-bold text-emerald-600">৩</span>`,
  `className="w-24 h-24 bg-white dark:bg-neutral-800/80 rounded-full border-4 border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center mb-6 shadow-xl shadow-emerald-100 dark:shadow-emerald-900/20 group-hover:scale-110 group-hover:shadow-emerald-200 dark:group-hover:shadow-emerald-800/30 transition-all duration-300">
                <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">৩</span>`,
  'How it works step 3: premium circle',
);

// ─────────────────────────────────────────────────────────────────
// 13. PRICING SECTION — premium bg + better card dark mode
// ─────────────────────────────────────────────────────────────────
replace(
  `className="py-20 bg-neutral-50 dark:bg-black border-y border-red-100 dark:border-neutral-800"`,
  `className="py-24 bg-gradient-to-b from-neutral-50 to-white dark:from-neutral-950 dark:to-neutral-900/20 border-y border-neutral-100 dark:border-neutral-800/60"`,
  'Pricing section: premium bg',
);

replace(
  `className={\`relative bg-white dark:bg-black rounded-2xl p-8 border transition-transform hover:-translate-y-2 \${plan.color} \${plan.highlight ? 'shadow-2xl shadow-emerald-500/10 scale-105 z-10' : 'shadow-lg'}\`}`,
  `className={\`relative bg-white dark:bg-neutral-900/80 rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-2 \${plan.color} \${plan.highlight ? 'shadow-2xl shadow-emerald-500/15 scale-105 z-10 dark:border-emerald-700/50' : 'shadow-md hover:shadow-xl'}\`}`,
  'Pricing cards: dark bg + better shadow',
);

// ─────────────────────────────────────────────────────────────────
// 14. TESTIMONIALS SECTION — richer bg + card improvements
// ─────────────────────────────────────────────────────────────────
replace(
  `className="py-20 bg-red-50/50 dark:bg-black border-y border-red-100 dark:border-neutral-800"`,
  `className="py-24 bg-gradient-to-br from-red-50/40 via-white to-rose-50/20 dark:from-neutral-950 dark:via-neutral-900/30 dark:to-neutral-950 border-y border-red-100/60 dark:border-neutral-800/60"`,
  'Testimonials section: premium gradient bg',
);

replace(
  `className="bg-white dark:bg-black p-8 rounded-3xl border border-red-100 dark:border-neutral-800 shadow-sm relative hover:-translate-y-1 transition-transform duration-300"`,
  `className="bg-white dark:bg-neutral-900/70 p-8 rounded-3xl border border-red-100 dark:border-neutral-800/80 shadow-md hover:shadow-xl hover:shadow-red-500/5 relative hover:-translate-y-2 transition-all duration-300 backdrop-blur-sm"`,
  'Testimonial cards: glass + better hover',
);

// ─────────────────────────────────────────────────────────────────
// 15. FAQ SECTION — subtle bg
// ─────────────────────────────────────────────────────────────────
replace(
  `className="py-20 max-w-4xl mx-auto px-4 lg:px-6"`,
  `className="py-20 max-w-4xl mx-auto px-4 lg:px-6 relative"`,
  'FAQ section: relative for potential bg',
);

replace(
  `className={\`bg-white dark:bg-black rounded-2xl border transition-all duration-300 overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 shadow-sm hover:shadow-md \${isOpen ? 'border-emerald-500 shadow-md ring-1 ring-emerald-500/10' : 'border-neutral-200 dark:border-neutral-800'}\`}`,
  `className={\`bg-white dark:bg-neutral-900/60 rounded-2xl border transition-all duration-300 overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 shadow-sm hover:shadow-lg \${isOpen ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/10' : 'border-neutral-200 dark:border-neutral-800/80 hover:border-neutral-300 dark:hover:border-neutral-700'}\`}`,
  'FAQ items: glass + better hover + open ring',
);

// ─────────────────────────────────────────────────────────────────
// 16. FOOTER — premium dark footer
// ─────────────────────────────────────────────────────────────────
replace(
  `className="bg-white dark:bg-black pt-20 pb-10 border-t border-red-100 dark:border-neutral-800 font-sans"`,
  `className="bg-neutral-50 dark:bg-neutral-950 pt-20 pb-10 border-t border-neutral-200 dark:border-neutral-800/60 font-sans"`,
  'Footer: premium bg (light slight gray, dark near-black)',
);

replace(
  `className="pt-8 border-t border-neutral-100 dark:border-neutral-800 flex flex-col md:flex-row items-center justify-between gap-4"`,
  `className="pt-8 border-t border-neutral-200 dark:border-neutral-800/60 flex flex-col md:flex-row items-center justify-between gap-4"`,
  'Footer bottom divider: consistent border',
);

// ─────────────────────────────────────────────────────────────────
// 17. COMING SOON CARDS — better dark bg
// ─────────────────────────────────────────────────────────────────
replace(
  `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90">
            {/* Live Model Test */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700">`,
  `<div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-90">
            {/* Live Model Test */}
            <div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-800/30 border border-dashed border-neutral-300 dark:border-neutral-700/70 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">`,
  'Coming soon card 1: better dark bg',
);

replace(
  `<div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                  <HelpCircle className="w-6 h-6" />`,
  `<div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-800/30 border border-dashed border-neutral-300 dark:border-neutral-700/70 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                  <HelpCircle className="w-6 h-6" />`,
  'Coming soon card 2: better dark bg',
);

replace(
  `<div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-900/50 border border-dashed border-neutral-300 dark:border-neutral-700">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                  <GraduationCap className="w-6 h-6" />`,
  `<div className="relative p-6 rounded-2xl bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900/60 dark:to-neutral-800/30 border border-dashed border-neutral-300 dark:border-neutral-700/70 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-100 dark:bg-emerald-900/20 rounded-xl text-emerald-600">
                  <GraduationCap className="w-6 h-6" />`,
  'Coming soon card 3: better dark bg',
);

// ─────────────────────────────────────────────────────────────────
// 18. Section heading — features heading improvement
// ─────────────────────────────────────────────────────────────────
replace(
  `<h2 className="text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white mt-2">
            আপনার প্রস্তুতিকে দাও <br className="hidden md:block" />
            <span className="relative whitespace-nowrap">
              <span className="relative z-10">নতুন মাত্রা</span>
              <span className="absolute bottom-1 left-0 w-full h-3 bg-red-100 dark:bg-red-900/50 -z-0 rounded-full"></span>
            </span>
          </h2>`,
  `<h2 className="text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white mt-2">
            আপনার প্রস্তুতিকে দাও <br className="hidden md:block" />
            <span className="relative whitespace-nowrap">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 dark:from-red-400 dark:to-red-500">নতুন মাত্রা</span>
            </span>
          </h2>`,
  'Features heading: gradient text for "নতুন মাত্রা"',
);

// ─────────────────────────────────────────────────────────────────
// 19. PRICING section heading improvement
// ─────────────────────────────────────────────────────────────────
replace(
  `<h2 className="text-3xl font-bold text-neutral-900 dark:text-white mb-4">
              আপনার পছন্দের প্ল্যানটি বেছে নাও
            </h2>`,
  `<h2 className="text-3xl lg:text-4xl font-extrabold text-neutral-900 dark:text-white mb-4">
              আপনার পছন্দের প্ল্যানটি <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-emerald-500 dark:from-emerald-400 dark:to-emerald-500">বেছে নাও</span>
            </h2>`,
  'Pricing heading: gradient accent',
);

// ─────────────────────────────────────────────────────────────────
// DONE
// ─────────────────────────────────────────────────────────────────
fs.writeFileSync(filePath, content, 'utf8');
console.log(`\n✅ Done! Applied ${changes} changes.`);
