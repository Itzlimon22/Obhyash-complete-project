import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';

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

let cachedPosts: BlogPost[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 3600 * 1000; // 1 hour cache in memory to avoid Rate Limits

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!process.env.NOTION_API_KEY || !process.env.NOTION_DATABASE_ID) {
    console.warn(
      'NOTION_API_KEY or NOTION_DATABASE_ID not set. Returning empty blog posts.',
    );
    return [];
  }

  // Basic in-memory caching
  const now = Date.now();
  if (cachedPosts && now - lastFetchTime < CACHE_TTL) {
    return cachedPosts;
  }

  try {
    const response = await (notion.databases as any).query({
      database_id: process.env.NOTION_DATABASE_ID,
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

    cachedPosts = posts;
    lastFetchTime = now;
    return posts;
  } catch (error) {
    console.error('Error fetching Notion blog posts:', error);
    return [];
  }
}

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
