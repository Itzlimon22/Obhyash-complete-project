export interface SubjectNoteItem {
  id: string;
  slug: string;
  titleBn: string;
  paperBn: string;
  chaptersCountBn: string;
  questionsCountBn: string;
  fileSize: string;
  isFreePdf: boolean;
  badgeTextBn: string;
  ctaTextBn: string;
  targetUrl: string; // Google Drive link OR /notes/app-exclusive?subject=...
  accentColor: 'emerald' | 'teal' | 'blue' | 'purple' | 'amber' | 'rose';
  iconName: 'Atom' | 'FlaskConical' | 'Compass' | 'Dna';
  descriptionBn: string;
}

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=com.obhyash.app';

export const PHYSICS_1_DRIVE_URL =
  'https://drive.google.com/file/d/1jSV3eCfYdVjGmnYkgqEkM52W8vIziOnB/view?usp=sharing';

export const CHEMISTRY_1_DRIVE_URL =
  'https://drive.google.com/file/d/1l1glhem2orbWNQFlQ8R48Ikud9FV9xdm/view?usp=sharing';

export const HSC_SCIENCE_NOTES: SubjectNoteItem[] = [
  {
    id: 'phy-1',
    slug: 'physics-1st-paper',
    titleBn: 'পদার্থবিজ্ঞান ১ম পত্র',
    paperBn: 'ভেক্টর থেকে আদর্শ গ্যাস ও গতিতত্ত্ব',
    chaptersCountBn: '১০টি অধ্যায়',
    questionsCountBn: '৪৮০+ ক ও খ প্রশ্নোত্তর',
    fileSize: '১২.৪ MB (HD PDF)',
    isFreePdf: true,
    badgeTextBn: 'ফ্রি PDF ডাউনলোড',
    ctaTextBn: 'ফ্রি PDF ডাউনলোড করুন',
    targetUrl: PHYSICS_1_DRIVE_URL,
    accentColor: 'emerald',
    iconName: 'Atom',
    descriptionBn: 'বোর্ড প্রশ্ন ও শীর্ষ কলেজের টেস্ট পেপারের গুরুত্বপূর্ণ ক ও খ এর ১০০% নির্ভুল ব্যাখ্যা সহ নোট।',
  },
  {
    id: 'chem-1',
    slug: 'chemistry-1st-paper',
    titleBn: 'রসায়ন ১ম পত্র',
    paperBn: 'ল্যাবরেটরি থেকে কর্মমুখী রসায়ন',
    chaptersCountBn: '৫টি অধ্যায়',
    questionsCountBn: '৪২০+ ক ও খ প্রশ্নোত্তর',
    fileSize: '১০.৮ MB (HD PDF)',
    isFreePdf: true,
    badgeTextBn: 'ফ্রি PDF ডাউনলোড',
    ctaTextBn: 'ফ্রি PDF ডাউনলোড করুন',
    targetUrl: CHEMISTRY_1_DRIVE_URL,
    accentColor: 'teal',
    iconName: 'FlaskConical',
    descriptionBn: 'গুণগত রসায়ন, পর্যায়বৃত্ত ধর্ম ও রাসায়নিক পরিবর্তনের সকল প্রয়োজনীয় সংজ্ঞা ও অনুধাবনমূলক উত্তর।',
  },
  {
    id: 'phy-2',
    slug: 'physics-2nd-paper',
    titleBn: 'পদার্থবিজ্ঞান ২য় পত্র',
    paperBn: 'তাপগতিবিদ্যা থেকে জ্যোতির্বিজ্ঞান',
    chaptersCountBn: '১১টি অধ্যায়',
    questionsCountBn: '৫২০+ ক ও খ প্রশ্নোত্তর',
    fileSize: 'অ্যাপে অফলাইন রেডি',
    isFreePdf: false,
    badgeTextBn: 'অ্যাপে এক্সক্লুসিভ • অফলাইন',
    ctaTextBn: 'অ্যাপে সম্পূর্ণ নোট দেখুন',
    targetUrl: '/notes/app-exclusive?subject=physics-2nd',
    accentColor: 'blue',
    iconName: 'Atom',
    descriptionBn: 'চল তড়িৎ, স্থির তড়িৎ ও আধুনিক পদার্থবিজ্ঞানের জটিল তত্ত্বগুলোর সহজ ভাষায় রচিত হ্যান্ডনোট।',
  },
  {
    id: 'chem-2',
    slug: 'chemistry-2nd-paper',
    titleBn: 'রসায়ন ২য় পত্র',
    paperBn: 'পরিবেশ রসায়ন থেকে অর্থনৈতিক রসায়ন',
    chaptersCountBn: '৫টি অধ্যায়',
    questionsCountBn: '৪৯০+ ক ও খ প্রশ্নোত্তর',
    fileSize: 'অ্যাপে অফলাইন রেডি',
    isFreePdf: false,
    badgeTextBn: 'অ্যাপে এক্সক্লুসিভ • অফলাইন',
    ctaTextBn: 'অ্যাপে সম্পূর্ণ নোট দেখুন',
    targetUrl: '/notes/app-exclusive?subject=chemistry-2nd',
    accentColor: 'purple',
    iconName: 'FlaskConical',
    descriptionBn: 'জৈব রসায়নের শত শত বিক্রিয়া ও পরিমাণগত রসায়নের নির্ভুল ক-খ নোট অফলাইনে পড়ার সুযোগ।',
  },
  {
    id: 'math-all',
    slug: 'higher-math',
    titleBn: 'উচ্চতর গণিত ১ম ও ২য় পত্র',
    paperBn: 'মাস্টার ফর্মুলা ব্যাংক ও শর্ট রিভিশন শিট',
    chaptersCountBn: '১৮টি অধ্যায়',
    questionsCountBn: 'সকল সূত্র ও ব্যাখ্যা',
    fileSize: 'অ্যাপে অফলাইন রেডি',
    isFreePdf: false,
    badgeTextBn: 'অ্যাপে এক্সক্লুসিভ • অফলাইন',
    ctaTextBn: 'অ্যাপে ফর্মুলা ও নোট দেখুন',
    targetUrl: '/notes/app-exclusive?subject=higher-math',
    accentColor: 'amber',
    iconName: 'Compass',
    descriptionBn: 'ক্যালকুলাস, জ্যামিতি, কণিক ও স্থিতিবিদ্যার সব সূত্র এবং গুরুত্বপূর্ণ ধারণার গোছানো সংকলন।',
  },
  {
    id: 'bio-all',
    slug: 'biology',
    titleBn: 'জীববিজ্ঞান ১ম ও ২য় পত্র',
    paperBn: 'উদ্ভিদবিজ্ঞান ও প্রাণিবিজ্ঞান হ্যান্ডনোট',
    chaptersCountBn: '২৪টি অধ্যায়',
    questionsCountBn: '৯৫০+ ক ও খ প্রশ্নোত্তর',
    fileSize: 'অ্যাপে অফলাইন রেডি',
    isFreePdf: false,
    badgeTextBn: 'অ্যাপে এক্সক্লুসিভ • অফলাইন',
    ctaTextBn: 'অ্যাপে সম্পূর্ণ নোট দেখুন',
    targetUrl: '/notes/app-exclusive?subject=biology',
    accentColor: 'rose',
    iconName: 'Dna',
    descriptionBn: 'চিত্র সহ উদ্ভিদ ও প্রাণিবিজ্ঞানের প্রতিটি অধ্যায়ের বোর্ড কমন উপযোগী জ্ঞান ও অনুধাবনমূলক প্রশ্ন।',
  },
];
