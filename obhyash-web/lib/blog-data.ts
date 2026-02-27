import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { unstable_cache } from 'next/cache';
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
  'এসএসসি কর্নার',
  'এইচএসসি কর্নার',
  'বিষয়ভিত্তিক পড়াশোনা',
  'বোর্ড পরীক্ষা প্রস্তুতি',
  'মডেল টেস্ট ও সমাধান',
  'স্টাডি টিপস ও রুটিন',
  'মোটিভেশন ও মানসিক স্বাস্থ্য',
  'ক্যারিয়ার ও ভর্তি গাইড',
  'রিসোর্স হাব (PDF/নোটস)',
  'নোটিশ ও শিক্ষা আপডেট',
];

// Initialize Notion Client (fails gracefully if missing env vars)
const notion = new Client({ auth: process.env.NOTION_API_KEY });
const n2m = new NotionToMarkdown({ notionClient: notion });

// Helper to extract property values from Notion
const getPropertyValue = (property: any, type: string): any => {
  if (!property) return null;
  switch (type) {
    case 'title':
      return property.title?.[0]?.plain_text || '';
    case 'rich_text':
      return property.rich_text?.[0]?.plain_text || '';
    case 'select':
      return property.select?.name || '';
    case 'multi_select':
      return property.multi_select?.map((s: any) => s.name) || [];
    case 'date':
      return property.date?.start || '';
    case 'number':
      return property.number || 0;
    case 'checkbox':
      return property.checkbox || false;
    default:
      return '';
  }
};

const fetchAllPostsFromNotion = async (): Promise<BlogPost[]> => {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    console.warn(
      'NOTION_API_KEY or NOTION_DATABASE_ID not set. Returning empty blog posts.',
    );
    return [];
  }

  try {
    const response = await (notion.databases as any).query({
      database_id: process.env.NOTION_DATABASE_ID,
      page_size: 100, // Reasonable limit to prevent massive payload timeouts
      filter: {
        property: 'Status',
        status: {
          equals: 'Published',
        },
      },
      sorts: [
        {
          property: 'PublishedAt',
          direction: 'descending',
        },
      ],
    });

    const posts: BlogPost[] = await Promise.all(
      response.results.map(async (page: any) => {
        const props = page.properties;

        const slug = getPropertyValue(props.Slug, 'rich_text') || page.id;
        const title = getPropertyValue(props.Title, 'title');
        const excerpt = getPropertyValue(props.Excerpt, 'rich_text');
        const category = getPropertyValue(props.Category, 'select');
        const tags = getPropertyValue(props.Tags, 'multi_select');
        const authorName = getPropertyValue(props.AuthorName, 'rich_text');
        const authorRole = getPropertyValue(props.AuthorRole, 'rich_text');
        const authorInitials = getPropertyValue(
          props.AuthorInitials,
          'rich_text',
        );
        const publishedAt = getPropertyValue(props.PublishedAt, 'date');
        const readTime = getPropertyValue(props.ReadTime, 'number');
        const featured = getPropertyValue(props.Featured, 'checkbox');
        const coverColor =
          getPropertyValue(props.CoverColor, 'rich_text') ||
          'from-neutral-500 to-neutral-600';

        // Fetch Markdown content blocks
        const mdblocks = await n2m.pageToMarkdown(page.id);
        const mdString = n2m.toMarkdownString(mdblocks);

        return {
          slug,
          title,
          excerpt,
          category,
          tags,
          author: {
            name: authorName || 'Obhyash Team',
            role: authorRole || 'Editor',
            initials: authorInitials || 'OT',
          },
          publishedAt: publishedAt || new Date(page.created_time).toISOString(),
          readTime: readTime || 5,
          featured,
          coverColor,
          content: mdString.parent || '',
        };
      }),
    );

    return posts;
  } catch (error) {
    console.error('Error fetching Notion blog posts:', error);
    return [];
  }
};

const getLocalPosts = async (): Promise<BlogPost[]> => {
  const contentDir = path.join(process.cwd(), 'content', 'blog');

  if (!fs.existsSync(contentDir)) {
    return [];
  }

  const files = fs
    .readdirSync(contentDir)
    .filter((file) => file.endsWith('.md'));

  const posts = files.map((file) => {
    const filePath = path.join(contentDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      slug: data.slug || file.replace(/\.md$/, ''),
      title: data.title || 'Untitled',
      excerpt: data.excerpt || '',
      category: data.category || 'Uncategorized',
      tags: data.tags || [],
      author: {
        name: data.author?.name || 'Obhyash Team',
        role: data.author?.role || 'Editor',
        initials: data.author?.initials || 'OT',
      },
      publishedAt:
        data.publishedAt || new Date(fs.statSync(filePath).mtime).toISOString(),
      readTime: data.readTime || 5,
      featured: data.featured || false,
      coverColor: data.coverColor || 'from-neutral-500 to-neutral-600',
      content: content,
    } as BlogPost;
  });

  return posts;
};

export const getAllPosts = unstable_cache(
  async () => {
    // Fetch from both robust sources concurrently
    const [notionPosts, localPosts] = await Promise.all([
      fetchAllPostsFromNotion(),
      getLocalPosts(),
    ]);

    // Combine and sort by date descending (newest first)
    const combinedPosts = [...notionPosts, ...localPosts];
    combinedPosts.sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );

    return combinedPosts;
  },
  ['obhyash-blog-posts'],
  {
    revalidate: 3600,
    tags: ['blog-posts'],
  },
);

export async function getBlogPost(slug: string): Promise<BlogPost | undefined> {
  const posts = await getAllPosts();
  return posts.find((post: BlogPost) => post.slug === slug);
}

export async function getBlogPostsByCategory(
  category: string,
): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  if (category === 'All') return posts;
  return posts.filter((post: BlogPost) => post.category === category);
}

export async function getFeaturedPost(): Promise<BlogPost | undefined> {
  const posts = await getAllPosts();
  return posts.find((post: BlogPost) => post.featured);
}

export async function getRelatedPosts(
  currentSlug: string,
  category: string,
): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts
    .filter(
      (post: BlogPost) =>
        post.slug !== currentSlug && post.category === category,
    )
    .slice(0, 3);
}
