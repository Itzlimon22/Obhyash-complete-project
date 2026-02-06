-- ==========================================
-- MIGRATION: ANALYTICS OPTIMIZATION
-- DESCRIPTION: Adds chapters column and optimized RPCs for analytics
-- ==========================================

-- 1. Schema Update: Add 'chapters' column to exam_results if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'exam_results' AND column_name = 'chapters') THEN
        ALTER TABLE public.exam_results ADD COLUMN chapters TEXT;
    END IF;
END $$;

-- 2. RPC: Get Overall Analytics (Dashboard)
-- Aggregates data on the server side to avoid fetching all rows
CREATE OR REPLACE FUNCTION public.get_overall_analytics(
  p_user_id UUID,
  p_time_filter TEXT -- 'all', 'month', 'week'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
BEGIN
  -- Determine start date based on filter
  IF p_time_filter = 'week' THEN
    v_start_date := now() - INTERVAL '7 days';
  ELSIF p_time_filter = 'month' THEN
    v_start_date := date_trunc('month', now());
  ELSE
    v_start_date := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
  END IF;

  WITH filtered_exams AS (
    SELECT 
      score,
      total_marks,
      total_questions,
      correct_count,
      wrong_count,
      time_taken,
      date,
      subject
    FROM public.exam_results
    WHERE user_id = p_user_id
      AND status = 'evaluated'
      AND date >= v_start_date
  ),
  aggregates AS (
    SELECT
      COUNT(*) as total_exams,
      COALESCE(SUM(total_questions), 0) as total_qs,
      COALESCE(SUM(correct_count), 0) as total_correct,
      COALESCE(SUM(time_taken), 0) as total_time,
      CASE 
        WHEN COUNT(*) > 0 THEN 
          SUM(CASE WHEN total_marks > 0 THEN (score / total_marks) * 100 ELSE 0 END) / COUNT(*)
        ELSE 0 
      END as avg_score_pct
    FROM filtered_exams
  ),
  timeline AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', to_char(date, 'DD Mon'),
        'score', CASE WHEN total_marks > 0 THEN ROUND(((score / total_marks) * 100)::numeric) ELSE 0 END,
        'fullDate', to_char(date, 'DD MMMM YYYY')
      ) ORDER BY date ASC
    ) as data
    FROM filtered_exams
  ),
  subjects AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', subject,
        'correct', SUM(correct_count),
        'wrong', SUM(wrong_count),
        'total', SUM(total_questions),
        'skipped', SUM(GREATEST(0, total_questions - (correct_count + wrong_count)))
      ) ORDER BY SUM(total_questions) DESC
    ) as data
    FROM filtered_exams
    GROUP BY subject
  )
  SELECT jsonb_build_object(
    'totalExams', (SELECT total_exams FROM aggregates),
    'avgScore', (SELECT ROUND(avg_score_pct) FROM aggregates),
    'avgAccuracy', CASE 
        WHEN (SELECT total_qs FROM aggregates) > 0 THEN 
          ROUND(((SELECT total_correct FROM aggregates)::numeric / (SELECT total_qs FROM aggregates)) * 100)
        ELSE 0 
      END,
    'totalTime', (SELECT total_time FROM aggregates),
    'timelineData', COALESCE((SELECT data FROM timeline), '[]'::jsonb),
    'subjectData', COALESCE((SELECT data FROM subjects), '[]'::jsonb)
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3. RPC: Get Subject Analysis (Detailed)
CREATE OR REPLACE FUNCTION public.get_subject_analytics(
  p_user_id UUID,
  p_subject TEXT,
  p_time_filter TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date TIMESTAMP WITH TIME ZONE;
  v_result JSONB;
BEGIN
  IF p_time_filter = 'week' THEN
    v_start_date := now() - INTERVAL '7 days';
  ELSIF p_time_filter = 'month' THEN
    v_start_date := date_trunc('month', now());
  ELSE
    v_start_date := '1970-01-01'::TIMESTAMP WITH TIME ZONE;
  END IF;

  WITH filtered_exams AS (
    SELECT 
      id,
      score,
      total_questions,
      correct_count,
      wrong_count,
      time_taken,
      date,
      subject,
      questions,
      user_answers,
      chapters -- Text column 'Chapter1, Chapter2'
    FROM public.exam_results
    WHERE user_id = p_user_id
      AND status = 'evaluated'
      AND date >= v_start_date
      AND (
        LOWER(subject) LIKE '%' || LOWER(p_subject) || '%' OR
        (LOWER(p_subject) = 'physics' AND subject ~* 'পদার্থবিজ্ঞান') OR
        (LOWER(p_subject) = 'chemistry' AND subject ~* 'রসায়ন') OR
        (LOWER(p_subject) = 'math' AND (subject ~* 'গণিত' OR subject ~* 'math')) OR
        (LOWER(p_subject) = 'biology' AND (subject ~* 'জীববিজ্ঞান' OR subject ~* 'bio'))
      )
  ),
  base_stats AS (
     SELECT
       COALESCE(SUM(total_questions), 0) as total_qs,
       COALESCE(SUM(correct_count), 0) as total_correct,
       COALESCE(SUM(wrong_count), 0) as total_wrong,
       COALESCE(SUM(time_taken), 0) as total_time_sum,
       COALESCE(SUM(GREATEST(0, total_questions - (correct_count + wrong_count))), 0) as total_skipped
     FROM filtered_exams
  ),
  -- Split comma-separated chapters and aggregate
  chapter_stats AS (
    SELECT 
      TRIM(c) as chap_name,
      SUM(total_questions::numeric / GREATEST(1, array_length(string_to_array(chapters, ','), 1))) as weighted_total,
      SUM(correct_count::numeric / GREATEST(1, array_length(string_to_array(chapters, ','), 1))) as weighted_correct
    FROM filtered_exams,
    unnest(string_to_array(COALESCE(chapters, 'General'), ',')) c
    GROUP BY TRIM(c)
  ),
  chapter_json AS (
    SELECT jsonb_agg(
      jsonb_build_object(
        'name', chap_name,
        'total', ROUND(weighted_total),
        'correct', ROUND(weighted_correct),
        'accuracy', CASE WHEN weighted_total > 0 THEN ROUND((weighted_correct / weighted_total) * 100) ELSE 0 END
      ) ORDER BY weighted_total DESC
    ) as data
    FROM chapter_stats
  )
  -- Note: Mistakes list is complex to aggregate perfectly in SQL due to JSONB structure variation.
  -- Returning empty mistakes array for now to keep SQL simple; client can fetch specific exam details if needed
  -- or we implement complex JSONB parsing here. For performance, avoiding heavy JSON parsing of every question.
  SELECT jsonb_build_object(
    'totalQuestions', (SELECT total_qs FROM base_stats),
    'correct', (SELECT total_correct FROM base_stats),
    'wrong', (SELECT total_wrong FROM base_stats),
    'skipped', (SELECT total_skipped FROM base_stats),
    'accuracy', CASE 
        WHEN (SELECT total_qs FROM base_stats) > 0 THEN 
          ROUND(((SELECT total_correct FROM base_stats)::numeric / (SELECT total_qs FROM base_stats)) * 100) 
        ELSE 0 
      END,
    'averageTime', CASE 
        WHEN (SELECT total_qs FROM base_stats) > 0 THEN 
          ROUND((SELECT total_time_sum FROM base_stats)::numeric / (SELECT total_qs FROM base_stats)) 
        ELSE 0 
      END,
    'chapterPerformance', COALESCE((SELECT data FROM chapter_json), '[]'::jsonb),
    'mistakes', '[]'::jsonb -- Placeholder, heavy detailed log skipped for optimization
  ) INTO v_result;

  RETURN v_result;
END;
$$;
