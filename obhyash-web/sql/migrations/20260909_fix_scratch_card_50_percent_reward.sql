-- ==============================================================================
-- Fix: Handle 50_percent_off reward in reveal_scratch_card_tx
-- Previously this reward type had no server-side action.
-- Solution: Generate a unique coupon code stored in scratch_card_coupons.
-- ==============================================================================

-- 1. Create coupon codes table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.scratch_card_coupons (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    card_id uuid REFERENCES public.scratch_cards(id) ON DELETE CASCADE,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    coupon_code text NOT NULL UNIQUE,
    discount_percent int NOT NULL DEFAULT 50,
    is_used boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    expires_at timestamptz DEFAULT (now() + interval '30 days'),
    used_at timestamptz
);

ALTER TABLE public.scratch_card_coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own coupons" ON public.scratch_card_coupons;
CREATE POLICY "Users can view their own coupons"
    ON public.scratch_card_coupons FOR SELECT
    USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_scratch_card_coupons_user_id
    ON public.scratch_card_coupons(user_id);

CREATE INDEX IF NOT EXISTS idx_scratch_card_coupons_code
    ON public.scratch_card_coupons(coupon_code);

-- 2. Replace reveal_scratch_card_tx with the complete version (all 4 reward types)
-- DROP first because we're changing the return type from text → json
DROP FUNCTION IF EXISTS public.reveal_scratch_card_tx(uuid);
CREATE OR REPLACE FUNCTION public.reveal_scratch_card_tx(
    p_card_id uuid
) RETURNS json AS $$
DECLARE
    v_user_id uuid;
    v_is_scratched boolean;
    v_rand float;
    v_reward_type text;
    v_new_expiry timestamptz;
    v_current_expiry timestamptz;
    v_now timestamptz := now();
    v_coupon_code text;
    v_interval interval;
BEGIN
    -- Verify card and ownership
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

    -- Weighted probability: 1 Month (70%), 50% Off (15%), 2 Months (10%), 3 Months (5%)
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

    -- Mark card scratched
    UPDATE public.scratch_cards 
    SET is_scratched = true, scratched_at = v_now, reward_type = v_reward_type
    WHERE id = p_card_id;

    -- Apply reward
    CASE v_reward_type
        WHEN '1_month_free' THEN v_interval := interval '1 month';
        WHEN '2_months_free' THEN v_interval := interval '2 months';
        WHEN '3_months_free' THEN v_interval := interval '3 months';
        ELSE v_interval := NULL;
    END CASE;

    IF v_interval IS NOT NULL THEN
        -- Stack subscription on existing expiry
        SELECT subscription_expires_at INTO v_current_expiry FROM public.users WHERE id = v_user_id;
        IF v_current_expiry IS NULL OR v_current_expiry < v_now THEN
            v_new_expiry := v_now + v_interval;
        ELSE
            v_new_expiry := v_current_expiry + v_interval;
        END IF;
        -- Enforce 365-day cap
        IF v_new_expiry > (v_now + interval '365 days') THEN
            v_new_expiry := v_now + interval '365 days';
        END IF;

        UPDATE public.users
        SET is_subscribed = true,
            subscription_status = 'active',
            subscription_expires_at = v_new_expiry,
            subscription = jsonb_set(jsonb_set(jsonb_set(
                COALESCE(subscription, '{}'::jsonb),
                '{plan}', '"Pro"'), '{status}', '"Active"'),
                '{expiry}', to_jsonb(v_new_expiry::text))
        WHERE id = v_user_id;

        INSERT INTO public.subscription_history (user_id, plan_id, started_at, expires_at,
            is_active, plan_name, amount, currency, status, payment_method)
        VALUES (v_user_id, NULL, v_now, v_new_expiry, true,
            'স্ক্র্যাচ কার্ড রিওয়ার্ড (' || v_reward_type || ')',
            0, '৳', 'completed', 'scratch_card');

        INSERT INTO public.notifications (user_id, title, message, type, created_at)
        VALUES (v_user_id, 'স্ক্র্যাচ কার্ড রিওয়ার্ড পেয়েছ! 🎉',
            CASE v_reward_type
                WHEN '1_month_free' THEN 'অভিনন্দন! তোমার অ্যাকাউন্টে ১ মাসের বিনামূল্যে প্রো সাবস্ক্রিপশন যোগ হয়েছে।'
                WHEN '2_months_free' THEN 'অভিনন্দন! তোমার অ্যাকাউন্টে ২ মাসের বিনামূল্যে প্রো সাবস্ক্রিপশন যোগ হয়েছে।'
                WHEN '3_months_free' THEN 'অভিনন্দন! তোমার অ্যাকাউন্টে ৩ মাসের বিনামূল্যে প্রো সাবস্ক্রিপশন যোগ হয়েছে। 🏆'
            END,
            'reward', v_now);

    ELSIF v_reward_type = '50_percent_off' THEN
        -- Generate unique coupon: SC-XXXXXXXX
        v_coupon_code := 'SC-' || upper(substring(
            md5(p_card_id::text || v_user_id::text || v_now::text || random()::text), 1, 8));

        INSERT INTO public.scratch_card_coupons (card_id, user_id, coupon_code, discount_percent, expires_at)
        VALUES (p_card_id, v_user_id, v_coupon_code, 50, v_now + interval '30 days');

        INSERT INTO public.notifications (user_id, title, message, type, created_at)
        VALUES (v_user_id, '৫০% ডিসকাউন্ট কুপন পেয়েছ! 🎫',
            'তোমার কুপন কোড: ' || v_coupon_code || ' — সাবস্ক্রিপশনে ৫০% ছাড়! (৩০ দিনের মধ্যে ব্যবহার করতে হবে)',
            'reward', v_now);
    END IF;

    -- Return reward type + coupon_code (if applicable)
    RETURN json_build_object(
        'reward_type', v_reward_type,
        'coupon_code', CASE WHEN v_reward_type = '50_percent_off' THEN v_coupon_code ELSE NULL END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
