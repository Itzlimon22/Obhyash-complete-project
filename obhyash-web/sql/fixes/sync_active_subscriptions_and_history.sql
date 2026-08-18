-- =============================================================================
-- Sync Active Subscriptions & History Records
-- Ensures all users with approved payment requests or active subscriptions
-- get full Pro access across both Web and Flutter applications.
-- =============================================================================

-- 1. Ensure required columns exist on users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription JSONB DEFAULT '{"plan": "Free", "status": "Inactive"}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'Inactive';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_subscribed BOOLEAN DEFAULT false;

-- 2. Sync users table from approved payment_requests or existing active subscription JSON
DO $$
DECLARE
  r RECORD;
  v_plan_name TEXT;
  v_duration_days INT;
  v_expiry TIMESTAMPTZ;
  v_plan_id UUID;
BEGIN
  -- A. Process all approved payment requests where the user hasn't expired yet
  FOR r IN 
    SELECT pr.*, u.subscription as current_sub
    FROM public.payment_requests pr
    JOIN public.users u ON u.id = pr.user_id
    WHERE pr.status = 'Approved'
    ORDER BY pr.reviewed_at ASC NULLS FIRST, pr.created_at ASC
  LOOP
    -- Determine duration
    v_duration_days := 30;
    v_plan_id := NULL;
    v_plan_name := COALESCE(r.plan_name, 'Premium');

    SELECT id, duration_days, display_name 
    INTO v_plan_id, v_duration_days, v_plan_name
    FROM public.subscription_plans
    WHERE LOWER(name) = LOWER(r.plan_name) 
       OR LOWER(display_name) = LOWER(r.plan_name)
       OR LOWER(display_name) ILIKE '%' || LOWER(r.plan_name) || '%'
       OR LOWER(r.plan_name) ILIKE '%' || LOWER(display_name) || '%'
    LIMIT 1;

    IF v_duration_days IS NULL THEN
      IF LOWER(r.plan_name) LIKE '%year%' OR r.plan_name LIKE '%বছর%' THEN
        v_duration_days := 365;
      ELSIF LOWER(r.plan_name) LIKE '%pro%' OR LOWER(r.plan_name) LIKE '%quarter%' OR r.plan_name LIKE '%ত্রৈমাসিক%' THEN
        v_duration_days := 90;
      ELSE
        v_duration_days := 30;
      END IF;
    END IF;

    v_expiry := COALESCE(r.reviewed_at, r.requested_at, NOW()) + (v_duration_days || ' days')::INTERVAL;

    -- Only activate if still valid
    IF v_expiry > NOW() THEN
      -- Update users table
      UPDATE public.users
      SET
        subscription = jsonb_build_object(
          'plan', v_plan_name,
          'expiry', v_expiry,
          'expires_at', v_expiry,
          'status', 'Active'
        ),
        subscription_status = 'Active',
        subscription_expires_at = v_expiry,
        is_subscribed = true,
        level = 'Pro',
        updated_at = NOW()
      WHERE id = r.user_id;

      -- Deactivate old history & insert new history record if not present
      UPDATE public.subscription_history
      SET is_active = false
      WHERE user_id = r.user_id;

      IF NOT EXISTS (
        SELECT 1 FROM public.subscription_history 
        WHERE user_id = r.user_id AND payment_request_id = r.id
      ) THEN
        INSERT INTO public.subscription_history (
          user_id,
          plan_id,
          payment_request_id,
          started_at,
          expires_at,
          is_active,
          created_at
        ) VALUES (
          r.user_id,
          v_plan_id,
          r.id,
          COALESCE(r.reviewed_at, r.requested_at, NOW()),
          v_expiry,
          true,
          NOW()
        );
      ELSE
        UPDATE public.subscription_history
        SET is_active = true,
            expires_at = v_expiry
        WHERE user_id = r.user_id AND payment_request_id = r.id;
      END IF;
    END IF;
  END LOOP;

  -- B. Sync users who have active subscription JSON but missing top-level columns or history
  FOR r IN
    SELECT u.id, u.subscription
    FROM public.users u
    WHERE u.subscription IS NOT NULL
      AND (
        (u.subscription->>'status')::text ILIKE 'active'
        OR (u.subscription->>'expiry')::timestamptz > NOW()
        OR (u.subscription->>'expires_at')::timestamptz > NOW()
      )
  LOOP
    v_expiry := COALESCE(
      (r.subscription->>'expires_at')::timestamptz,
      (r.subscription->>'expiry')::timestamptz,
      NOW() + INTERVAL '30 days'
    );

    IF v_expiry > NOW() THEN
      v_plan_name := COALESCE(r.subscription->>'plan', 'Premium');
      
      UPDATE public.users
      SET
        subscription_status = 'Active',
        subscription_expires_at = v_expiry,
        is_subscribed = true,
        level = 'Pro',
        subscription = jsonb_build_object(
          'plan', v_plan_name,
          'expiry', v_expiry,
          'expires_at', v_expiry,
          'status', 'Active'
        )
      WHERE id = r.id;

      IF NOT EXISTS (
        SELECT 1 FROM public.subscription_history
        WHERE user_id = r.id AND is_active = true AND expires_at > NOW()
      ) THEN
        INSERT INTO public.subscription_history (
          user_id,
          started_at,
          expires_at,
          is_active,
          created_at
        ) VALUES (
          r.id,
          NOW(),
          v_expiry,
          true,
          NOW()
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- 3. Ensure RLS policies on subscription_history are fully permissive for user's own data
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscription history" ON public.subscription_history;
CREATE POLICY "Users can view own subscription history" ON public.subscription_history
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage subscription history" ON public.subscription_history;
CREATE POLICY "Admins can manage subscription history" ON public.subscription_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users WHERE users.id = auth.uid() AND users.role = 'Admin'
    )
  );
