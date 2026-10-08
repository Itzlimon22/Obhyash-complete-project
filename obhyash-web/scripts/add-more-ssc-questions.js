const fs = require('fs');

const questionsFile = 'lib/data/public-mock-questions.json';
const metaFile = 'lib/data/public-mock-meta.json';

const currentQuestions = JSON.parse(fs.readFileSync(questionsFile, 'utf8'));
const currentMeta = JSON.parse(fs.readFileSync(metaFile, 'utf8'));

// Helper to make 20 high-quality board-standard questions per chapter
function generateChapterQuestions(chapterId, chapterName, subjectId, subjectName, subjectLabel, rawQuestions) {
  return rawQuestions.map((q, idx) => ({
    id: `ssc-${chapterId}-${idx + 1}`,
    question: q.question,
    options: q.options,
    correctAnswer: q.options[q.correctIdx],
    correctAnswerIndex: q.correctIdx,
    correctAnswerIndices: [q.correctIdx],
    explanation: q.explanation,
    chapter: chapterName,
    chapterId: chapterId,
    subject: subjectName,
    subjectId: subjectId,
    subjectLabel: subjectLabel,
    type: 'MCQ',
    difficulty: q.difficulty || (idx % 3 === 0 ? 'Easy' : idx % 3 === 1 ? 'Medium' : 'Hard'),
    status: 'Approved',
    author: 'system',
    createdAt: new Date().toISOString(),
    version: 1,
    tags: [chapterName, 'SSC']
  }));
}

// 1. SSC Physics - কাজ, ক্ষমতা ও শক্তি (ssc_p_c4)
const physicsWorkPowerEnergy = [
  {
    question: '১ জুল কাজ বলতে কী বোঝায়?',
    options: ['১ নিউটন বল প্রয়োগে ১ মিটার সরণ', '১ কেজি ভরের ১ মিটার উচ্চতায় স্থিতি', '১ সেকেন্ডে ১ ওয়াট কাজ', '১ নিউটন বলে ১ সেকেন্ড ক্রিয়া'],
    correctIdx: 0,
    explanation: 'কাজের সংজ্ঞা $W = F \\times s$। ১ নিউটন বল প্রয়োগে বস্তুর বলের দিকে ১ মিটার সরণ ঘটলে কৃতকাজকে ১ জুল ($1\\text{ J} = 1\\text{ N}\\cdot\\text{m}$) বলে।'
  },
  {
    question: 'কাজের মাত্রা সমীকরণ নিচের কোনটি?',
    options: ['$\\text{MLT}^{-1}$', '$\\text{ML}^2\\text{T}^{-2}$', '$\\text{MLT}^{-2}$', '$\\text{ML}^2\\text{T}^{-1}$'],
    correctIdx: 1,
    explanation: 'কাজ = বল $\\times$ সরণ = $[\\text{MLT}^{-2}] \\times [\\text{L}] = [\\text{ML}^2\\text{T}^{-2}]$।'
  },
  {
    question: '১০ কেজি ভরের একটি বস্তুকে মাটি থেকে ৫ মিটার উঁচুতে তুললে বিভব শক্তি কত হবে? ($g = 9.8\\text{ m/s}^2$)',
    options: ['49 J', '98 J', '490 J', '980 J'],
    correctIdx: 2,
    explanation: 'বিভব শক্তি $E_p = mgh = 10 \\times 9.8 \\times 5 = 490\\text{ J}$।'
  },
  {
    question: 'একটি বস্তুর বেগ ৩ গুণ করা হলে গতিশক্তি কত গুণ বৃদ্ধি পাবে?',
    options: ['৩ গুণ', '৬ গুণ', '৮ গুণ', '৯ গুণ'],
    correctIdx: 3,
    explanation: 'গতিশক্তি $E_k = \\frac{1}{2}mv^2$। বেগ $v\' = 3v$ হলে নতুন গতিশক্তি $E_k\' = (3)^2 E_k = 9 E_k$ (অর্থাৎ ৯ গুণ হবে)।'
  },
  {
    question: '১ হর্স পাওয়ার (Horse Power) সমান কত ওয়াট?',
    options: ['500 W', '746 W', '1000 W', '750 W'],
    correctIdx: 1,
    explanation: '$1\\text{ HP} = 746\\text{ Watt}$।'
  },
  {
    question: 'বল এবং সরণের মধ্যবর্তী কোণ $90^\\circ$ হলে কৃতকাজ কত?',
    options: ['সর্বোচ্চ', 'ধনাত্মক', 'শূন্য', 'ঋণাত্মক'],
    correctIdx: 2,
    explanation: '$W = F s \\cos \\theta = F s \\cos(90^\\circ) = 0$। একে কাজহীন বল বলে।'
  },
  {
    question: 'একটি ইঞ্জিনের প্রদত্ত ক্ষমতা 1000 W এবং কার্যকর ক্ষমতা 750 W হলে কর্মদক্ষতা কত?',
    options: ['50%', '65%', '75%', '80%'],
    correctIdx: 2,
    explanation: 'কর্মদক্ষতা $\\eta = \\frac{\\text{কার্যকর ক্ষমতা}}{\\text{প্রদত্ত ক্ষমতা}} \\times 100\\% = \\frac{750}{1000} \\times 100\\% = 75\\%$।'
  },
  {
    question: 'স্প্রিং-এর সঞ্চিত বিভব শক্তির সূত্র কোনটি?',
    options: ['$E_p = kx$', '$E_p = \\frac{1}{2} k x^2$', '$E_p = 2 k x^2$', '$E_p = mgh$'],
    correctIdx: 1,
    explanation: 'স্প্রিং প্রসারিত বা সংকুচিত করলে কৃতকাজ তথা সঞ্চিত বিভব শক্তি $E_p = \\frac{1}{2} k x^2$, যেখানে $k$ স্প্রিং ধ্রুবক।'
  },
  {
    question: 'মুক্তভাবে পড়ন্ত বস্তুর ক্ষেত্রে ভূমিতে স্পর্শ করার পূর্ব মুহূর্তে নিচের কোনটি সত্য?',
    options: ['বিভব শক্তি সর্বোচ্চ', 'গতিশক্তি শূন্য', 'গতিশক্তি সর্বোচ্চ ও বিভব শক্তি শূন্য', 'উভয় শক্তি সমান'],
    correctIdx: 2,
    explanation: 'ভূমি স্পর্শ করার ঠিক পূর্ব মুহূর্তে উচ্চতা $h \\to 0$, ফলে বিভব শক্তি $E_p = 0$ এবং বেগ সর্বোচ্চ হওয়ায় গতিশক্তি $E_k$ সর্বোচ্চ হয়।'
  },
  {
    question: 'ক্ষমতার একক ওয়াট ($W$) কে নিচের কোন এককে প্রকাশ করা যায়?',
    options: ['$\\text{J}\\cdot\\text{s}$', '$\\text{J/s}$', '$\\text{N}\\cdot\\text{m}$', '$\\text{kg}\\cdot\\text{m/s}$'],
    correctIdx: 1,
    explanation: 'ক্ষমতা $P = \\frac{W}{t}$, সুতরাং একক জুল/সেকেন্ড ($\\text{J/s}$) বা ওয়াট।'
  },
  {
    question: 'কোনো বস্তুর ভর অর্ধেক এবং বেগ দ্বিগুণ করলে তার গতিশক্তি কী হবে?',
    options: ['অপরিবর্তিত থাকবে', 'দ্বিগুণ হবে', 'চারগুণ হবে', 'অর্ধেক হবে'],
    correctIdx: 1,
    explanation: '$E_k\' = \\frac{1}{2}\\left(\\frac{m}{2}\\right)(2v)^2 = \\frac{1}{2}\\left(\\frac{m}{2}\\right)(4v^2) = 2 \\times \\left(\\frac{1}{2}mv^2\\right) = 2E_k$ (দ্বিগুণ হবে)।'
  },
  {
    question: 'ঘর্ষণ বল দ্বারা কৃতকাজ সর্বদা কেমন হয়?',
    options: ['ধনাত্মক', 'ঋণাত্মক', 'শূন্য', 'অসীম'],
    correctIdx: 1,
    explanation: 'ঘর্ষণ বল গতির বিপরীত দিকে কাজ করে ($\\theta = 180^\\circ$), তাই $\\cos(180^\\circ) = -1$ হওয়ায় কৃতকাজ সর্বদা ঋণাত্মক।'
  },
  {
    question: 'নিচের কোনটি নবায়নযোগ্য শক্তির উৎস?',
    options: ['কয়লা', 'প্রাকৃতিক গ্যাস', 'বায়োগ্যাস ও সৌরশক্তি', 'ইউরেনিয়াম'],
    correctIdx: 2,
    explanation: 'সৌরশক্তি, বায়ুশক্তি ও বায়োগ্যাস নিঃশেষ হয় না, তাই এগুলো নবায়নযোগ্য শক্তি।'
  },
  {
    question: 'একটি ক্রেন ২০ সেকেন্ডে ২০০ কেজি ভরের বস্তুকে ১০ মিটার ওপরে তুললে ক্রেনের ক্ষমতা কত? ($g = 9.8\\text{ m/s}^2$)',
    options: ['980 W', '1960 W', '490 W', '3920 W'],
    correctIdx: 0,
    explanation: '$P = \\frac{mgh}{t} = \\frac{200 \\times 9.8 \\times 10}{20} = 980\\text{ W}$।'
  },
  {
    question: 'ভরবেগ $p$ এবং গতিশক্তি $E_k$ এর মধ্যকার সঠিক সম্পর্ক কোনটি?',
    options: ['$E_k = \\frac{p}{2m}$', '$E_k = \\frac{p^2}{2m}$', '$E_k = 2mp^2$', '$E_k = \\sqrt{2mp}$'],
    correctIdx: 1,
    explanation: '$E_k = \\frac{1}{2}mv^2 = \\frac{(mv)^2}{2m} = \\frac{p^2}{2m}$।'
  },
  {
    question: 'নিচের কোনটি শক্তির রূপান্তরের ক্ষেত্রে শক্তির নিত্যতা নীতি সমর্থন করে?',
    options: ['শক্তির সৃষ্টি সম্ভব', 'শক্তির বিনাশ সম্ভব', 'মহাবিশ্বে মোট শক্তির পরিমাণ নির্দিষ্ট ও অপরিবর্তনীয়', 'শক্তি কখনো অন্য রূপে রূপান্তর হয় না'],
    correctIdx: 2,
    explanation: 'শক্তির নিত্যতা সূত্র অনুযায়ী শক্তির সৃষ্টি বা ধ্বংস নেই, কেবল রূপান্তর ঘটে এবং মহাবিশ্বের মোট শক্তি নির্দিষ্ট।'
  },
  {
    question: 'অভিকর্ষ বলের বিপরীতে বস্তু উঠালে অভিকর্ষ বল দ্বারা কৃতকাজ কেমন?',
    options: ['ধনাত্মক', 'ঋণাত্মক', 'শূন্য', 'কোনোটিই নয়'],
    correctIdx: 1,
    explanation: 'অভিকর্ষ বল নিচের দিকে কিন্তু সরণ ওপরের দিকে হওয়ায় অভিকর্ষ বল কর্তৃক কাজ ঋণাত্মক।'
  },
  {
    question: '১ কিলোওয়াট-ঘণ্টা ($1\\text{ kWh}$) সমান কত জুল?',
    options: ['$3.6 \\times 10^5\\text{ J}$', '$3.6 \\times 10^6\\text{ J}$', '$3.6 \\times 10^3\\text{ J}$', '$7.46 \\times 10^5\\text{ J}$'],
    correctIdx: 1,
    explanation: '$1\\text{ kWh} = 1000\\text{ W} \\times 3600\\text{ s} = 3.6 \\times 10^6\\text{ J}$ বা ৩.৬ মেগাজুল।'
  },
  {
    question: 'একটি বস্তুর গতিশক্তি ১৬ গুণ করা হলে এর ভরবেগ কত গুণ হবে?',
    options: ['২ গুণ', '৪ গুণ', '৮ গুণ', '১৬ গুণ'],
    correctIdx: 1,
    explanation: '$p = \\sqrt{2mE_k}$। গতিশক্তি ১৬ গুণ হলে ভরবেগ $\\sqrt{16} = 4$ গুণ হবে।'
  },
  {
    question: 'কোন যন্ত্রটি যান্ত্রিক শক্তিকে বিদ্যুৎ শক্তিতে রূপান্তরিত করে?',
    options: ['বৈদ্যুতিক মোটর', 'ডায়নামো বা জেনারেটর', 'ব্যাটারি', 'বৈদ্যুতিক পাখা'],
    correctIdx: 1,
    explanation: 'ডায়নামো বা জেনারেটর যান্ত্রিক শক্তিকে তড়িৎ শক্তিতে রূপান্তর করে। মোটর উল্টো কাজটি করে।'
  }
];

// 2. SSC Chemistry - পর্যায় সারণি (ssc_c_c4)
const chemistryPeriodicTable = [
  {
    question: 'আধুনিক পর্যায় সারণির মূল ভিত্তি কী?',
    options: ['পারমাণবিক ভর', 'পারমাণবিক সংখ্যা বা ইলেকট্রন বিন্যাস', 'আইসোটোপ সংখ্যা', 'যোজ্যতা'],
    correctIdx: 1,
    explanation: 'আধুনিক পর্যায় সারণির মূল ভিত্তি হলো মৌলের পারমাণবিক সংখ্যা (প্রোটন সংখ্যা) এবং তাদের ইলেকট্রন বিন্যাস।'
  },
  {
    question: 'আধুনিক পর্যায় সারণিতে কয়টি পর্যায় এবং কয়টি গ্রুপ রয়েছে?',
    options: ['৭টি পর্যায় ও ৮টি গ্রুপ', '৭টি পর্যায় ও ১৮টি গ্রুপ', '৮টি পর্যায় ও ১৮টি গ্রুপ', '৬টি পর্যায় ও ৭টি গ্রুপ'],
    correctIdx: 1,
    explanation: 'IUPAC অনুমোদিত আধুনিক পর্যায় সারণিতে ৭টি আনুভূমিক পর্যায় এবং ১৮টি খাড়া গ্রুপ রয়েছে।'
  },
  {
    question: 'পর্যায় সারণির গ্রুপ-১ এর মৌলগুলোকে কী বলা হয়?',
    options: ['মৃৎক্ষার ধাতু', 'ক্ষার ধাতু', 'হ্যালোজেন', 'নিষ্ক্রিয় গ্যাস'],
    correctIdx: 1,
    explanation: 'গ্রুপ-১ এর মৌলগুলো (Li, Na, K, Rb, Cs, Fr) পানির সাথে বিক্রিয়া করে তীব্র ক্ষার তৈরি করে বলে এদের ক্ষার ধাতু বলা হয়।'
  },
  {
    question: 'নিচের কোনটি মৃৎক্ষার ধাতু?',
    options: ['সোডিয়াম (Na)', 'ক্যালসিয়াম (Ca)', 'কপার (Cu)', 'ক্লোরিন (Cl)'],
    correctIdx: 1,
    explanation: 'গ্রুপ-২ এর মৌলগুলোকে (Be, Mg, Ca, Sr, Ba, Ra) মৃৎক্ষার ধাতু বলা হয়।'
  },
  {
    question: 'পর্যায় সারণিতে একই পর্যায়ে বাম থেকে ডানে গেলে পরমাণুর আকার বা ব্যাসার্ধের কী পরিবর্তন ঘটে?',
    options: ['বৃদ্ধি পায়', 'হ্রাস পায়', 'অপরিবর্তিত থাকে', 'প্রথমে কমে পরে বাড়ে'],
    correctIdx: 1,
    explanation: 'একই পর্যায়ে বাম থেকে ডানে গেলে নতুন শক্তিস্তর যুক্ত হয় না কিন্তু প্রোটন ও ইলেকট্রন বাড়ায় নিউক্লিয়াসের আকর্ষণ বাড়ে, ফলে পরমাণুর আকার হ্রাস পায়।'
  },
  {
    question: 'নিচের মৌলগুলোর মধ্যে কোনটির তড়িৎ ঋণাত্মকতা সবচেয়ে বেশি?',
    options: ['অক্সিজেন (O)', 'নাইট্রোজেন (N)', 'ফ্লোরিন (F)', 'ক্লোরিন (Cl)'],
    correctIdx: 2,
    explanation: 'পর্যায় সারণির সকল মৌলের মধ্যে ফ্লোরিনের (F) তড়িৎ ঋণাত্মকতার মান সর্বোচ্চ (৪.০)।'
  },
  {
    question: 'নিচের কোন মৌলটির প্রথম আয়নীকরণ শক্তির মান সবচেয়ে বেশি?',
    options: ['সোডিয়াম (Na)', 'ম্যাগনেসিয়াম (Mg)', 'অ্যালুমিনিয়াম (Al)', 'হিলিয়াম (He)'],
    correctIdx: 3,
    explanation: 'নিষ্ক্রিয় গ্যাস হিলিয়ামের আকার অত্যন্ত ছোট এবং এর প্রথম শক্তিস্তর সম্পূর্ণ স্থিতিশীল থাকায় এর আয়নীকরণ শক্তি সর্বোচ্চ।'
  },
  {
    question: 'হ্যালোজেন মৌলগুলো পর্যায় সারণির কোন গ্রুপে অবস্থিত?',
    options: ['গ্রুপ ১৬', 'গ্রুপ ১৭', 'গ্রুপ ১৮', 'গ্রুপ ২'],
    correctIdx: 1,
    explanation: 'গ্রুপ-১৭ এর মৌলগুলোকে (F, Cl, Br, I, At) হ্যালোজেন বা লবণ উৎপাদক বলা হয়।'
  },
  {
    question: 'নিষ্ক্রিয় গ্যাসসমূহ পর্যায় সারণির কোন গ্রুপে অন্তর্ভুক্ত?',
    options: ['গ্রুপ ১', 'গ্রুপ ৭', 'গ্রুপ ১৮', 'গ্রুপ ১৭'],
    correctIdx: 2,
    explanation: 'গ্রুপ-১৮ এর মৌলগুলো (He, Ne, Ar, Kr, Xe, Rn, Og) রাসায়নিকভাবে অত্যন্ত নিষ্ক্রিয়।'
  },
  {
    question: 'মেন্ডেলিফের মূল পর্যায় সূত্রের ভিত্তি কী ছিল?',
    options: ['পারমাণবিক সংখ্যা', 'পারমাণবিক ভর', 'ঘনত্ব', 'গলনাঙ্ক'],
    correctIdx: 1,
    explanation: '১৮৬৯ সালে রুশ বিজ্ঞানী মেন্ডেলিফ মৌলসমূহের পারমাণবিক ভর বৃদ্ধির ক্রম অনুসারে পর্যায় সূত্র প্রদান করেন।'
  },
  {
    question: 'পর্যায় সারণির কোন গ্রুপে মুদ্রা ধাতুসমূহ অবস্থান করে?',
    options: ['গ্রুপ ১০', 'গ্রুপ ১১', 'গ্রুপ ১২', 'গ্রুপ ১৩'],
    correctIdx: 1,
    explanation: 'গ্রুপ-১১ এর কপার (Cu), সিলভার (Ag) ও গোল্ড (Au) প্রাচীনকাল থেকে মুদ্রা তৈরিতে ব্যবহৃত হওয়ায় এদের মুদ্রা ধাতু বলে।'
  },
  {
    question: 'ল্যান্থানাইড সারির মৌলসমূহ কোন পর্যায়ে অবস্থিত?',
    options: ['পর্যায় ৫', 'পর্যায় ৬', 'পর্যায় ৭', 'পর্যায় ৪'],
    correctIdx: 1,
    explanation: 'ল্যান্থানাইড সারির মৌলসমূহ পর্যায় সারণির ৬ষ্ঠ পর্যায় এবং গ্রুপ ৩ এর অন্তর্ভুক্ত।'
  },
  {
    question: 'নিচের কোনটির ইলেকট্রন আসক্তি সর্বাধিক?',
    options: ['ফ্লোরিন (F)', 'ক্লোরিন (Cl)', 'ব্রোমিন (Br)', 'আয়োডিন (I)'],
    correctIdx: 1,
    explanation: 'ক্লোরিনের (Cl) ইলেকট্রন আসক্তি ফ্লোরিনের চেয়ে বেশি, কারণ ফ্লোরিনের ছোট আকারের কারণে ইলেকট্রন মেঘের ঘনত্ব বেশি থাকায় বিকর্ষণ ঘটে।'
  },
  {
    question: 'পর্যায় সারণির একই গ্রুপে ওপর থেকে নিচে নামলে পরমাণুর আকার কেমন হয়?',
    options: ['হ্রাস পায়', 'বৃদ্ধি পায়', 'একই থাকে', 'শূন্য হয়'],
    correctIdx: 1,
    explanation: 'একই গ্রুপে ওপর থেকে নিচে গেলে প্রতি ধাপে একটি করে নতুন প্রধান শক্তিস্তর যুক্ত হয়, ফলে পরমাণুর আকার বৃদ্ধি পায়।'
  },
  {
    question: 'নিচের কোনটি অপধাতু বা অপধাতব মৌল (Metalloid)?',
    options: ['সিলিকন (Si)', 'সোডিয়াম (Na)', 'সালফার (S)', 'আয়রন (Fe)'],
    correctIdx: 0,
    explanation: 'সিলিকন (Si), বোরন (B), জার্মেনিয়াম (Ge) ইত্যাদি ধাতু ও অধাতু উভয়ের বৈশিষ্ট্য প্রকাশ করায় অপধাতু।'
  },
  {
    question: 'একটি পরমাণুর ইলেকট্রন বিন্যাস $1s^2 2s^2 2p^6 3s^2 3p^5$ হলে এর গ্রুপ সংখ্যা কত?',
    options: ['৫', '৭', '১৫', '১৭'],
    correctIdx: 3,
    explanation: 'সর্ববহিঃস্থ স্তরে $s$ ও $p$ অরবিটালে মোট ইলেকট্রন $2 + 5 = 7$ হলে গ্রুপ সংখ্যা $= 10 + 7 = 17$।'
  },
  {
    question: 'ত্রয়ী সূত্রের প্রবক্তা কোন বিজ্ঞানী?',
    options: ['মেন্ডেলিফ', 'নিউল্যান্ড', 'ডোবেরাইনার', 'মসলে'],
    correctIdx: 2,
    explanation: 'জার্মান বিজ্ঞানী ডোবেরাইনার ১৮২৯ সালে মৌলসমূহের পারমাণবিক ভরের সম্পর্কের ভিত্তিতে ত্রয়ী সূত্র (Law of Triads) আবিষ্কার করেন।'
  },
  {
    question: 'অষ্টক সূত্রের প্রবক্তা কে?',
    options: ['জন নিউল্যান্ডস', 'ডোবেরাইনার', 'ল্যাভয়সিয়ে', 'বোর'],
    correctIdx: 0,
    explanation: '১৮৬৪ সালে জন নিউল্যান্ডস মৌলসমূহের ধর্মের পুনরাবৃত্তির ভিত্তিতে অষ্টক সূত্র (Law of Octaves) উপস্থাপন করেন।'
  },
  {
    question: 'নিচের কোন মৌল জোড়টি কর্ণ সম্পর্ক (Diagonal relationship) প্রদর্শন করে?',
    options: ['Li ও Mg', 'Na ও K', 'Be ও Ca', 'C ও Si'],
    correctIdx: 0,
    explanation: 'দ্বিতীয় ও তৃতীয় পর্যায়ের কোণাকুণি মৌল লিথিয়াম (Li) ও ম্যাগনেসিয়াম (Mg) এর মধ্যে ধর্মের মিলকে কর্ণ সম্পর্ক বলে।'
  },
  {
    question: 'পর্যায় সারণিতে সবচেয়ে ভারী প্রাকৃতিক মৌল কোনটি?',
    options: ['লেড (Pb)', 'ইউরেনিয়াম (U)', 'গোল্ড (Au)', 'রেডিয়াম (Ra)'],
    correctIdx: 1,
    explanation: 'প্রাকৃতিকভাবে প্রাপ্ত সবচেয়ে ভারী মৌল ইউরেনিয়াম (পারমাণবিক সংখ্যা ৯২)।'
  }
];

// 3. SSC Math - বীজগাণিতিক রাশি (ssc_m_c3)
const mathAlgebraicExpressions = [
  {
    question: 'যদি $a + b = 7$ এবং $ab = 10$ হয়, তবে $a^2 + b^2$ এর মান কত?',
    options: ['29', '39', '49', '69'],
    correctIdx: 0,
    explanation: '$a^2 + b^2 = (a+b)^2 - 2ab = (7)^2 - 2(10) = 49 - 20 = 29$।'
  },
  {
    question: '$x + \\frac{1}{x} = 3$ হলে $x^2 + \\frac{1}{x^2}$ এর মান কত?',
    options: ['7', '9', '11', '13'],
    correctIdx: 0,
    explanation: '$x^2 + \\frac{1}{x^2} = \\left(x + \\frac{1}{x}\\right)^2 - 2 = (3)^2 - 2 = 9 - 2 = 7$।'
  },
  {
    question: '$x + \\frac{1}{x} = 2$ হলে $x^3 + \\frac{1}{x^3}$ এর মান কত?',
    options: ['2', '4', '6', '8'],
    correctIdx: 0,
    explanation: '$x^3 + \\frac{1}{x^3} = \\left(x+\\frac{1}{x}\\right)^3 - 3\\left(x+\\frac{1}{x}\\right) = 2^3 - 3(2) = 8 - 6 = 2$।'
  },
  {
    question: 'যদি $a + b = 5$ এবং $a - b = 3$ হয়, তবে $ab$ এর মান কত?',
    options: ['2', '4', '8', '16'],
    correctIdx: 1,
    explanation: '$ab = \\frac{(a+b)^2 - (a-b)^2}{4} = \\frac{25 - 9}{4} = \\frac{16}{4} = 4$।'
  },
  {
    question: '$a^3 - b^3$ এর উৎপাদকীয় সূত্র কোনটি?',
    options: ['$(a-b)(a^2 + ab + b^2)$', '$(a-b)(a^2 - ab + b^2)$', '$(a+b)(a^2 - ab + b^2)$', '$(a-b)^3 + 3ab(a-b)$'],
    correctIdx: 0,
    explanation: '$a^3 - b^3$ এর উৎপাদক সূত্র হলো $(a-b)(a^2 + ab + b^2)$।'
  },
  {
    question: '$x^2 - 5x + 6$ এর উৎপাদকে বিশ্লেষিত রূপ কোনটি?',
    options: ['$(x-1)(x-6)$', '$(x-2)(x-3)$', '$(x+2)(x+3)$', '$(x-2)(x+3)$'],
    correctIdx: 1,
    explanation: '$x^2 - 5x + 6 = x^2 - 2x - 3x + 6 = (x-2)(x-3)$।'
  },
  {
    question: '$4x^2 - 9y^2$ এর একটি উৎপাদক নিচের কোনটি?',
    options: ['$2x - 3y$', '$4x - 9y$', '$2x - 9y$', '$x - y$'],
    correctIdx: 0,
    explanation: '$4x^2 - 9y^2 = (2x)^2 - (3y)^2 = (2x + 3y)(2x - 3y)$।'
  },
  {
    question: 'যদি $x = 3 + 2\\sqrt{2}$ হয়, তবে $\\frac{1}{x}$ এর মান কত?',
    options: ['$3 - 2\\sqrt{2}$', '$3 + 2\\sqrt{2}$', '$-3 + 2\\sqrt{2}$', '$\\sqrt{2} - 3$'],
    correctIdx: 0,
    explanation: '$\\frac{1}{x} = \\frac{1}{3 + 2\\sqrt{2}} = \\frac{3 - 2\\sqrt{2}}{3^2 - (2\\sqrt{2})^2} = \\frac{3 - 2\\sqrt{2}}{9 - 8} = 3 - 2\\sqrt{2}$।'
  },
  {
    question: '$a^4 + a^2 + 1$ এর উৎপাদকে বিশ্লেষিত রূপ কোনটি?',
    options: ['$(a^2+a+1)(a^2-a+1)$', '$(a^2+1)(a^2-1)$', '$(a^2+a-1)(a^2-a-1)$', '$(a+1)^2(a-1)^2$'],
    correctIdx: 0,
    explanation: '$a^4 + a^2 + 1 = (a^2+1)^2 - a^2 = (a^2+1+a)(a^2+1-a) = (a^2+a+1)(a^2-a+1)$।'
  },
  {
    question: 'যদি $a + b + c = 0$ হয়, তবে $a^3 + b^3 + c^3$ এর মান কত?',
    options: ['0', '$3abc$', '$-3abc$', '$abc$'],
    correctIdx: 1,
    explanation: 'আমরা জানি $a^3 + b^3 + c^3 - 3abc = (a+b+c)(a^2+b^2+c^2-ab-bc-ca)$। যেহেতু $a+b+c=0$, তাই $a^3 + b^3 + c^3 = 3abc$।'
  },
  {
    question: '$(a + b)^2 + (a - b)^2$ সমান কত?',
    options: ['$2(a^2 + b^2)$', '$4ab$', '$a^2 + b^2$', '$2ab$'],
    correctIdx: 0,
    explanation: '$(a+b)^2 + (a-b)^2 = (a^2+2ab+b^2) + (a^2-2ab+b^2) = 2(a^2+b^2)$।'
  },
  {
    question: '$(a+b)^2 - (a-b)^2$ সমান কত?',
    options: ['$2ab$', '$4ab$', '$2(a^2+b^2)$', '$a^2 - b^2$'],
    correctIdx: 1,
    explanation: '$(a+b)^2 - (a-b)^2 = 4ab$।'
  },
  {
    question: '$x + \\frac{1}{x} = \\sqrt{3}$ হলে $x^3 + \\frac{1}{x^3}$ এর মান কত?',
    options: ['0', '$3\\sqrt{3}$', '$\\sqrt{3}$', '$6\\sqrt{3}$'],
    correctIdx: 0,
    explanation: '$x^3 + \\frac{1}{x^3} = (\\sqrt{3})^3 - 3(\\sqrt{3}) = 3\\sqrt{3} - 3\\sqrt{3} = 0$।'
  },
  {
    question: 'যদি $p^2 - 1 = 4p$ হয়, তবে $p - \\frac{1}{p}$ এর মান কত?',
    options: ['2', '4', '8', '16'],
    correctIdx: 1,
    explanation: '$p$ দ্বারা ভাগ করলে: $p - \\frac{1}{p} = 4$।'
  },
  {
    question: '$x^3 - 8$ এর একটি উৎপাদক হলো:',
    options: ['$x + 2$', '$x - 2$', '$x^2 - 2x + 4$', '$x - 4$'],
    correctIdx: 1,
    explanation: '$x^3 - 2^3 = (x - 2)(x^2 + 2x + 4)$।'
  },
  {
    question: 'যদি $a - b = 4$ এবং $ab = 3$ হয়, তবে $a^3 - b^3$ এর মান কত?',
    options: ['64', '100', '28', '84'],
    correctIdx: 1,
    explanation: '$a^3 - b^3 = (a-b)^3 + 3ab(a-b) = 4^3 + 3(3)(4) = 64 + 36 = 100$।'
  },
  {
    question: '$x^2 + 7x + 12$ এর শূন্যসমূহ (roots) কী কী?',
    options: ['-3, -4', '3, 4', '-3, 4', '3, -4'],
    correctIdx: 0,
    explanation: '$x^2 + 7x + 12 = (x+3)(x+4) = 0 \\implies x = -3, -4$।'
  },
  {
    question: '$(x+a)(x+b)$ এর গুণফল কোনটি?',
    options: ['$x^2 + (a+b)x + ab$', '$x^2 + abx + (a+b)$', '$x^2 + (a-b)x - ab$', '$x^2 + ab$'],
    correctIdx: 0,
    explanation: '$(x+a)(x+b) = x^2 + (a+b)x + ab$।'
  },
  {
    question: 'যদি $a + b + c = 9$ এবং $ab + bc + ca = 26$ হয়, তবে $a^2 + b^2 + c^2$ কত?',
    options: ['29', '39', '49', '59'],
    correctIdx: 0,
    explanation: '$a^2 + b^2 + c^2 = (a+b+c)^2 - 2(ab+bc+ca) = 9^2 - 2(26) = 81 - 52 = 29$।'
  },
  {
    question: '$x^2 - y^2 - 2y - 1$ এর উৎপাদক কোনটি?',
    options: ['$(x+y+1)(x-y-1)$', '$(x-y+1)(x+y-1)$', '$(x+y)(x-y)$', '$(x+y-1)(x-y+1)$'],
    correctIdx: 0,
    explanation: '$x^2 - (y^2 + 2y + 1) = x^2 - (y+1)^2 = (x + y + 1)(x - y - 1)$।'
  }
];

// 4. SSC Biology - জীবকোষ ও টিস্যু (ssc_b_c2)
const biologyCellTissue = [
  {
    question: 'উদ্ভিদকোষের অনন্য বৈশিষ্ট্য নিচের কোনটি?',
    options: ['সেন্ট্রোসোম', 'কোষ প্রাচীর ও প্লাস্টিড', 'লাইসোসোম', 'রাইবোসোম'],
    correctIdx: 1,
    explanation: 'কোষ প্রাচীর ও প্লাস্টিড (ক্লোরোপ্লাস্ট) প্রধানত উদ্ভিদকোষে থাকে এবং এটি প্রাণীকোষে থাকে না।'
  },
  {
    question: 'কোষের শক্তিঘর (Powerhouse) কাকে বলা হয়?',
    options: ['রাইবোসোম', 'গলগি বস্তু', 'মাইটোকন্ড্রিয়া', 'নিউক্লিয়াস'],
    correctIdx: 2,
    explanation: 'মাইটোকন্ড্রিয়ায় ক্রেবস চক্র ও শ্বসনের মাধ্যমে বিপুল পরিমাণ শক্তি (ATP) উৎপন্ন হওয়ায় একে পাওয়ার হাউস বলা হয়।'
  },
  {
    question: 'কোষের প্রোটিন তৈরির কারখানা বলা হয় কোন অঙ্গাণুকে?',
    options: ['মাইটোকন্ড্রিয়া', 'রাইবোসোম', 'লাইসোসোম', 'প্লাস্টিড'],
    correctIdx: 1,
    explanation: 'রাইবোসোমে অ্যামাইনো এসিড থেকে প্রোটিন সংশ্লেষিত হয়, তাই একে কোষের প্রোটিন ফ্যাক্টরি বলা হয়।'
  },
  {
    question: 'নিচের কোন অঙ্গাণুকে আত্মঘাতী থলিকা (Suicidal bag) বলা হয়?',
    options: ['লাইসোসোম', 'রাইবোসোম', 'সেন্ট্রিওল', 'পেরোক্সিসোম'],
    correctIdx: 0,
    explanation: 'লাইসোসোমে হাইড্রোলাইটিক এনজাইম থাকে যা তীব্র প্রতিকূল পরিবেশে বিদীর্ণ হয়ে পুরো কোষটিকে পরিপাক করে ফেলে।'
  },
  {
    question: 'উদ্ভিদে পানি ও খনিজ লবণ মূলরোম থেকে পাতায় পরিবহন করে কোন টিস্যু?',
    options: ['ফ্লোয়েম', 'জাইলেম', 'প্যারেনকাইমা', 'কোলেনকাইমা'],
    correctIdx: 1,
    explanation: 'জাইলেম টিস্যু (ট্রাকিড, ভেসেল) পানি ও খনিজ লবণ ওপরে পরিবহন করে। ফ্লোয়েম প্রস্তুতকৃত খাদ্য পরিবহন করে।'
  },
  {
    question: 'কোন প্লাস্টিড উদ্ভিদের ফুল ও ফলের আকর্ষণীয় বর্ণের জন্য দায়ী?',
    options: ['ক্লোরোপ্লাস্ট', 'ক্রোমোপ্লাস্ট', 'লিউ Kopploplast (লিউরোপ্লাস্ট)', 'প্রোপ্লাস্টিড'],
    correctIdx: 1,
    explanation: 'ক্রোমোপ্লাস্টে ক্যারোটিনয়েড রঞ্জক (হলুদ, লাল, কমলা) থাকায় এটি ফুল ও ফলের রঙিন বর্ণের জন্য দায়ী।'
  },
  {
    question: 'রক্ত কোন ধরনের টিস্যু?',
    options: ['আবরণী কলা', 'তরল যোজক কলা', 'পেশি কলা', 'স্নায়ু কলা'],
    correctIdx: 1,
    explanation: 'রক্ত হলো ক্ষারীয় ও তরল যোজক কলা (Vascular connective tissue)।'
  },
  {
    question: 'প্রাণীদেহের ঐচ্ছিক পেশি কোথায় পাওয়া যায়?',
    options: ['হৃদপিণ্ডে', 'পাকস্থলীতে', 'হাতে ও পায়ের কঙ্কাল পেশিতে', 'রক্তনালীর প্রাচীরে'],
    correctIdx: 2,
    explanation: 'যেসব পেশি ইচ্ছামতো সংকুচিত ও প্রসারিত করা যায় (কঙ্কাল পেশি যেমন হাত-পায়ের পেশি) তা ঐচ্ছিক পেশি।'
  },
  {
    question: 'অস্থি এবং তরুণাস্থি কোন ধরনের কলার উদাহরণ?',
    options: ['কঙ্কাল যোজক কলা', 'পেশি কলা', 'আবরণী কলা', 'স্নায়ু কলা'],
    correctIdx: 0,
    explanation: 'অস্থি ও তরুণাস্থি শরীরের অভ্যন্তরীণ কাঠামো গঠন করে, এগুলো কঙ্কাল যোজক কলা।'
  },
  {
    question: 'স্নায়ু টিস্যুর গঠন ও কাজের একক কী?',
    options: ['নেফ্রন', 'নিউরণ', 'অ্যাক্সন', 'ডেনড্রন'],
    correctIdx: 1,
    explanation: 'স্নায়ুতন্ত্রের গঠন ও কার্যকরী একক হলো নিউরন (Neuron)।'
  },
  {
    question: 'বৃক্ক বা কিডনির গঠন ও কাজের একক কী?',
    options: ['নিউরণ', 'নেফ্রন', 'অ্যালভিওলাই', 'কোষ'],
    correctIdx: 1,
    explanation: 'বৃক্কের গঠন ও কার্যের একক হলো নেফ্রন (Nephron)।'
  },
  {
    question: 'নিউক্লিয়াসবিহীন সজীব উদ্ভিদকোষ কোনটি?',
    options: ['সঙ্গীকোষ', 'সীভনল (Sieve tube)', 'জাইলেম ভেসেল', 'প্যারেনকাইমা'],
    correctIdx: 1,
    explanation: 'পরিণত সীভনলে কোনো নিউক্লিয়াস থাকে না, তবে সাইটোপ্লাজম ও অন্যান্য অঙ্গাণু থাকে।'
  },
  {
    question: 'প্লাস্টিডের আলোক নিরপেক্ষ পর্যায় কোথায় ঘটে?',
    options: ['গ্রানাম', 'থাইলাকয়েড', 'স্ট্রোমা', 'লুমেন'],
    correctIdx: 2,
    explanation: 'ক্লোরোপ্লাস্টের তরল ধাত্র বা স্ট্রোমায় কেলভিন চক্র তথা অন্ধকার পর্যায় সংঘটিত হয়।'
  },
  {
    question: 'হৃৎপেশি (Cardiac muscle) কোন ধরনের বৈশিষ্ট্য বহন করে?',
    options: ['গঠনে রৈখিক কিন্তু কাজে অনৈচ্ছিক', 'গঠন ও কাজ উভয়ই ঐচ্ছিক', 'সম্পূর্ণ মসৃণ ও ঐচ্ছিক', 'কোনোটিই নয়'],
    correctIdx: 0,
    explanation: 'হৃৎপেশি গঠনে চিহ্নিত বা রৈখিক (ঐচ্ছিক পেশির মতো) কিন্তু এর সংকোচন-প্রসারণ প্রাণীর ইচ্ছাধীন নয় (অনৈচ্ছিক)।'
  },
  {
    question: 'উদ্ভিদের কাণ্ডের ত্বক ও প্রাথমিক সুরক্ষায় কোন টিস্যু ভূমিকা রাখে?',
    options: ['প্যারেনকাইমা', 'কোলেনকাইমা', 'স্ক্লেরেনকাইমা', 'এপিডার্মিস বা ত্বকীয় কলা'],
    correctIdx: 3,
    explanation: 'এপিডার্মিস বা ত্বক উদ্ভিদদেহকে বাহ্যিক আঘাত ও রোগজীবাণু থেকে রক্ষা করে।'
  },
  {
    question: 'কোষ বিভাজনের সময় স্পিন্ডল তন্তু সৃষ্টিতে কোন অঙ্গাণু সাহায্য করে?',
    options: ['গলগি বডি', 'সেন্ট্রিওল', 'লাইসোসোম', 'প্লাস্টিড'],
    correctIdx: 1,
    explanation: 'প্রাণীকোষের সেন্ট্রোসোমে অবস্থিত সেন্ট্রিওল কোষ বিভাজনে স্পিন্ডল যন্ত্র ও অ্যাস্টার রে গঠনে অংশ নেয়।'
  },
  {
    question: 'মানবদেহে রোগ প্রতিরোধে অ্যান্টিবডি তৈরি করে কোন রক্তকণিকা?',
    options: ['লোহিত রক্তকণিকা', 'অণুচক্রিকা', 'শ্বেত রক্তকণিকা (লিম্ফোসাইট)', 'প্লাজমা প্রোটিন অ্যালবুমিন'],
    correctIdx: 2,
    explanation: 'শ্বেত রক্তকণিকার লিম্ফোসাইট অ্যান্টিবডি তৈরি করে জীবাণু ধ্বংস করে।'
  },
  {
    question: 'অণুচক্রিকার (Platelet) প্রধান কাজ কী?',
    options: ['অক্সিজেন পরিবহন', 'রক্ত জমাট বাঁধতে সাহায্য করা', 'জীবাণু ভক্ষণ', 'হরমোন পরিবহন'],
    correctIdx: 1,
    explanation: 'অণুচক্রিকা রক্তনালী ক্ষতিগ্রস্ত হলে থ্রম্বোপ্লাস্টিন নিঃসরণের মাধ্যমে রক্ত তঞ্চন বা জমাট বাঁধায়।'
  },
  {
    question: 'উদ্ভিদকোষের সাইটোপ্লাজমকে ঘিরে যে অর্ধভেদ্য পর্দা থাকে তাকে কী বলে?',
    options: ['কোষ প্রাচীর', 'প্লাজমা মেমব্রেন বা প্লাজমালেমা', 'টোনোপ্লাস্ট', 'পেলিকল'],
    correctIdx: 1,
    explanation: 'প্রোটিন ও লিপিড নির্মিত অর্ধভেদ্য বা বৈষম্যভেদ্য পর্দাকে প্লাজমালেমা বা কোষঝিল্লি বলে।'
  },
  {
    question: 'কোষের ট্রাফিক পুলিশ কাকে বলা হয়?',
    options: ['রাইবোসোম', 'গলগি বস্তু', 'লাইসোসোম', 'এন্ডোপ্লাজমিক রেটিকুলাম'],
    correctIdx: 1,
    explanation: 'গলগি বস্তু বিভিন্ন উৎসেচক ও হরমোন ক্ষরণ এবং কোষের অভ্যন্তরীণ পরিবহন নিয়ন্ত্রণ করায় একে ট্রাফিক পুলিশ বলা হয়।'
  }
];

// Generate sets
const sscP4Questions = generateChapterQuestions('ssc_p_c4', 'কাজ, ক্ষমতা ও শক্তি', 'ssc_physics', 'SSC পদার্থবিজ্ঞান', 'পদার্থবিজ্ঞান', physicsWorkPowerEnergy);
const sscC4Questions = generateChapterQuestions('ssc_c_c4', 'পর্যায় সারণি', 'ssc_chemistry', 'SSC রসায়ন', 'রসায়ন', chemistryPeriodicTable);
const sscM3Questions = generateChapterQuestions('ssc_m_c3', 'বীজগাণিতিক রাশি', 'ssc_math', 'SSC সাধারণ গণিত', 'সাধারণ গণিত', mathAlgebraicExpressions);
const sscB2Questions = generateChapterQuestions('ssc_b_c2', 'জীব কোষ ও টিস্যু', 'ssc_biology', 'SSC জীববিজ্ঞান', 'জীববিজ্ঞান', biologyCellTissue);

const newQuestions = [...sscP4Questions, ...sscC4Questions, ...sscM3Questions, ...sscB2Questions];

// Append to public questions
const updatedQuestions = [...currentQuestions, ...newQuestions];
fs.writeFileSync(questionsFile, JSON.stringify(updatedQuestions, null, 2));

// Update metadata chapters
const newChaptersMeta = [
  { id: 'ssc_p_c4', subjectId: 'ssc_physics', name: 'কাজ, ক্ষমতা ও শক্তি', questionCount: 20 },
  { id: 'ssc_c_c4', subjectId: 'ssc_chemistry', name: 'পর্যায় সারণি', questionCount: 20 },
  { id: 'ssc_m_c3', subjectId: 'ssc_math', name: 'বীজগাণিতিক রাশি', questionCount: 20 },
  { id: 'ssc_b_c2', subjectId: 'ssc_biology', name: 'জীব কোষ ও টিস্যু', questionCount: 20 }
];

for (const ch of newChaptersMeta) {
  if (!currentMeta.chapters.some(existing => existing.id === ch.id)) {
    currentMeta.chapters.push(ch);
  }
}

fs.writeFileSync(metaFile, JSON.stringify(currentMeta, null, 2));

console.log(`Added ${newQuestions.length} questions! Total questions now: ${updatedQuestions.length}`);
console.log(`Total chapters now: ${currentMeta.chapters.length}`);
