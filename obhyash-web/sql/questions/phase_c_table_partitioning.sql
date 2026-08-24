-- ============================================================================
-- PHASE C: 1-Million Scale Migration (Idempotent Table Partitioning by Stream)
-- Architecture:
--   - Declarative List Partitioning by `stream_id` (SSC, HSC, Admission, BCS, Default)
--   - Fully Idempotent (Safe to run multiple times without 42P01 error)
--   - 100% Zero Data Loss
-- ============================================================================

DO $$
DECLARE
    v_is_partitioned BOOLEAN;
BEGIN
    -- Check if `questions` table is already partitioned (relkind = 'p')
    SELECT (relkind = 'p') INTO v_is_partitioned
    FROM pg_class
    WHERE relname = 'questions' AND relnamespace = 'public'::regnamespace;

    IF v_is_partitioned IS TRUE THEN
        RAISE NOTICE 'Notice: `questions` table is ALREADY partitioned! Skipping creation & swap.';
    ELSE
        RAISE NOTICE 'Starting Table Partitioning Migration...';

        -- 1. Create Partitioned Master Table
        CREATE TABLE IF NOT EXISTS public.questions_partitioned (
            id UUID DEFAULT gen_random_uuid(),
            stream_id VARCHAR(50) NOT NULL DEFAULT 'GENERAL',

            -- Core Content
            question TEXT NOT NULL,
            options TEXT[] NOT NULL,
            correct_answer_indices INTEGER[] NOT NULL DEFAULT '{0}',
            explanation TEXT,

            -- Stimulus & Composite Question Support (Phase A)
            passage TEXT,
            parent_id UUID,
            is_composite BOOLEAN DEFAULT FALSE,
            composite_index INT DEFAULT 1,

            -- Dedup & Fingerprint (Phase A)
            fingerprint VARCHAR(64),

            -- Question Type & Difficulty
            type VARCHAR(50) DEFAULT 'MCQ',
            difficulty VARCHAR(50) DEFAULT 'Medium',

            -- Taxonomy (Phase B)
            division_id VARCHAR(50),
            subject_id VARCHAR(100),
            chapter_id VARCHAR(100),
            topic_id VARCHAR(100),
            
            -- Legacy / Display Academic Info
            subject VARCHAR(255) NOT NULL,
            chapter VARCHAR(255),
            topic VARCHAR(255),
            stream VARCHAR(50),
            division VARCHAR(50),
            section VARCHAR(255),

            -- Exam Context & Board Info
            exam_type VARCHAR(100) DEFAULT 'Academic',
            institutes TEXT[] DEFAULT '{}',
            years INTEGER[] DEFAULT '{}',

            -- Metadata & Moderation
            status VARCHAR(50) DEFAULT 'Pending',
            author VARCHAR(255) DEFAULT 'Admin',
            tags TEXT[] DEFAULT '{}',
            version INTEGER DEFAULT 1,

            -- Media
            image_url TEXT,
            option_images TEXT[] DEFAULT '{}',
            explanation_image_url TEXT,

            -- Random Seed for Fast Exam Generation
            random_id DOUBLE PRECISION DEFAULT random(),

            -- Timestamps
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),

            -- Constraints & Primary Key
            PRIMARY KEY (id, stream_id),
            CONSTRAINT check_options_min_length CHECK (array_length(options, 1) >= 2),
            CONSTRAINT check_correct_answer_indices_not_empty CHECK (array_length(correct_answer_indices, 1) >= 1)
        ) PARTITION BY LIST (stream_id);

        -- 2. Create Child Partition Tables
        CREATE TABLE IF NOT EXISTS public.questions_hsc 
        PARTITION OF public.questions_partitioned 
        FOR VALUES IN ('HSC', 'hsc');

        CREATE TABLE IF NOT EXISTS public.questions_ssc 
        PARTITION OF public.questions_partitioned 
        FOR VALUES IN ('SSC', 'ssc');

        CREATE TABLE IF NOT EXISTS public.questions_admission 
        PARTITION OF public.questions_partitioned 
        FOR VALUES IN ('ADMISSION', 'admission', 'MEDICAL', 'medical', 'ENGINEERING', 'engineering', 'VARSITY', 'varsity');

        CREATE TABLE IF NOT EXISTS public.questions_bcs 
        PARTITION OF public.questions_partitioned 
        FOR VALUES IN ('BCS', 'bcs', 'GOVT_JOB', 'govt_job', 'BANK', 'bank');

        CREATE TABLE IF NOT EXISTS public.questions_general 
        PARTITION OF public.questions_partitioned DEFAULT;

        -- 3. High-Performance Indexes
        CREATE INDEX IF NOT EXISTS idx_qp_taxonomy_hierarchy 
        ON public.questions_partitioned (stream_id, division_id, subject_id, chapter_id, topic_id);

        CREATE INDEX IF NOT EXISTS idx_qp_quiz_fetcher 
        ON public.questions_partitioned (stream_id, subject_id, chapter_id, difficulty, random_id);

        CREATE INDEX IF NOT EXISTS idx_qp_subject_chapter 
        ON public.questions_partitioned (subject_id, chapter_id);

        CREATE INDEX IF NOT EXISTS idx_qp_fingerprint 
        ON public.questions_partitioned (fingerprint);

        CREATE INDEX IF NOT EXISTS idx_qp_trgm_question 
        ON public.questions_partitioned USING GIN (question gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS idx_qp_trgm_explanation 
        ON public.questions_partitioned USING GIN (explanation gin_trgm_ops);

        -- 4. Triggers
        DROP TRIGGER IF EXISTS set_partitioned_question_fingerprint ON public.questions_partitioned;
        CREATE TRIGGER set_partitioned_question_fingerprint
            BEFORE INSERT OR UPDATE OF question, options, fingerprint
            ON public.questions_partitioned
            FOR EACH ROW
            EXECUTE FUNCTION trg_set_question_fingerprint();

        DROP TRIGGER IF EXISTS sync_partitioned_question_taxonomy ON public.questions_partitioned;
        CREATE TRIGGER sync_partitioned_question_taxonomy
            BEFORE INSERT OR UPDATE OF stream, stream_id, division, division_id, subject, subject_id, chapter, chapter_id, topic, topic_id
            ON public.questions_partitioned
            FOR EACH ROW
            EXECUTE FUNCTION trg_sync_question_taxonomy();

        -- 5. Copy Data from Existing `questions` Table (if it exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions' AND table_schema = 'public') THEN
            INSERT INTO public.questions_partitioned (
                id, stream_id, question, options, correct_answer_indices, explanation,
                passage, parent_id, is_composite, composite_index, fingerprint,
                type, difficulty, division_id, subject_id, chapter_id, topic_id,
                subject, chapter, topic, stream, division, section,
                exam_type, institutes, years, status, author, tags, version,
                image_url, option_images, explanation_image_url, random_id, created_at, updated_at
            )
            SELECT 
                id,
                COALESCE(stream_id, UPPER(NULLIF(trim(stream), '')), 'GENERAL'),
                question,
                options,
                correct_answer_indices,
                explanation,
                passage,
                parent_id,
                COALESCE(is_composite, FALSE),
                COALESCE(composite_index, 1),
                COALESCE(fingerprint, generate_question_fingerprint(question, options)),
                COALESCE(type, 'MCQ'),
                COALESCE(difficulty, 'Medium'),
                division_id,
                subject_id,
                chapter_id,
                topic_id,
                subject,
                chapter,
                topic,
                stream,
                division,
                section,
                COALESCE(exam_type, 'Academic'),
                COALESCE(institutes, '{}'),
                COALESCE(years, '{}'),
                COALESCE(status, 'Pending'),
                COALESCE(author, 'Admin'),
                COALESCE(tags, '{}'),
                COALESCE(version, 1),
                image_url,
                COALESCE(option_images, '{}'),
                explanation_image_url,
                COALESCE(random_id, random()),
                COALESCE(created_at, NOW()),
                COALESCE(updated_at, NOW())
            FROM public.questions
            ON CONFLICT (id, stream_id) DO NOTHING;

            -- Swap Tables
            ALTER TABLE public.questions RENAME TO questions_backup_pre_partition;
            ALTER TABLE public.questions_partitioned RENAME TO questions;
        ELSE
            ALTER TABLE public.questions_partitioned RENAME TO questions;
        END IF;

    END IF;
END $$;

-- 6. Visible Verification Table (Renders directly in Supabase Results Grid)
SELECT 
    'questions (Total)' AS "Table / Partition",
    COUNT(*) AS "Row Count",
    'Parent Partitioned Table' AS "Partition Scope"
FROM public.questions
UNION ALL
SELECT 'questions_hsc', COUNT(*), 'HSC 1st & 2nd Paper' FROM public.questions_hsc
UNION ALL
SELECT 'questions_ssc', COUNT(*), 'SSC Class 9-10' FROM public.questions_ssc
UNION ALL
SELECT 'questions_admission', COUNT(*), 'Varsity, Medical, Eng' FROM public.questions_admission
UNION ALL
SELECT 'questions_bcs', COUNT(*), 'BCS & Govt Job' FROM public.questions_bcs
UNION ALL
SELECT 'questions_general', COUNT(*), 'Default / General' FROM public.questions_general
UNION ALL
SELECT 'questions_backup_pre_partition', COUNT(*), 'Original Backup Copy' FROM public.questions_backup_pre_partition;
