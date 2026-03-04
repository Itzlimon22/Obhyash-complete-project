-- Migration: RPCs for aggregate counts (avoids full row scans)
-- Run in Supabase SQL Editor

-- 1. Blog post like + view counts via aggregation, never row-scans
CREATE OR REPLACE FUNCTION get_blog_post_counts(slug_list text[])
RETURNS TABLE(post_slug text, like_count bigint, view_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    s AS post_slug,
    (SELECT COUNT(*) FROM blog_likes  WHERE blog_likes.post_slug  = s)::bigint AS like_count,
    (SELECT COUNT(*) FROM blog_views  WHERE blog_views.post_slug  = s)::bigint AS view_count
  FROM unnest(slug_list) AS s;
$$;

GRANT EXECUTE ON FUNCTION get_blog_post_counts(text[]) TO anon, authenticated;

-- 2. Reaction emoji counts for a single post
CREATE OR REPLACE FUNCTION get_reaction_counts(p_slug text)
RETURNS TABLE(emoji text, reaction_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT emoji, COUNT(*)::bigint AS reaction_count
  FROM   blog_reactions
  WHERE  post_slug = p_slug
  GROUP  BY emoji;
$$;

GRANT EXECUTE ON FUNCTION get_reaction_counts(text) TO anon, authenticated;
