import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: {
    name: string;
    role: string;
    initials: string;
  };
  publishedAt: string;
  readTime: number;
  featured: boolean;
  coverColor: string; // tailwind gradient classes
}

export const BLOG_CATEGORIES = [
  'All',
  'Study Tips',
  'Exam Prep',
  'MCQ Techniques',
  'Time Management',
  'Motivation',
];

const contentDir = path.join(process.cwd(), 'content', 'blog');

export function getAllPosts(): BlogPost[] {
  if (!fs.existsSync(contentDir)) return [];
  const fileNames = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith('.md'));

  const posts = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(contentDir, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || '',
      excerpt: data.excerpt || '',
      category: data.category || '',
      tags: data.tags || [],
      author: {
        name: data.authorName || '',
        role: data.authorRole || '',
        initials: data.authorInitials || '',
      },
      publishedAt: data.publishedAt || '',
      readTime: Number(data.readTime) || 5,
      featured:
        typeof data.featured === 'string'
          ? data.featured === 'true'
          : !!data.featured,
      coverColor: data.coverColor || 'from-neutral-500 to-neutral-600',
      content,
    } as BlogPost;
  });

  return posts.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

// Pre-export all for static usage where needed
export const blogPosts: BlogPost[] = getAllPosts();

export function getBlogPost(slug: string): BlogPost | undefined {
  return blogPosts.find((post) => post.slug === slug);
}

export function getBlogPostsByCategory(category: string): BlogPost[] {
  if (category === 'All') return blogPosts;
  return blogPosts.filter((post) => post.category === category);
}

export function getFeaturedPost(): BlogPost | undefined {
  return blogPosts.find((post) => post.featured);
}

export function getRelatedPosts(
  currentSlug: string,
  category: string,
): BlogPost[] {
  return blogPosts
    .filter((post) => post.slug !== currentSlug && post.category === category)
    .slice(0, 3);
}
