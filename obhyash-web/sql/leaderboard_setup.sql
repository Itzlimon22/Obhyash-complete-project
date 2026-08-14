-- Create the Leaderboard RPC
CREATE OR REPLACE FUNCTION public.get_monthly_leaderboard()
RETURNS TABLE (
    user_id uuid,
    name text,
    total_referrals bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id as user_id, 
        COALESCE(u.name, 'ব্যবহারকারী') as name,
        COUNT(h.id) as total_referrals
    FROM public.referral_history h
    JOIN public.referrals r ON r.id = h.referral_id
    JOIN public.users u ON u.id = r.owner_id
    WHERE h.admin_status = 'Approved' 
      AND date_trunc('month', h.redeemed_at) = date_trunc('month', now())
    GROUP BY u.id, u.name
    ORDER BY total_referrals DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
