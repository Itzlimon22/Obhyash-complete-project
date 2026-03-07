-- ==========================================
-- Smart Question System: Stats Update RPC
-- ==========================================

CREATE OR REPLACE FUNCTION update_user_question_stats(
  p_user_id UUID,
  p_question_id UUID,
  p_is_correct BOOLEAN
) RETURNS void AS $$
BEGIN
  INSERT INTO user_question_analytics (
    user_id, 
    question_id, 
    times_attempted, 
    times_correct, 
    last_attempted_at
  )
  VALUES (
    p_user_id, 
    p_question_id, 
    1, 
    CASE WHEN p_is_correct THEN 1 ELSE 0 END, 
    NOW()
  )
  ON CONFLICT (user_id, question_id) 
  DO UPDATE SET
    times_attempted = user_question_analytics.times_attempted + 1,
    times_correct = user_question_analytics.times_correct + (CASE WHEN p_is_correct THEN 1 ELSE 0 END),
    last_attempted_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Bulk variant: update analytics for all questions in one exam in a single RPC call.
-- Called after exam submission instead of N individual calls.
-- p_question_ids and p_are_correct must be the same length.
-- ==========================================

CREATE OR REPLACE FUNCTION bulk_update_user_question_stats(
  p_user_id   UUID,
  p_question_ids UUID[],
  p_are_correct  BOOLEAN[]
) RETURNS void AS $$
DECLARE
  i INT;
BEGIN
  FOR i IN 1..array_length(p_question_ids, 1) LOOP
    INSERT INTO user_question_analytics (
      user_id,
      question_id,
      times_attempted,
      times_correct,
      last_attempted_at
    )
    VALUES (
      p_user_id,
      p_question_ids[i],
      1,
      CASE WHEN p_are_correct[i] THEN 1 ELSE 0 END,
      NOW()
    )
    ON CONFLICT (user_id, question_id)
    DO UPDATE SET
      times_attempted = user_question_analytics.times_attempted + 1,
      times_correct   = user_question_analytics.times_correct + (CASE WHEN p_are_correct[i] THEN 1 ELSE 0 END),
      last_attempted_at = NOW();
  END LOOP;
END;
$$ LANGUAGE plpgsql;
