-- =====================================================
-- FIX: RLS Policies for Questions Table
-- =====================================================
-- This script manually adds the missing RLS policies that might
-- have been skipped during the schema update.
-- =====================================================

-- Step 1: Ensure RLS is enabled
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Step 2: Drop potentially conflicting or duplicate policies
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON questions;
DROP POLICY IF EXISTS "Allow full access for admins" ON questions;
DROP POLICY IF EXISTS "Enable read access for all users" ON questions;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON questions;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON questions;
DROP POLICY IF EXISTS "questions_select_policy" ON questions;
DROP POLICY IF EXISTS "questions_insert_policy" ON questions;
DROP POLICY IF EXISTS "questions_update_policy" ON questions;
DROP POLICY IF EXISTS "questions_delete_policy" ON questions;

-- Step 3: Create permissive policies for authenticated users
-- (Since we don't have a strict Role system yet, we allow all logged-in users to manage questions)

-- Policy: Allow authenticated users to READ all questions
CREATE POLICY "questions_select_policy"
ON questions FOR SELECT
TO authenticated
USING (true);

-- Policy: Allow authenticated users to INSERT questions
CREATE POLICY "questions_insert_policy"
ON questions FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Allow authenticated users to UPDATE questions
CREATE POLICY "questions_update_policy"
ON questions FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy: Allow authenticated users to DELETE questions
CREATE POLICY "questions_delete_policy"
ON questions FOR DELETE
TO authenticated
USING (true);

-- =====================================================
-- Fix Complete!
-- =====================================================
