import { NextRequest, NextResponse } from 'next/server';
import { getAllPosts } from '@/lib/blog-data';
import { getBlogPostCounts } from '@/lib/blog-recommendations';
import { rateLimitByIp } from '@/lib/utils/rate-limit';

export const dynamic = 'force-dynamic';

const MAX_Q_LENGTH = 150;

export async function GET(req: NextRequest) {
  // IP rate limit: 120 searches per minute (unauthenticated-friendly)
  const ipRl = rateLimitByIp(req, 'blog-search', 120, 60_000);
  if (ipRl.limited) return ipRl.response;

  const rawQ = req.nextUrl.searchParams.get('q') ?? '';
  const q = rawQ.trim().slice(0, MAX_Q_LENGTH).toLowerCase();
  const category =
    req.nextUrl.searchParams.get('category')?.trim().slice(0, 60) ?? '';
  const pageParam = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10);
  const PAGE_SIZE = 18;

  const allPosts = await getAllPosts();

  let results = allPosts;

  if (category && category !== 'সব') {
    results = results.filter((p) => p.category === category);
  }

  if (q) {
    results = results.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category?.toLowerCase().includes(q) ||
        p.author.name.toLowerCase().includes(q),
    );
  }

  const total = results.length;
  const page = Math.max(
    1,
    Math.min(pageParam, Math.ceil(total / PAGE_SIZE) || 1),
  );
  const paginated = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const postCounts = await getBlogPostCounts(paginated.map((p) => p.slug));

  return NextResponse.json(
    { posts: paginated, postCounts, total, page, pageSize: PAGE_SIZE },
    {
      headers: {
        'Cache-Control': 'no-store', // search results must be fresh
      },
    },
  );
}
