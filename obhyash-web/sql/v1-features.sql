-- V1 Features Migration
-- Run this in Supabase SQL Editor

-- 1. Add exam_target column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS exam_target TEXT;

-- 2. Add daily_exams_goal column (customizable goal, default 3 sessions/day)
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_exams_goal INTEGER DEFAULT 3;

-- 3. Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_users_exam_target ON users(exam_target);
