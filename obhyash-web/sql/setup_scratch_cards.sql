-- 1. Create scratch_cards table
CREATE TABLE IF NOT EXISTS public.scratch_cards (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    reward_type text, -- Assigned when scratched
    is_scratched boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    scratched_at timestamptz
);

-- Ensure RLS is enabled and policies are set
ALTER TABLE public.scratch_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scratch cards"
    ON public.scratch_cards FOR SELECT
    USING (auth.uid() = user_id);

-- We don't want users updating this directly to cheat. Only the RPC should update it.

-- 2. Update redeem_referral_tx to handle the gamification logic
CREATE OR REPLACE FUNCTION public.redeem_referral_tx(
    p_referral_id uuid,
    p_redeemer_id uuid
) RETURNS void AS $$
DECLARE
    already_used boolean;
    v_owner_id uuid;
    v_total_successful_referrals int;
BEGIN
    -- 1. Verify referral exists and get owner
    SELECT owner_id INTO v_owner_id FROM public.referrals WHERE id = p_referral_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Referral not found' USING ERRCODE = 'P0001';
    END IF;

    -- 2. Prevent self‑referral
    IF v_owner_id = p_redeemer_id THEN
        RAISE EXCEPTION 'Cannot redeem own referral code' USING ERRCODE = 'P0002';
    END IF;

    -- 3. Check if this user already redeemed this referral (or ANY referral to enforce 1 per user)
    -- Enforcing 1 lifetime use per user as requested: "this referrel system can use user once? or what?" -> Yes, user can use a code ONLY ONCE in lifetime.
    SELECT EXISTS (
        SELECT 1 FROM public.referral_history
        WHERE redeemed_by = p_redeemer_id
    ) INTO already_used;
    IF already_used THEN
        RAISE EXCEPTION 'User has already used a referral code' USING ERRCODE = 'P0003';
    END IF;

    -- 4. Insert history record (Marked as Approved immediately since it's automated now)
    INSERT INTO public.referral_history (
        id, referral_id, redeemed_by, redeemed_at, admin_status, reward_given
    ) VALUES (
        gen_random_uuid(), p_referral_id, p_redeemer_id, now(), 'Approved', true
    );

    -- 5. Give the Redeemer (New User) 1 Month Free Premium
    -- Safely update the JSONB subscription field
    UPDATE public.users 
    SET subscription = jsonb_set(
            jsonb_set(
                COALESCE(subscription, '{}'::jsonb),
                '{plan}',
                '"Premium"'
            ),
            '{expiry}',
            to_jsonb(to_char(now() + interval '1 month', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
        )
    WHERE id = p_redeemer_id;

    -- 6. Check Referrer's total referrals to grant a Scratch Card
    SELECT COUNT(*) INTO v_total_successful_referrals
    FROM public.referral_history
    WHERE referral_id = p_referral_id AND admin_status = 'Approved';

    -- Every 3 referrals, insert an unscratched card
    IF v_total_successful_referrals % 3 = 0 THEN
        INSERT INTO public.scratch_cards (user_id, is_scratched)
        VALUES (v_owner_id, false);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Create RPC for scratching the card securely
CREATE OR REPLACE FUNCTION public.reveal_scratch_card_tx(
    p_card_id uuid
) RETURNS text AS $$
DECLARE
    v_user_id uuid;
    v_is_scratched boolean;
    v_rand float;
    v_reward_type text;
BEGIN
    -- Get card details
    SELECT user_id, is_scratched INTO v_user_id, v_is_scratched 
    FROM public.scratch_cards WHERE id = p_card_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Card not found' USING ERRCODE = 'P0001';
    END IF;

    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized' USING ERRCODE = 'P0002';
    END IF;

    IF v_is_scratched THEN
        RAISE EXCEPTION 'Card already scratched' USING ERRCODE = 'P0003';
    END IF;

    -- Determine Reward using probabilities
    -- 1 Month Free (70%), 50% Off (15%), 2 Months Free (10%), 3 Months Free (5%)
    v_rand := random();
    
    IF v_rand <= 0.70 THEN
        v_reward_type := '1_month_free';
    ELSIF v_rand <= 0.85 THEN
        v_reward_type := '50_percent_off';
    ELSIF v_rand <= 0.95 THEN
        v_reward_type := '2_months_free';
    ELSE
        v_reward_type := '3_months_free';
    END IF;

    -- Update card
    UPDATE public.scratch_cards 
    SET is_scratched = true, scratched_at = now(), reward_type = v_reward_type
    WHERE id = p_card_id;

    -- Apply Reward (Only handling Free subscriptions here. 50% off could generate a coupon code, handled in app)
    IF v_reward_type = '1_month_free' THEN
        UPDATE public.users SET subscription = jsonb_set(jsonb_set(COALESCE(subscription, '{}'::jsonb), '{plan}', '"Premium"'), '{expiry}', to_jsonb(to_char(now() + interval '1 month', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))) WHERE id = v_user_id;
    ELSIF v_reward_type = '2_months_free' THEN
        UPDATE public.users SET subscription = jsonb_set(jsonb_set(COALESCE(subscription, '{}'::jsonb), '{plan}', '"Premium"'), '{expiry}', to_jsonb(to_char(now() + interval '2 months', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))) WHERE id = v_user_id;
    ELSIF v_reward_type = '3_months_free' THEN
        UPDATE public.users SET subscription = jsonb_set(jsonb_set(COALESCE(subscription, '{}'::jsonb), '{plan}', '"Premium"'), '{expiry}', to_jsonb(to_char(now() + interval '3 months', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))) WHERE id = v_user_id;
    END IF;

    RETURN v_reward_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
