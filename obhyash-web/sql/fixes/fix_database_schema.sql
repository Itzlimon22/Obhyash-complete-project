-- RUN THIS IN SUPABASE SQL EDITOR TO FIX DATABASE SCHEMA
-- This script ensures all columns expected by the app exist.

-- 1. Enable RLS (Good practice, ensuring it's on)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. Add 'target' column if missing (Used in Settings)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "target" text;

-- 3. Add 'role' column if missing (Required)
--    Also ensures the check constraint exists
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "role" text DEFAULT 'Student';
DO $$ BEGIN
    ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Teacher', 'Student'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Add 'subscription' column (JSONB)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "subscription" jsonb DEFAULT '{"plan": "Free", "status": "Active"}'::jsonb;

-- 5. Add Gamification Columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "xp" bigint DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "level" text DEFAULT 'Beginner';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "examsTaken" bigint DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "enrolledExams" bigint DEFAULT 0;

-- 6. Add Visual Columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "avatarColor" text DEFAULT '#000000';

-- 7. Add Optional Profile Columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "phone" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "gender" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "institute" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "goal" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "division" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "batch" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "lastActive" timestamptz DEFAULT now();

-- 8. Add Basic Columns
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "email" text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS "name" text;
