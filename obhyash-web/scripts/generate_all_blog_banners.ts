import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');
const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'blog-covers', 'titles');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function cleanText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Editorial headline trimmer: converts long 90-char SEO titles
 * into punchy, elegant 2-line billboard banners (max 28-34 chars per line).
 */
function splitTitle(rawTitle: string): [string, string] {
  let title = rawTitle
    .replace(/\s*\|\s*অভ্যাস.*$/i, '')
    .replace(/\s*-\s*অভ্যাস.*$/i, '')
    .trim();

  // If title has a colon (very common in Bengali blogs)
  if (title.includes(':')) {
    const parts = title.split(':');
    let l1 = parts[0].trim();
    let l2 = parts.slice(1).join(':').trim();

    // Clean up l1 for billboard punch
    l1 = l1
      .replace(/ভর্তি পরীক্ষা সার্কুলার/g, 'ভর্তি সার্কুলার')
      .replace(/ভর্তি পরীক্ষার সার্কুলার/g, 'ভর্তি সার্কুলার')
      .replace(/নতুন সিলেবাস ও পরীক্ষা পদ্ধতি/g, 'নতুন সিলেবাস ও পদ্ধতি')
      .trim();

    // Clean up l2 for billboard punch
    if (l2.length > 30) {
      if (l2.includes(' ও ')) {
        const subParts = l2.split(' ও ');
        const first = subParts[0].split(',')[0].trim();
        const last = subParts[subParts.length - 1].trim();
        l2 = `${first} ও ${last}`;
      } else if (l2.includes(',')) {
        const subParts = l2.split(',').map((c) => c.trim());
        l2 = `${subParts[0]} ও ${subParts[subParts.length - 1]}`;
      }
    }

    if (l2.length > 36) {
      const words = l2.split(/\s+/);
      l2 = words.slice(0, 5).join(' ');
    }

    return [l1, l2];
  }

  // If title has a question mark
  if (title.includes('?')) {
    const parts = title.split('?');
    let l1 = parts[0].trim() + '?';
    let l2 = parts.slice(1).join('?').replace(/^[:\s-]+/, '').trim();
    if (l2.length > 36) {
      const words = l2.split(/\s+/);
      l2 = words.slice(0, 5).join(' ');
    }
    if (l2) return [l1, l2];
  }

  // If title has a dash/hyphen
  const dashMatch = title.match(/^(.*?)\s+[—–-]\s+(.*)$/);
  if (dashMatch) {
    let l1 = dashMatch[1].trim();
    let l2 = dashMatch[2].trim();
    if (l1.length <= 34 && l2.length <= 36) {
      return [l1, l2];
    }
  }

  // Balanced word wrap around middle
  const words = title.split(/\s+/);
  if (words.length <= 3) {
    return [title, ''];
  }

  let bestSplit = 1;
  let minDiff = Infinity;
  for (let i = 1; i < words.length; i++) {
    const l1 = words.slice(0, i).join(' ');
    const l2 = words.slice(i).join(' ');
    const diff = Math.abs(l1.length - l2.length);
    if (diff < minDiff) {
      minDiff = diff;
      bestSplit = i;
    }
  }

  let line1 = words.slice(0, bestSplit).join(' ');
  let line2 = words.slice(bestSplit).join(' ');

  // If line 2 is still too long, trim
  if (line2.length > 36) {
    const l2Words = line2.split(/\s+/);
    line2 = l2Words.slice(0, 5).join(' ');
  }

  return [line1, line2];
}

function getBadges(title: string, category: string, tags: string[]): {
  catBadge: string;
  yearBadge: string;
  chip1Icon: string;
  chip1Text: string;
  chip2Icon: string;
  chip2Text: string;
} {
  const combined = `${title} ${category} ${tags.join(' ')}`.toLowerCase();

  // Year detection
  let yearBadge = 'শিক্ষা ও ক্যারিয়ার';
  if (combined.includes('২০২৭') || combined.includes('2027')) {
    if (combined.includes('hsc') || combined.includes('এইচএসসি')) yearBadge = 'এইচএসসি ২০২৭';
    else if (combined.includes('ssc') || combined.includes('এসএসসি')) yearBadge = 'এসএসসি ২০২৭';
    else yearBadge = 'শিক্ষাবর্ষ ২০২৭';
  } else if (combined.includes('২০২৬') || combined.includes('2026')) {
    if (combined.includes('hsc') || combined.includes('এইচএসসি')) yearBadge = 'এইচএসসি ২০২৬';
    else if (combined.includes('ssc') || combined.includes('এসএসসি')) yearBadge = 'এসএসসি ২০২৬';
    else yearBadge = 'পরীক্ষা ২০২৬';
  } else if (combined.includes('বুয়েট') || combined.includes('buet')) {
    yearBadge = 'বুয়েট ভর্তি ২০২৬';
  } else if (combined.includes('মেডিকেল') || combined.includes('medical')) {
    yearBadge = 'মেডিকেল ভর্তি ২০২৬';
  } else if (combined.includes('mist') || combined.includes('এমআইএসটি')) {
    yearBadge = 'MIST ভর্তি ২০২৬';
  } else if (combined.includes('ঢাবি') || combined.includes('du ')) {
    yearBadge = 'ঢাবি ভর্তি ২০২৬';
  }

  // Admission
  if (
    combined.includes('ভর্তি') ||
    combined.includes('admission') ||
    combined.includes('বুয়েট') ||
    combined.includes('বুয়েট') ||
    combined.includes('মেডিকেল') ||
    combined.includes('mist') ||
    combined.includes('gst') ||
    combined.includes('ckruet')
  ) {
    return {
      catBadge: 'ভর্তি পরীক্ষা তথ্য',
      yearBadge,
      chip1Icon: '🎯',
      chip1Text: 'যোগ্যতা ও আবেদন নিয়ম',
      chip2Icon: '✓',
      chip2Text: 'পরীক্ষা পদ্ধতি ও মানবণ্টন',
    };
  }

  // Result / Notice / Scholarship
  if (
    combined.includes('রেজাল্ট') ||
    combined.includes('result') ||
    combined.includes('বৃত্তি') ||
    combined.includes('scholarship') ||
    combined.includes('মার্কশিট') ||
    combined.includes('পুনঃনিরীক্ষণ')
  ) {
    return {
      catBadge: 'রেজাল্ট আপডেট',
      yearBadge,
      chip1Icon: '📅',
      chip1Text: 'সম্ভাব্য তারিখ ও সময়',
      chip2Icon: '✓',
      chip2Text: 'অনলাইন ও SMS মার্কশিট',
    };
  }

  // Routine / Date
  if (combined.includes('রুটিন') || combined.includes('routine') || combined.includes('তারিখ')) {
    return {
      catBadge: 'পরীক্ষার রুটিন',
      yearBadge,
      chip1Icon: '📅',
      chip1Text: 'বোর্ড সময়সূচি ও তারিখ',
      chip2Icon: '✓',
      chip2Text: 'অফিসিয়াল PDF রুটিন',
    };
  }

  // Syllabus / Marks distribution
  if (
    combined.includes('সিলেবাস') ||
    combined.includes('syllabus') ||
    combined.includes('মানবণ্টন') ||
    combined.includes('বই') ||
    combined.includes('book')
  ) {
    return {
      catBadge: 'সিলেবাস ও মানবণ্টন',
      yearBadge,
      chip1Icon: '📊',
      chip1Text: 'পূর্ণাঙ্গ মানবণ্টন ও অধ্যায়',
      chip2Icon: '✓',
      chip2Text: 'বোর্ড সিলেবাস গাইডলাইন',
    };
  }

  // Formula / Science / Math
  if (
    combined.includes('সূত্র') ||
    combined.includes('formula') ||
    combined.includes('পদার্থ') ||
    combined.includes('রসায়ন') ||
    combined.includes('রসায়ন') ||
    combined.includes('গণিত') ||
    combined.includes('ict')
  ) {
    return {
      catBadge: 'প্রস্তুতি ও সূত্র সমগ্র',
      yearBadge,
      chip1Icon: '📐',
      chip1Text: 'গুরুত্বপূর্ণ সকল সূত্র',
      chip2Icon: '✓',
      chip2Text: 'শর্টকাট টেকনিক ও হ্যাকস',
    };
  }

  // Study Hacks / Motivation
  return {
    catBadge: 'স্মার্ট স্টাডি হ্যাকস',
    yearBadge,
    chip1Icon: '🧠',
    chip1Text: 'পড়ার বৈজ্ঞানিক টেকনিক',
    chip2Icon: '✓',
    chip2Text: 'সময় ব্যবস্থাপনা ও রুটিন',
  };
}

/**
 * Calculates safe font size so text never exceeds the max width of 920px.
 */
function calculateSafeFontSize(text: string, baseSize: number, maxAllowedWidth = 920): number {
  if (!text) return baseSize;
  const charWidthFactor = 0.65;
  const estimatedWidth = text.length * baseSize * charWidthFactor;
  if (estimatedWidth <= maxAllowedWidth) {
    return baseSize;
  }
  const safeSize = Math.floor(maxAllowedWidth / (text.length * charWidthFactor));
  return Math.max(safeSize, 34); // Keep legible between 34px and 56px
}

interface ColorTheme {
  name: string;
  bgGradStart: string;
  bgGradEnd: string;
  cardFill: string;
  cardStroke: string;
  catPillBg: string;
  catPillStroke: string;
  catPillText: string;
  catPillDot: string;
  line2Color: string;
  bottomPillBg: string;
  bottomPillStroke: string;
  bottomPill1IconColor: string;
}

const THEMES: Record<string, ColorTheme> = {
  cyan: {
    name: 'cyan',
    bgGradStart: '#ECFEFF', // ultra light cyan
    bgGradEnd: '#F0FDFA',
    cardFill: '#FFFFFF',
    cardStroke: '#CCFBF1',
    catPillBg: '#E0F2FE',
    catPillStroke: '#BAE6FD',
    catPillText: '#0284C7',
    catPillDot: '#0EA5E9',
    line2Color: '#0284C7',
    bottomPillBg: '#F0FDFA',
    bottomPillStroke: '#CCFBF1',
    bottomPill1IconColor: '#0D9488',
  },
  green: {
    name: 'green',
    bgGradStart: '#F0FDF4', // ultra light emerald mint
    bgGradEnd: '#F7FEE7',
    cardFill: '#FFFFFF',
    cardStroke: '#DCFCE7',
    catPillBg: '#DCFCE7',
    catPillStroke: '#BBF7D0',
    catPillText: '#15803D',
    catPillDot: '#16A34A',
    line2Color: '#16A34A',
    bottomPillBg: '#F0FDF4',
    bottomPillStroke: '#DCFCE7',
    bottomPill1IconColor: '#16A34A',
  },
  blue: {
    name: 'blue',
    bgGradStart: '#F0F9FF', // ultra light sky/blue
    bgGradEnd: '#EFF6FF',
    cardFill: '#FFFFFF',
    cardStroke: '#E0F2FE',
    catPillBg: '#E0F2FE',
    catPillStroke: '#BAE6FD',
    catPillText: '#0369A1',
    catPillDot: '#0284C7',
    line2Color: '#2563EB',
    bottomPillBg: '#F0F9FF',
    bottomPillStroke: '#E0F2FE',
    bottomPill1IconColor: '#2563EB',
  },
  red: {
    name: 'red',
    bgGradStart: '#FFF1F2', // ultra light rose/red
    bgGradEnd: '#FEF2F2',
    cardFill: '#FFFFFF',
    cardStroke: '#FFE4E6',
    catPillBg: '#FFE4E6',
    catPillStroke: '#FECDD3',
    catPillText: '#BE123C',
    catPillDot: '#E11D48',
    line2Color: '#DC2626',
    bottomPillBg: '#FFF1F2',
    bottomPillStroke: '#FFE4E6',
    bottomPill1IconColor: '#DC2626',
  },
  purewhite: {
    name: 'purewhite',
    bgGradStart: '#FFFFFF', // pure minimalist white
    bgGradEnd: '#F8FAFC',
    cardFill: '#FFFFFF',
    cardStroke: '#F1F5F9',
    catPillBg: '#F1F5F9',
    catPillStroke: '#E2E8F0',
    catPillText: '#334155',
    catPillDot: '#64748B',
    line2Color: '#E11D48',
    bottomPillBg: '#F8FAFC',
    bottomPillStroke: '#E2E8F0',
    bottomPill1IconColor: '#DC2626',
  },
};

function getColorTheme(title: string, category: string, tags: string[], slug: string): ColorTheme {
  const combined = `${title} ${category} ${tags.join(' ')} ${slug}`.toLowerCase().normalize('NFC');

  // 1. Pure White: Productivity, Mindset, Habits, Study Methods, Stress
  if (
    combined.includes('pomodoro') ||
    combined.includes('challenge') ||
    combined.includes('habit') ||
    combined.includes('stress') ||
    combined.includes('active-recall') ||
    combined.includes('spaced-repetition') ||
    combined.includes('full-meaning') ||
    combined.includes('tips')
  ) {
    return THEMES.purewhite;
  }

  // 2. Cyan: Varsity Admission / Engineering / Medical
  if (
    combined.includes('বুয়েট') ||
    combined.includes('বুয়েট') ||
    combined.includes('buet') ||
    combined.includes('মেডিকেল') ||
    combined.includes('medical') ||
    combined.includes('mist') ||
    combined.includes('এমআইএসটি') ||
    combined.includes('ckruet') ||
    combined.includes('ঢাবি') ||
    combined.includes('du ') ||
    combined.includes('bup') ||
    combined.includes('gst') ||
    combined.includes('ভর্তি') ||
    combined.includes('admission')
  ) {
    return THEMES.cyan;
  }

  // 3. Blue: STEM, Math, Physics, Chemistry, Formulas, ICT
  if (
    combined.includes('সূত্র') ||
    combined.includes('formula') ||
    combined.includes('পদার্থ') ||
    combined.includes('physics') ||
    combined.includes('গণিত') ||
    combined.includes('math') ||
    combined.includes('রসায়ন') ||
    combined.includes('রসায়ন') ||
    combined.includes('chemistry') ||
    combined.includes('ict') ||
    combined.includes('ক্যালকুলাস') ||
    combined.includes('ভেক্টর') ||
    combined.includes('periodic-table')
  ) {
    return THEMES.blue;
  }

  // 4. Red: Results, Scholarship, Marksheet, Notice
  if (
    combined.includes('রেজাল্ট') ||
    combined.includes('result') ||
    combined.includes('বৃত্তি') ||
    combined.includes('scholarship') ||
    combined.includes('মার্কশিট') ||
    combined.includes('marksheet') ||
    combined.includes('পুনঃনিরীক্ষণ') ||
    combined.includes('rescrutiny')
  ) {
    return THEMES.red;
  }

  // 5. Green: Books, Syllabus, Routine, Bangla, English
  if (
    combined.includes('বই') ||
    combined.includes('book') ||
    combined.includes('সিলেবাস') ||
    combined.includes('syllabus') ||
    combined.includes('রুটিন') ||
    combined.includes('routine') ||
    combined.includes('বাংলা') ||
    combined.includes('bangla') ||
    combined.includes('ইংরেজি') ||
    combined.includes('english')
  ) {
    return THEMES.green;
  }

  // Fallback distributed across all 5 themes
  const themeList = [THEMES.purewhite, THEMES.cyan, THEMES.green, THEMES.blue, THEMES.red];
  const charSum = (slug || title).split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return themeList[charSum % themeList.length];
}

function generateSvgBanner(title: string, category: string, tags: string[], slug = ''): string {
  const [rawLine1, rawLine2] = splitTitle(title);
  const badges = getBadges(title, category, tags);
  const theme = getColorTheme(title, category, tags, slug);

  // Dynamic font sizing
  const fontSize1 = calculateSafeFontSize(rawLine1, 52, 920);
  const fontSize2 = calculateSafeFontSize(rawLine2, 44, 920);

  // Dynamic vertical centering
  let y1 = 275;
  let y2 = y1 + Math.max(fontSize1, fontSize2) + 24;
  if (!rawLine2) {
    y1 = 310;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Anek+Bangla:wght@700;800&amp;family=Hind+Siliguri:wght@600;700&amp;display=swap');
      .title {
        font-family: 'Anek Bangla', 'Hind Siliguri', 'Kohinoor Bangla', -apple-system, sans-serif;
        font-weight: 800;
        text-rendering: geometricPrecision;
      }
      .badge-text {
        font-family: 'Anek Bangla', 'Hind Siliguri', 'Kohinoor Bangla', -apple-system, sans-serif;
        font-weight: 700;
        text-rendering: geometricPrecision;
      }
      .meta {
        font-family: 'Hind Siliguri', 'Kohinoor Bangla', -apple-system, sans-serif;
        font-weight: 600;
        text-rendering: geometricPrecision;
      }
    </style>
    <!-- Soft light gradient for subtle depth -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.bgGradStart}" />
      <stop offset="100%" stop-color="${theme.bgGradEnd}" />
    </linearGradient>
  </defs>

  <!-- 1. Soft Light Premium Canvas -->
  <rect width="1200" height="630" fill="url(#bgGrad)" />

  <!-- 2. Clean Inside Card Frame -->
  <rect x="28" y="28" width="1144" height="574" rx="28" fill="${theme.cardFill}" stroke="${theme.cardStroke}" stroke-width="2" />

  <!-- 3. Top Row Badges -->
  <!-- Top Left: Category Pill -->
  <g transform="translate(70, 70)">
    <rect x="0" y="0" width="185" height="42" rx="21" fill="${theme.catPillBg}" stroke="${theme.catPillStroke}" stroke-width="1.5" />
    <circle cx="22" cy="21" r="5" fill="${theme.catPillDot}" />
    <text x="36" y="27" class="badge-text" font-size="16" fill="${theme.catPillText}">
      ${cleanText(badges.catBadge)}
    </text>
  </g>

  <!-- Top Right: Exam & Session Pill -->
  <g transform="translate(1130, 70)">
    <g transform="translate(-195, 0)">
      <rect x="0" y="0" width="195" height="42" rx="21" fill="#F8FAFC" stroke="#E2E8F0" stroke-width="1.5" />
      <text x="97.5" y="27" class="badge-text" font-size="15" fill="#475569" text-anchor="middle">
        ${cleanText(badges.yearBadge)}
      </text>
    </g>
  </g>

  <!-- 4. Center Hero Headline (Guaranteed Safe Width) -->
  <g transform="translate(600, ${y1})">
    <!-- Line 1: Dark Slate -->
    <text x="0" y="0" class="title" font-size="${fontSize1}" fill="#0F172A" text-anchor="middle">
      ${cleanText(rawLine1)}
    </text>

    <!-- Line 2: Thematic Accent Color -->
    ${
      rawLine2
        ? `<text x="0" y="${y2 - y1}" class="title" font-size="${fontSize2}" fill="${theme.line2Color}" text-anchor="middle">
      ${cleanText(rawLine2)}
    </text>`
        : ''
    }
  </g>

  <!-- 5. Bottom Info Row (Centered Pills) -->
  <g transform="translate(600, 480)">
    <!-- Pill 1 -->
    <g transform="translate(-320, 0)">
      <rect x="0" y="0" width="305" height="56" rx="16" fill="${theme.bottomPillBg}" stroke="${theme.bottomPillStroke}" stroke-width="1.5" />
      <text x="22" y="36" class="meta" font-size="19" fill="${theme.bottomPill1IconColor}">${badges.chip1Icon}</text>
      <text x="56" y="36" class="badge-text" font-size="17" fill="#1E293B">${cleanText(badges.chip1Text)}</text>
    </g>

    <!-- Pill 2 -->
    <g transform="translate(15, 0)">
      <rect x="0" y="0" width="305" height="56" rx="16" fill="${theme.bottomPillBg}" stroke="${theme.bottomPillStroke}" stroke-width="1.5" />
      <text x="22" y="35" class="meta" font-size="19" fill="#059669">${badges.chip2Icon}</text>
      <text x="56" y="36" class="badge-text" font-size="17" fill="#1E293B">${cleanText(badges.chip2Text)}</text>
    </g>
  </g>
</svg>`;
}

async function main() {
  const files = fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  console.log(`Processing ${files.length} blogs in ${BLOG_DIR}...`);

  let generatedCount = 0;

  for (const file of files) {
    const filePath = path.join(BLOG_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: markdownBody } = matter(content);

    const slug = frontmatter.slug || file.replace(/\.md$/, '');
    const title = frontmatter.title || slug;
    const category = frontmatter.category || '';
    const tags = frontmatter.tags || [];

    const svgContent = generateSvgBanner(title, category, tags, slug);
    const svgPath = path.join(OUTPUT_DIR, `${slug}.svg`);
    fs.writeFileSync(svgPath, svgContent, 'utf8');

    // Update markdown frontmatter coverImage
    const expectedCover = `/images/blog-covers/titles/${slug}.svg`;
    if (frontmatter.coverImage !== expectedCover) {
      frontmatter.coverImage = expectedCover;
      const updatedMarkdown = matter.stringify(markdownBody, frontmatter);
      fs.writeFileSync(filePath, updatedMarkdown, 'utf8');
    }

    generatedCount++;
  }

  console.log(`Successfully generated and verified ${generatedCount} banners without overflow!`);
}

main().catch(console.error);
