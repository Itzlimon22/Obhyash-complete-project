'use server';

import { unstable_cache } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { getAllPosts, BlogPost } from './blog-data';

export async function trackUserView(slug: string) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return; // Only track logged-in users

    // Dedup: skip if the same user already viewed this post in the last 24 h
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from('blog_views')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('post_slug', slug)
      .gte('viewed_at', since);

    if (count && count > 0) return; // already recorded within 24 h

    await supabase.from('blog_views').insert({
      user_id: user.id,
      post_slug: slug,
    });
  } catch (error) {
    console.error('Error tracking blog view:', error);
  }
}

async function _getAdvancedRecommendationsImpl(
  currentSlug: string | null,
  userId: string | null,
): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  const userTags: Record<string, number> = {};
  const userCategories: Record<string, number> = {};

  // 1. Build User Taste Profile
  if (userId) {
    try {
      const supabase = await createClient();
      const { data: views } = await supabase
        .from('blog_views')
        .select('post_slug')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(20);

      if (views && views.length > 0) {
        views.forEach((view) => {
          const post = allPosts.find((p) => p.slug === view.post_slug);
          if (post) {
            userCategories[post.category] =
              (userCategories[post.category] || 0) + 1;
            post.tags.forEach((tag) => {
              userTags[tag] = (userTags[tag] || 0) + 1;
            });
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user taste profile:', error);
    }
  }

  const currentPost = currentSlug
    ? allPosts.find((p) => p.slug === currentSlug)
    : null;
  const currentCategory = currentPost?.category;
  const currentTags = currentPost?.tags || [];

  // 2. Score Posts
  const scoredPosts = allPosts
    .filter((post) => post.slug !== currentSlug) // Exclude current post
    .map((post) => {
      let score = 0;

      // Contextual Score
      if (currentPost) {
        if (post.category === currentCategory) score += 10;
        const matchingTags = post.tags.filter((tag) =>
          currentTags.includes(tag),
        );
        score += matchingTags.length * 5;
      }

      // Personalization Score
      if (userId) {
        if (userCategories[post.category]) {
          score += userCategories[post.category] * 4;
        }
        post.tags.forEach((tag) => {
          if (userTags[tag]) {
            score += userTags[tag] * 2;
          }
        });
      }

      // Feature Bonus
      if (post.featured) score += 2;

      return { post, score };
    });

  // 3. Sort & Select Top 3
  scoredPosts.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return (
      new Date(b.post.publishedAt).getTime() -
      new Date(a.post.publishedAt).getTime()
    );
  });

  return scoredPosts.slice(0, 3).map((s) => s.post);
}

/**
 * Public wrapper — results are cached per (currentSlug, userId) for 5 minutes.
 */
export async function getAdvancedRecommendations(
  currentSlug: string | null = null,
  userId: string | null = null,
): Promise<BlogPost[]> {
  return unstable_cache(
    () => _getAdvancedRecommendationsImpl(currentSlug, userId),
    ['blog-recs', currentSlug ?? 'none', userId ?? 'guest'],
    { revalidate: 300 },
  )();
}

export async function getMostViewedPosts(): Promise<BlogPost[]> {
  const allPosts = await getAllPosts();
  try {
    const supabase = await createClient();

    // Fetch recent 100 views to find trending posts
    const { data: views } = await supabase
      .from('blog_views')
      .select('post_slug')
      .order('viewed_at', { ascending: false })
      .limit(100);

    if (views && views.length > 0) {
      const counts: Record<string, number> = {};
      views.forEach((v) => {
        counts[v.post_slug] = (counts[v.post_slug] || 0) + 1;
      });

      const sortedSlugs = Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .map((e) => e[0])
        .slice(0, 3);

      const topPosts = sortedSlugs
        .map((slug) => allPosts.find((p) => p.slug === slug))
        .filter(Boolean) as BlogPost[];

      // Fill the rest with recent posts if less than 3
      const result = [...topPosts];
      for (const post of allPosts) {
        if (result.length >= 3) break;
        if (!result.find((p) => p.slug === post.slug)) {
          result.push(post);
        }
      }
      return result;
    }
  } catch (error) {
    console.error('Error fetching most viewed posts:', error);
  }

  // Fallback: return featured + latest
  return allPosts.slice(0, 3);
}

export async function getBlogPostCounts(
  slugs: string[],
): Promise<Record<string, { likes: number; views: number }>> {
  if (!slugs.length) return {};

  const result: Record<string, { likes: number; views: number }> = {};
  slugs.forEach((s) => (result[s] = { likes: 0, views: 0 }));

  try {
    const supabase = await createClient();

    // RPC aggregates server-side — no row scans sent over the wire
    const { data, error } = await supabase.rpc('get_blog_post_counts', {
      slug_list: slugs,
    });

    if (error) throw error;

    (data ?? []).forEach(
      (row: { post_slug: string; like_count: number; view_count: number }) => {
        if (result[row.post_slug]) {
          result[row.post_slug].likes = row.like_count;
          result[row.post_slug].views = row.view_count;
        }
      },
    );
  } catch (error) {
    console.error('Error fetching blog post counts:', error);
  }

  return result;
}
