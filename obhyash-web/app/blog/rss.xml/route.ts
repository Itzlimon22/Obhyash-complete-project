import { getAllPosts } from '@/lib/blog-data';

const SITE_URL = 'https://obhyash.com';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const posts = await getAllPosts();

  // Sort newest first
  const sorted = [...posts].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );

  const items = sorted
    .map((post) => {
      const url = `${SITE_URL}/blog/${post.slug}`;
      const pubDate = new Date(post.publishedAt).toUTCString();
      const categories = [post.category, ...post.tags]
        .map((c) => `<category>${escapeXml(c)}</category>`)
        .join('\n        ');

      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author.name)}</author>
      ${categories}
      ${post.coverImage ? `<enclosure url="${escapeXml(post.coverImage)}" type="image/jpeg" length="0" />` : ''}
    </item>`;
    })
    .join('');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>Obhyash Blog — স্মার্ট প্রস্তুতি, সেরা ফলাফল</title>
    <link>${SITE_URL}/blog</link>
    <description>বাংলাদেশের শিক্ষার্থীদের SSC, HSC এবং অন্যাও্য পরীক্ষায় সফল হতে সাহায্য করার জন্য বিশেষজ্ঞ টিপস, পরীক্ষিত কৌশল এবং দিকনির্দেশনা।</description>
    <language>bn</language>
    <copyright>Copyright ${new Date().getFullYear()} Obhyash</copyright>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <image>
      <url>${SITE_URL}/icon.png</url>
      <title>Obhyash Blog</title>
      <link>${SITE_URL}/blog</link>
    </image>${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
    },
  });
}
