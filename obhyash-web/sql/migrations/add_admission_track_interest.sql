-- Migration: add admission_track_interest to users table
-- Purpose: Track students who pre-register for the upcoming admission (MBBS/BUET) track.
--          Paywall is not live yet — this is used to show an "Early Bird" badge
--          and to prioritise these users when the admission content launches (~July 2026).

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS admission_track_interest BOOLEAN NOT NULL DEFAULT false;

-- Index for efficient filtering in admin dashboard
CREATE INDEX IF NOT EXISTS idx_users_admission_track_interest
  ON users (admission_track_interest)
  WHERE admission_track_interest = true;
