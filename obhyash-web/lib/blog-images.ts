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
    return text.includes('২য়') || text.includes('2nd') || text.includes('২য়')
      ? '/images/subjects/physics_2.jpg'
      : '/images/subjects/physics_1.jpg';
  }

  // Chemistry
  if (text.includes('chemistry') || text.includes('রসায়ন') || text.includes('রসায়ন')) {
    return text.includes('২য়') || text.includes('2nd') || text.includes('২য়')
      ? '/images/subjects/chemistry_2.jpg'
      : '/images/subjects/chemistry_1.jpg';
  }

  // Higher Math / General Math
  if (text.includes('math') || text.includes('গণিত') || text.includes('উচ্চতর গণিত')) {
    return text.includes('২য়') || text.includes('2nd') || text.includes('২য়')
      ? '/images/subjects/math_2.jpg'
      : '/images/subjects/math_1.jpg';
  }

  // Biology
  if (text.includes('biology') || text.includes('জীববিজ্ঞান') || text.includes('উদ্ভিদ') || text.includes('প্রাণী')) {
    return text.includes('২য়') || text.includes('2nd') || text.includes('২য়')
      ? '/images/subjects/biology_2.jpg'
      : '/images/subjects/biology_1.jpg';
  }

  // ICT
  if (text.includes('ict') || text.includes('তথ্য ও যোগাযোগ') || text.includes('আইসিটি') || text.includes('প্রোগ্রামিং')) {
    return '/images/subjects/ict.jpg';
  }

  // Bangla
  if (text.includes('bangla') || text.includes('বাংলা') || text.includes('সাহিত্য') || text.includes('লালসালু') || text.includes('সিরাজউদ্দৌলা')) {
    return text.includes('২য়') || text.includes('2nd') || text.includes('২য়')
      ? '/images/subjects/bangla_2.jpg'
      : '/images/subjects/bangla_1.jpg';
  }

  // English
  if (text.includes('english') || text.includes('ইংরেজি') || text.includes('গ্রামার') || text.includes('grammar')) {
    return text.includes('২য়') || text.includes('2nd') || text.includes('২য়')
      ? '/images/subjects/english_2.jpg'
      : '/images/subjects/english_1.jpg';
  }

  // Medical Admission
  if (text.includes('মেডিকেল') || text.includes('medical') || text.includes('dghs') || text.includes('mat')) {
    return '/images/subjects/category_medical.jpg';
  }

  // Engineering / BUET / CK-RUET
  if (text.includes('বুয়েট') || text.includes('buet') || text.includes('engineering') || text.includes('ইঞ্জিনিয়ারিং') || text.includes('ckruet') || text.includes('mist')) {
    return '/images/subjects/category_engineering.jpg';
  }

  // University Admission / General Varsity
  if (text.includes('ভর্তি') || text.includes('admission') || text.includes('বিশ্ববিদ্যালয়') || text.includes('বিশ্ববিদ্যালয়') || text.includes('ঢাবি') || text.includes('du ') || text.includes('গুচ্ছ') || text.includes('gst')) {
    return '/images/subjects/category_varsity_ka.jpg';
  }

  // Books / Syllabus / Routines
  if (text.includes('বই') || text.includes('book') || text.includes('সিলেবাস') || text.includes('syllabus') || text.includes('রুটিন') || text.includes('routine')) {
    return '/images/subjects/category_textbook.jpg';
  }

  // Default Academic / Study Tips
  return '/images/subjects/category_academic.jpg';
}
