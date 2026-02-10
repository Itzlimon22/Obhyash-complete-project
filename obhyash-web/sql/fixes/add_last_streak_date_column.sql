-- Fix: Add missing 'last_streak_date' column to 'users' table
-- Error: "Could not find the 'last_streak_date' column of 'users' in the schema cache"

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_streak_date TIMESTAMPTZ DEFAULT NULL;

-- Add a comment for documentation
COMMENT ON COLUMN public.users.last_streak_date IS 'Tracks the last date the user logged in for streak calculation';
