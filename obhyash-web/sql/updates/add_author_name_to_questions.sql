-- Add author_name to questions table
ALTER TABLE questions ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);

-- Copy existing author data to author_name as a fallback
-- If author currently contains a name, it will be preserved in author_name.
-- If it contains an email, that email will also show up as the name for now.
UPDATE questions SET author_name = author WHERE author_name IS NULL;

-- Add index for potential search by author name
CREATE INDEX IF NOT EXISTS idx_questions_author_name ON questions(author_name);
