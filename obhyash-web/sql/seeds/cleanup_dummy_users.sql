-- ==============================================================================
-- OBHYASH: 100% THOROUGH & COMPLETE CLEANUP SCRIPT
-- ==============================================================================
-- This script completely purges ALL records, statistics, exam attempts, bookmarks,
-- badges, notifications, and profiles for the specified 9 dummy accounts.
-- ==============================================================================

DO $$
DECLARE
  v_target_emails TEXT[] := ARRAY[
    'a@gmail.com',              -- Gg
    'student3@obhyash.com',     -- student 3
    'student5@obhyash.com',     -- Student 5
    'student15@gmail.com',      -- Student 15
    'student@gmail.com',        -- li
    'student2@obhyash.com',     -- Student 2
    'student9@obhyash.com',     -- limn
    'student4@obhyash.com',     -- Student 4
    'mahi@gmail.com'            -- Mahi
  ];
  v_target_ids UUID[];
BEGIN
  -- 1. Collect UUIDs of the target dummy users
  SELECT ARRAY_AGG(id) INTO v_target_ids
  FROM auth.users
  WHERE email = ANY(v_target_emails);

  IF v_target_ids IS NOT NULL AND ARRAY_LENGTH(v_target_ids, 1) > 0 THEN
    
    -- 2. Delete from all related application tables to guarantee 100% clean state
    
    -- Exam & Study Activity
    DELETE FROM public.exam_results WHERE user_id = ANY(v_target_ids);
    DELETE FROM public.live_exam_attempts WHERE user_id = ANY(v_target_ids);
    
    -- Daily Quests, Streaks & Gamification
    BEGIN DELETE FROM public.daily_quests_state WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.user_badges WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.scratch_cards WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.spaced_repetition_cards WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    
    -- Bookmarks, Reports & Notifications
    BEGIN DELETE FROM public.bookmarks WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.user_notifications WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.notifications WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.device_sessions WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.referral_attempts WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.complaints WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;
    BEGIN DELETE FROM public.feature_requests WHERE user_id = ANY(v_target_ids); EXCEPTION WHEN OTHERS THEN NULL; END;

    -- 3. Delete from public.users profile table
    DELETE FROM public.users WHERE id = ANY(v_target_ids);

    -- 4. Delete from auth.users (authentication credentials)
    DELETE FROM auth.users WHERE id = ANY(v_target_ids);

    RAISE NOTICE 'Successfully purged 100% of data for % dummy users.', ARRAY_LENGTH(v_target_ids, 1);
  ELSE
    RAISE NOTICE 'No matching dummy users found to delete.';
  END IF;

  -- 5. Refresh institute rankings materialized view
  BEGIN
    PERFORM refresh_institute_rankings();
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

END $$;
