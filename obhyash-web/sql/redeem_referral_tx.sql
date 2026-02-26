-- Redeem referral transaction (atomic)
-- This function enforces monthly limit, duplicate redemption guard, and inserts a pending history record.
-- It should be called via Supabase RPC (e.g., supabase.rpc('redeem_referral_tx', ...)).

CREATE OR REPLACE FUNCTION public.redeem_referral_tx(
    p_referral_id uuid,
    p_redeemer_id uuid
) RETURNS void AS $$
DECLARE
    monthly_limit int := 10; -- configurable via env or settings table later
    start_of_month timestamptz;
    current_count int;
    already_used boolean;
BEGIN
    -- 1. Verify referral exists (optional, rely on FK)
    PERFORM 1 FROM public.referrals WHERE id = p_referral_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referral not found' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Prevent self‑referral
    IF (SELECT owner_id FROM public.referrals WHERE id = p_referral_id) = p_redeemer_id THEN
        RAISE EXCEPTION 'Cannot redeem own referral code' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Check if this user already redeemed this referral
    SELECT EXISTS (
        SELECT 1 FROM public.referral_history
        WHERE referral_id = p_referral_id AND redeemed_by = p_redeemer_id
    ) INTO already_used;
    IF already_used THEN
        RAISE EXCEPTION 'Referral already used by this user' USING ERRCODE = 'P0003';
    END IF;

    -- 4. Monthly limit per referral (count of redemptions in current month)
    start_of_month := date_trunc('month', now());
    SELECT COUNT(*) INTO current_count
    FROM public.referral_history
    WHERE referral_id = p_referral_id
      AND redeemed_at >= start_of_month;
    IF current_count >= monthly_limit THEN
        RAISE EXCEPTION 'Monthly redemption limit reached' USING ERRCODE = 'P0004';
    END IF;

    -- 5. Insert pending history record
    INSERT INTO public.referral_history (
        id, referral_id, redeemed_by, redeemed_at, admin_status, reward_given
    ) VALUES (
        gen_random_uuid(),
        p_referral_id,
        p_redeemer_id,
        now(),
        'Pending',
        false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure indexes for fast look‑ups (if not already present)
CREATE INDEX IF NOT EXISTS idx_referral_history_referral_month ON public.referral_history(referral_id, redeemed_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_referral_history_user ON public.referral_history(referral_id, redeemed_by);
