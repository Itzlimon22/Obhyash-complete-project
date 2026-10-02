export interface QuestionItem {
  n: number;
  q: string;
  o: Record<string, string>; // 'a', 'b', 'c', 'd'
  A: string; // 'ক', 'খ', 'গ', 'ঘ' or 'a', 'b', 'c', 'd'
  E: string[]; // explanation lines
}

export interface GeneratorSettings {
  title: string;
  subtitle: string;
  hasHeader: boolean; // HDR=1 (true) or HDR=0 (false)
  pageOffset: number; // OFF=0
  playStoreUrl: string;
  websiteUrl: string;
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
