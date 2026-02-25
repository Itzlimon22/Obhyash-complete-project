export const INSTITUTE_ALIASES: Record<string, string> = {
  // --- General Universities ---
  'dhaka university': 'DU',
  du: 'DU',
  'du(a)': 'DU',
  'd.u.': 'DU',
  ঢাবি: 'DU',
  'ঢাকা বিশ্ববিদ্যালয়': 'DU',
  'ঢাকা বিশ্ববিদ্যালয়': 'DU',
  'university of dhaka': 'DU',

  'rajshahi university': 'RU',
  ru: 'RU',
  রাবি: 'RU',
  'রাজশাহী বিশ্ববিদ্যালয়': 'RU',
  'university of rajshahi': 'RU',

  'chittagong university': 'CU',
  cu: 'CU',
  চবি: 'CU',
  'চট্টগ্রাম বিশ্ববিদ্যালয়': 'CU',
  'university of chittagong': 'CU',

  'jahangirnagar university': 'JU',
  ju: 'JU',
  জাবি: 'JU',
  'জাহাঙ্গীরনগর বিশ্ববিদ্যালয়': 'JU',
  'university of jahangirnagar': 'JU',

  'khulna university': 'KU',
  ku: 'KU',
  খুবি: 'KU',
  'খুলনা বিশ্ববিদ্যালয়': 'KU',
  'university of khulna': 'KU',

  'jagannath university': 'JNU',
  jnu: 'JNU',
  জবি: 'JNU',
  'জগন্নাথ বিশ্ববিদ্যালয়': 'JNU',
  'university of jagannath': 'JNU',

  sust: 'SUST',
  'shahjalal university': 'SUST',
  'shajalal university': 'SUST',
  শাবিপ্রবি: 'SUST',
  'শাহজালাল বিজ্ঞান ও প্রযুক্তি বিশ্ববিদ্যালয়': 'SUST',
  'shahjalal university of science and technology': 'SUST',

  bup: 'BUP',
  'bangladesh university of professionals': 'BUP',
  বিইউপি: 'BUP',

  // --- Engineering Universities ---
  buet: 'BUET',
  'bangladesh university of engineering and technology': 'BUET',
  বুয়েট: 'BUET',

  ruet: 'RUET',
  'rajshahi university of engineering and technology': 'RUET',
  রুয়েট: 'RUET',

  kuet: 'KUET',
  'khulna university of engineering and technology': 'KUET',
  কুয়েট: 'KUET',

  cuet: 'CUET',
  'chittagong university of engineering and technology': 'CUET',
  চুয়েট: 'CUET',

  butex: 'BUTEX',
  'bangladesh university of textiles': 'BUTEX',
  বুটেক্স: 'BUTEX',

  iut: 'IUT',
  'islamic university of technology': 'IUT',
  আইইউটি: 'IUT',

  mist: 'MIST',
  'military institute of science and technology': 'MIST',
  এমআইএসটি: 'MIST',

  // --- Medical & Dental ---
  medical: 'MEDICAL',
  mbbs: 'MEDICAL',
  mat: 'MEDICAL',
  dmc: 'MEDICAL',
  ssmc: 'MEDICAL',
  মেডিকেল: 'MEDICAL',

  dental: 'DENTAL',
  bds: 'DENTAL',
  dat: 'DENTAL',
  ডেন্টাল: 'DENTAL',

  afmc: 'AFMC',
  'armed forces medical college': 'AFMC',
  এএফএমসি: 'AFMC',

  // --- Agricultural Universities ---
  bau: 'BAU',
  'bangladesh agricultural university': 'BAU',
  বাকৃবি: 'BAU',
  'বাংলাদেশ কৃষি বিশ্ববিদ্যালয়': 'BAU',

  sau: 'SAU',
  'sher-e-bangla agricultural university': 'SAU',
  শেকৃবি: 'SAU',
  'শেরেবাংলা কৃষি বিশ্ববিদ্যালয়': 'SAU',

  sylau: 'SYLAU',
  'sylhet agricultural university': 'SYLAU',
  সৃকৃবি: 'SYLAU',
  'সিলেট কৃষি বিশ্ববিদ্যালয়': 'SYLAU',

  bsmrau: 'BSMRAU',
  'বঙ্গবন্ধু শেখ মুজিবুর রহমান কৃষি বিশ্ববিদ্যালয়': 'BSMRAU',

  cvasu: 'CVASU',
  'চট্টগ্রাম ভেটেরিনারি ও এনিম্যাল সায়েন্সেস বিশ্ববিদ্যালয়': 'CVASU',

  // --- Clusters & Specialized ---
  gst: 'GST',
  guccho: 'GST',
  গুচ্ছ: 'GST',

  ckruet: 'CKRUET',
  'engineering cluster': 'CKRUET',

  'agri-gst': 'AGRI-GST',
  'krishi guccho': 'AGRI-GST',
  'কৃষি গুচ্ছ': 'AGRI-GST',

  bsmrmu: 'BSMRMU',
  'bangabandhu maritime university': 'BSMRMU',
};

export function standardizeInstituteName(rawInput: string): string {
  if (!rawInput) return '';
  const cleanedText = rawInput.toLowerCase().trim();

  // 1. Check exact alias mapping first
  if (INSTITUTE_ALIASES[cleanedText]) {
    return INSTITUTE_ALIASES[cleanedText];
  }

  // 2. Fuzzy/Partial keyword matches
  // Handle Engineering universities first to avoid conflict with city names
  if (cleanedText.includes('engineering') || cleanedText.includes('tech')) {
    if (cleanedText.includes('dhaka') || cleanedText.includes('buet'))
      return 'BUET';
    if (cleanedText.includes('rajshahi') || cleanedText.includes('ruet'))
      return 'RUET';
    if (cleanedText.includes('khulna') || cleanedText.includes('kuet'))
      return 'KUET';
    if (cleanedText.includes('chittagong') || cleanedText.includes('cuet'))
      return 'CUET';
  }

  // General Universities
  if (cleanedText.includes('dhaka')) return 'DU';
  if (cleanedText.includes('rajshahi')) return 'RU';
  if (cleanedText.includes('jahangirnagar')) return 'JU';
  if (cleanedText.includes('chittagong')) return 'CU';
  if (cleanedText.includes('khulna')) return 'KU';
  if (cleanedText.includes('jagannath') || cleanedText.includes('jnu'))
    return 'JNU';
  if (cleanedText.includes('shahjalal') || cleanedText.includes('sust'))
    return 'SUST';
  if (cleanedText.includes('professionals') || cleanedText.includes('bup'))
    return 'BUP';

  // Medical/Dental
  if (cleanedText.includes('med')) return 'MEDICAL';
  if (cleanedText.includes('dent')) return 'DENTAL';

  // Agriculture
  if (cleanedText.includes('agri')) {
    if (cleanedText.includes('bangladesh') || cleanedText.includes('bau'))
      return 'BAU';
    if (cleanedText.includes('sher') || cleanedText.includes('sau'))
      return 'SAU';
    if (cleanedText.includes('sylhet')) return 'SYLAU';
  }

  // 3. Last fallback: UPPERCASE
  return rawInput.toUpperCase().trim();
}
