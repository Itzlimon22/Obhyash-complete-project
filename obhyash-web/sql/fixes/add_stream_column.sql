-- Add stream column to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stream text DEFAULT 'HSC';

-- Update the comment/description
COMMENT ON COLUMN public.users.stream IS 'Academic Stream (e.g., HSC, Admission, Job Prep)';

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'stream';
