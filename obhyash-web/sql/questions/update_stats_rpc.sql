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
