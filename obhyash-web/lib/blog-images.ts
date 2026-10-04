/**
 * Helper to dynamically resolve high-resolution cover images for blog posts
 * based on category, tags, and title keywords when an explicit coverImage isn't provided.
 */

export function getPostCover(post: {
  coverImage?: string;
  category?: string;
  tags?: string[];
  title?: string;
}): string {
  if (post.coverImage && post.coverImage.trim() !== '') {
    return post.coverImage;
  }

  const text = `${post.category || ''} ${post.title || ''} ${(post.tags || []).join(' ')}`.toLowerCase();

  // Physics
  if (text.includes('physics') || text.includes('পদার্থবিজ্ঞান') || text.includes('পদার্থ')) {
    return '/images/blog-covers/physics.svg';
  }

  // Chemistry
  if (text.includes('chemistry') || text.includes('রসায়ন') || text.includes('রসায়ন')) {
    return '/images/blog-covers/chemistry.svg';
  }

  // Higher Math / General Math
  if (text.includes('math') || text.includes('গণিত') || text.includes('উচ্চতর গণিত') || text.includes('ক্যালকুলাস')) {
    return '/images/blog-covers/math.svg';
  }

  // Biology
  if (text.includes('biology') || text.includes('জীববিজ্ঞান') || text.includes('উদ্ভিদ') || text.includes('প্রাণী')) {
    return '/images/blog-covers/biology.svg';
  }

  // ICT
  if (text.includes('ict') || text.includes('তথ্য ও যোগাযোগ') || text.includes('আইসিটি') || text.includes('প্রোগ্রামিং')) {
    return '/images/blog-covers/ict.svg';
  }

  // Result / Notice / Routine / Scholarship / Board Updates
  if (
    text.includes('রেজাল্ট') ||
    text.includes('result') ||
    text.includes('রুটিন') ||
    text.includes('routine') ||
    text.includes('নোটিশ') ||
    text.includes('notice') ||
    text.includes('বৃত্তি') ||
    text.includes('scholarship') ||
    text.includes('সিলেবাস') ||
    text.includes('syllabus') ||
    text.includes('মানবণ্টন')
  ) {
    return '/images/blog-covers/routine.svg';
  }

  // Bangla (use regex word boundary to prevent matching "bangladesh")
  if (
    text.includes('বাংলা') ||
    text.includes('সাহিত্য') ||
    text.includes('লালসালু') ||
    text.includes('সিরাজউদ্দৌলা') ||
    /\bbangla\b/.test(text)
  ) {
    return '/images/blog-covers/bangla.svg';
  }

  // English
  if (text.includes('english') || text.includes('ইংরেজি') || text.includes('গ্রামার') || text.includes('grammar') || text.includes('modifier')) {
    return '/images/blog-covers/english.svg';
  }

  // Engineering / BUET / CK-RUET / MIST
  if (text.includes('বুয়েট') || text.includes('buet') || text.includes('engineering') || text.includes('ইঞ্জিনিয়ারিং') || text.includes('ckruet') || text.includes('mist')) {
    return '/images/blog-covers/engineering.svg';
  }

  // Medical Admission
  if (text.includes('মেডিকেল') || text.includes('medical') || text.includes('dghs') || text.includes('mat') || text.includes('mbbs') || text.includes('ডেন্টাল')) {
    return '/images/blog-covers/medical.svg';
  }

  // University Admission / General Varsity
  if (text.includes('ভর্তি') || text.includes('admission') || text.includes('বিশ্ববিদ্যালয়') || text.includes('বিশ্ববিদ্যালয়') || text.includes('ঢাবি') || text.includes('du ') || text.includes('গুচ্ছ') || text.includes('gst')) {
    return '/images/blog-covers/admission.svg';
  }

  // Books / Syllabus / Routines / Revision
  if (text.includes('সিলেবাস') || text.includes('syllabus') || text.includes('রুটিন') || text.includes('routine') || text.includes('রিভিশন') || text.includes('মানবণ্টন')) {
    return '/images/blog-covers/routine.svg';
  }

  // Default Academic / Study Tips
  return '/images/blog-covers/academic.svg';
}
