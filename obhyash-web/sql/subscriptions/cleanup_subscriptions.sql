-- 1. Optimization: Add Index on expires_at for fast updates and reads
CREATE INDEX IF NOT EXISTS idx_subscription_history_expires_at 
ON subscription_history(expires_at);

-- 2. Enable pg_cron extension (requires high-tier database or custom config)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Cleanup Function
CREATE OR REPLACE FUNCTION mark_expired_subscriptions_inactive()
RETURNS void AS $$
BEGIN
  -- Efficient update using the new index
  UPDATE subscription_history
  SET is_active = false
  WHERE is_active = true 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 4. Schedule (Daily at midnight)
SELECT cron.schedule('0 0 * * *', $$SELECT mark_expired_subscriptions_inactive()$$);
