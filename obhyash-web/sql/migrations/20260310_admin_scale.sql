-- =============================================================================
-- Admin Panel Scaling: Questions + Users
-- Run this on your Supabase SQL editor.
-- =============================================================================

-- 1. Enable trigram extension (required for fast ilike searches)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- 2. Questions table indexes
-- =============================================================================

-- Composite index for subject+status filter (primary admin browse pattern)
CREATE INDEX IF NOT EXISTS idx_questions_subject_status
  ON public.questions (subject, status);

-- Composite index for subject+chapter+status (panel drill-down)
CREATE INDEX IF NOT EXISTS idx_questions_subject_chapter_status
  ON public.questions (subject, chapter, status)
  WHERE status = 'Approved';

-- Index for default sort (status + created_at)
CREATE INDEX IF NOT EXISTS idx_questions_status_created
  ON public.questions (status, created_at DESC);

-- Index for created_at-only sort (all statuses, default admin view)
CREATE INDEX IF NOT EXISTS idx_questions_created_at
  ON public.questions (created_at DESC);

-- Index for difficulty filter (categorical, eq lookup)
CREATE INDEX IF NOT EXISTS idx_questions_difficulty
  ON public.questions (difficulty);

-- Trigram index on question text for fast ilike searches
CREATE INDEX IF NOT EXISTS idx_questions_question_trgm
  ON public.questions USING gin (question gin_trgm_ops);

-- Trigram index on exam_type for fast ilike searches
CREATE INDEX IF NOT EXISTS idx_questions_exam_type_trgm
  ON public.questions USING gin (exam_type gin_trgm_ops);

-- =============================================================================
-- 3. Users table indexes
-- =============================================================================

-- Index for role filter + default sort
CREATE INDEX IF NOT EXISTS idx_users_role_created
  ON public.users (role, created_at DESC);

-- Index for status filter + default sort
CREATE INDEX IF NOT EXISTS idx_users_status_created
  ON public.users (status, created_at DESC);

-- Index for default sort (no filters)
CREATE INDEX IF NOT EXISTS idx_users_created_at
  ON public.users (created_at DESC);

-- Index for exams_taken range filters
CREATE INDEX IF NOT EXISTS idx_users_exams_taken
  ON public.users (exams_taken);

-- Trigram index on name for fast ilike searches
CREATE INDEX IF NOT EXISTS idx_users_name_trgm
  ON public.users USING gin (name gin_trgm_ops);

-- Trigram index on email for fast ilike searches
CREATE INDEX IF NOT EXISTS idx_users_email_trgm
  ON public.users USING gin (email gin_trgm_ops);

-- =============================================================================
-- 4. RPC: get_question_status_counts
-- Replaces 3 concurrent COUNT queries with a single GROUP-BY pass.
-- Returns: { "approved": N, "pending": N, "rejected": N }
-- =============================================================================

CREATE OR REPLACE FUNCTION get_question_status_counts(
  p_subject   text DEFAULT NULL,
  p_chapter   text DEFAULT NULL,
  p_topic     text DEFAULT NULL,
  p_difficulty text DEFAULT NULL,
  p_author    text DEFAULT NULL,
  p_search    text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  v_approved bigint := 0;
  v_pending  bigint := 0;
  v_rejected bigint := 0;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE status = 'Approved'),
    COUNT(*) FILTER (WHERE status = 'Pending'),
    COUNT(*) FILTER (WHERE status = 'Rejected')
  INTO v_approved, v_pending, v_rejected
  FROM public.questions
  WHERE
    (p_subject   IS NULL OR subject   = p_subject)
    AND (p_chapter   IS NULL OR chapter   = p_chapter)
    AND (p_topic     IS NULL OR topic     = p_topic)
    AND (p_difficulty IS NULL OR difficulty = p_difficulty)
    AND (p_author    IS NULL OR author    = p_author)
    AND (
      p_search IS NULL
      OR question   ILIKE '%' || p_search || '%'
      OR exam_type  ILIKE '%' || p_search || '%'
      OR institute  ILIKE '%' || p_search || '%'
    );

  RETURN json_build_object(
    'approved', v_approved,
    'pending',  v_pending,
    'rejected', v_rejected
  );
END;
$$;

-- Grant exec to authenticated + anon roles (adjust to your RLS setup)
GRANT EXECUTE ON FUNCTION get_question_status_counts TO authenticated;
GRANT EXECUTE ON FUNCTION get_question_status_counts TO anon;

