-- Stored procedure for admin approval/rejection of referral redemption
-- Handles status update, reward distribution, and notifications atomically

CREATE OR REPLACE FUNCTION public.approve_referral_tx(
    p_history_id uuid,
    p_action text   -- 'approve' or 'reject'
) RETURNS void AS $$
DECLARE
    rec RECORD;
    owner_id uuid;
    redeemer_id uuid;
BEGIN
    -- Fetch the history record with related referral and owner
    SELECT h.id, h.admin_status, h.redeemed_by, r.owner_id
    INTO rec
    FROM referral_history h
    JOIN referrals r ON r.id = h.referral_id
    WHERE h.id = p_history_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'History record not found' USING ERRCODE = 'P0001';
    END IF;

    IF rec.admin_status <> 'Pending' THEN
        RAISE EXCEPTION 'Record already processed' USING ERRCODE = 'P0002';
    END IF;

    IF p_action = 'reject' THEN
        -- Update status to Rejected
        UPDATE referral_history SET admin_status = 'Rejected' WHERE id = p_history_id;
        -- Insert notifications for both parties
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES (gen_random_uuid(), rec.owner_id, 'রেফারেল বাতিল!', 'আপনার একটি রেফারেল অ্যাডমিন কর্তৃক বাতিল করা হয়েছে।', 'system', false, now()),
               (gen_random_uuid(), rec.redeemed_by, 'রেফারেল বাতিল!', 'আপনার রেফারেল বোনাস রিকোয়েস্টটি অ্যাডমিন কর্তৃক বাতিল করা হয়েছে।', 'system', false, now());
        RETURN;
    ELSIF p_action = 'approve' THEN
        -- Extend subscriptions for both users (1 month each)
        PERFORM extend_subscription(rec.owner_id);
        PERFORM extend_subscription(rec.redeemed_by);
        -- Mark as approved and reward given
        UPDATE referral_history SET admin_status = 'Approved', reward_given = true WHERE id = p_history_id;
        -- Insert success notifications
        INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at)
        VALUES (gen_random_uuid(), rec.owner_id, 'রেফারেল সফল!', 'আপনার রেফারেল কোড ব্যবহার করে একজন নতুন ইউজার যুক্ত হয়েছে। আপনি ১ মাসের ফ্রি প্রিমিয়াম পেয়েছেন!', 'system', false, now()),
               (gen_random_uuid(), rec.redeemed_by, 'রেফারেল বোনাস!', 'রেফারেল কোড ব্যবহারের জন্য আপনার অ্যাকাউন্টে ১ মাসের ফ্রি প্রিমিয়াম যোগ করা হয়েছে।', 'system', false, now());
        RETURN;
    ELSE
        RAISE EXCEPTION 'Invalid action' USING ERRCODE = 'P0003';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to extend a user's subscription by 1 month
CREATE OR REPLACE FUNCTION public.extend_subscription(p_user_id uuid) RETURNS void AS $$
DECLARE
    sub jsonb;
    current_exp timestamptz;
BEGIN
    SELECT subscription INTO sub FROM users WHERE id = p_user_id;
    current_exp := (sub->>'expiry')::timestamptz;
    IF current_exp IS NULL OR current_exp < now() THEN
        current_exp := now();
    END IF;
    current_exp := current_exp + interval '1 month';
    UPDATE users SET subscription = jsonb_set(coalesce(sub, '{}'::jsonb), '{expiry}', to_jsonb(current_exp::text))
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute rights to the service role (or a dedicated admin role)
GRANT EXECUTE ON FUNCTION public.approve_referral_tx(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.extend_subscription(uuid) TO anon, authenticated;
