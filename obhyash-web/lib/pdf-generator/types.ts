export interface QuestionItem {
  n: number;
  q: string;
  img?: string;
  o: Record<string, string>; // 'a', 'b', 'c', 'd'
  A: string; // 'ক', 'খ', 'গ', 'ঘ' or 'a', 'b', 'c', 'd'
  E: string[]; // explanation lines
  isContinuation?: boolean;
  continuationPart?: number;
  cardType?: 'question' | 'explanation' | 'unified';
}

export interface GeneratorSettings {
  // Theme and Palette
  theme?: string; // e.g. 'medical' | 'engineering' | 'varsity' | custom theme key

  // Density and Spacing
  density?: 'balanced' | 'compact' | 'spacious'; // default: 'balanced'
  balanceColumns?: boolean; // default: true

  // First page Hero Header
  title: string;
  subtitle: string;
  hasHeader: boolean; // true = 1st page full header, false = mini header from page 1

  // Mini Header (Page 2+ or all pages)
  headerLeftText: string; // e.g. "অ্যাপ ইনস্টল করো"
  headerLeftUrl: string; // e.g. "https://play.google.com/store/apps/details?id=com.obhyash.app"
  headerRightText: string; // e.g. "মেডিকেল ভর্তি মডেল টেস্ট ০১"
  showHeaderLeftIcon?: boolean;

  // Footer Left
  footerLeftPrefix: string; // e.g. "আনলিমিটেড এক্সাম দাও"
  footerSiteText: string; // e.g. "www.obhyash.com"
  footerLeftUrl: string; // e.g. "https://www.obhyash.com"
  footerLeftSuffix: string; // e.g. "এ"

  // Footer Right (Page Number)
  footerPagePrefix: string; // e.g. "পৃষ্ঠা" or "Page"
  useBanglaDigits: boolean; // true = ১, ২; false = 1, 2
  pageOffset: number; // Starting page offset (0 = starts at 1)

  // Advertising & Showcase Back Page
  includeAdPage?: boolean; // default: true (appends modern 3-phone feature showcase page at the end of PDF)

  // Standalone Viewer / Print Support
  standaloneToolbar?: boolean;
  autoPrint?: boolean;
  baseUrl?: string;
}

export interface ParseResult {
  success: boolean;
  questions: QuestionItem[];
  warnings: string[];
  detectedType: 'txt' | 'md' | 'unknown';
}

export interface PaginationPlan {
  pages: Array<[number[], number[]]>; // [ [col1_card_indices], [col2_card_indices] ]
  totalPages: number;
  fillPercentage: number;
  overflows: Array<[string, number]>;
}
