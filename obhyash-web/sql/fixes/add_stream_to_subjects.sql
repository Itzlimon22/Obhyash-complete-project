-- Add stream column to subjects table
ALTER TABLE public.subjects 
ADD COLUMN IF NOT EXISTS stream text DEFAULT NULL;

-- Description
COMMENT ON COLUMN public.subjects.stream IS 'Stream for which this subject is applicable (e.g., HSC, Admission). NULL means applicable to all streams.';

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'subjects' AND column_name = 'stream';
