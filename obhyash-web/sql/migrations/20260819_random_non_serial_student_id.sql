-- Migration: Non-Serial, Random Student ID Generation
-- Description: Switches student ID generation from sequential (e.g. OBH-10001, OBH-10002) 
-- to randomized non-serial numbers (e.g. OBH-74921, OBH-38502, OBH-81649) with loop collision prevention.

-- 1. Create or replace function to generate random non-serial student IDs
CREATE OR REPLACE FUNCTION public.generate_next_student_id()
RETURNS TEXT AS $$
DECLARE
    v_id TEXT;
    v_exists BOOLEAN;
    v_random_num INTEGER;
BEGIN
    LOOP
        -- Generate random 5-digit number between 10000 and 99999
        v_random_num := floor(random() * (99999 - 10000 + 1) + 10000)::INTEGER;
        v_id := 'OBH-' || v_random_num::TEXT;
        
        -- Check for uniqueness
        SELECT EXISTS (SELECT 1 FROM public.users WHERE student_id = v_id) INTO v_exists;
        IF NOT v_exists THEN
            RETURN v_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger to assign random non-serial student_id on new user insertion
CREATE OR REPLACE FUNCTION public.assign_student_id_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.student_id IS NULL OR TRIM(NEW.student_id) = '' THEN
        NEW.student_id := public.generate_next_student_id();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-attach trigger
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        DROP TRIGGER IF EXISTS trg_assign_student_id ON public.users;
        CREATE TRIGGER trg_assign_student_id
        BEFORE INSERT ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION public.assign_student_id_trigger();
    END IF;
END $$;
