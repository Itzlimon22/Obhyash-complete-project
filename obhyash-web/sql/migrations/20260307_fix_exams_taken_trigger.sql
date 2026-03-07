-- ============================================================
-- FIX: exams_taken / examsTaken trigger fires on every INSERT
--      including the lightweight 'started' session row that
--      initiateExamSession() writes at exam-start time.
--
-- Problem:  trigger_increment_exams_taken runs AFTER INSERT with
--           no condition, so starting an exam (submission_type =
--           'started') and then submitting it (UPDATE to 'digital'
--           or 'script') both count — doubling the tally.
--
--           Additionally, if two people submit simultaneously the
--           Postgres UPDATE in the trigger uses a per-row lock on
--           the users row, so it is already serialised correctly
--           and will NOT produce a wrong count — but only if the
--           trigger condition below is applied first.
--
-- Fix:      Guard both trigger functions so they only fire when
--           submission_type IS NOT 'started'  (i.e. the final
--           evaluated/pending insert or fallback insert).
-- ============================================================

-- ── 1. Fix trigger function used by recreate_exam_results_table.sql ──────────
CREATE OR REPLACE FUNCTION public.increment_exams_taken()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count rows that represent a completed exam, not the
  -- lightweight 'started' placeholder written at session init.
  IF NEW.submission_type IS DISTINCT FROM 'started' THEN
    UPDATE public.users
    SET exams_taken = exams_taken + 1,
        last_active = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Fix trigger function used by leaderboard_database_setup.sql ───────────
CREATE OR REPLACE FUNCTION public.increment_user_exams_taken()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.submission_type IS DISTINCT FROM 'started' THEN
    UPDATE public.users
    SET "examsTaken" = COALESCE("examsTaken", 0) + 1
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
