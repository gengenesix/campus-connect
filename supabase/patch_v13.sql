-- ============================================================
-- Campus Connect — patch_v13.sql
-- CRITICAL: Run this in Supabase SQL Editor to fix messaging
-- ============================================================
-- Fixes:
--   1. REPLICA IDENTITY FULL on messages (Realtime filter support)
--   2. Ensures messages table is in supabase_realtime publication
--   3. Creates get_conversations RPC (idempotent — same as patch_v12)
--   4. Composite indexes for fast conversation list
-- ============================================================

-- 1. REPLICA IDENTITY FULL — required for Realtime to filter by any column
--    Without this, filtered subscriptions (receiver_id=eq.X) may not deliver events
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- 2. Add messages to Realtime publication (idempotent)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.messages;
  EXCEPTION WHEN OTHERS THEN
    NULL; -- not in publication yet, that's fine
  END;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
END;
$$;

-- 3. Fast conversation list RPC (create or replace = idempotent)
CREATE OR REPLACE FUNCTION public.get_conversations(p_user_id uuid)
RETURNS TABLE (
  partner_id   uuid,
  last_message text,
  last_time    timestamptz,
  unread_count bigint
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  WITH latest_msgs AS (
    SELECT DISTINCT ON (
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END
    )
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END AS partner_id,
      content     AS last_message,
      created_at  AS last_time
    FROM public.messages
    WHERE sender_id = p_user_id
       OR receiver_id = p_user_id
    ORDER BY
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END,
      created_at DESC
  ),
  unread AS (
    SELECT sender_id AS partner_id,
           COUNT(*)  AS unread_count
    FROM public.messages
    WHERE receiver_id = p_user_id
      AND is_read = false
    GROUP BY sender_id
  )
  SELECT
    l.partner_id,
    l.last_message,
    l.last_time,
    COALESCE(u.unread_count, 0) AS unread_count
  FROM latest_msgs l
  LEFT JOIN unread u ON u.partner_id = l.partner_id
  ORDER BY l.last_time DESC;
$$;

GRANT EXECUTE ON FUNCTION public.get_conversations(uuid) TO authenticated;

-- 4. Composite indexes for fast messaging queries (idempotent)
CREATE INDEX IF NOT EXISTS messages_conv_partner_idx
  ON public.messages (
    LEAST(sender_id, receiver_id),
    GREATEST(sender_id, receiver_id),
    created_at DESC
  );

CREATE INDEX IF NOT EXISTS messages_unread_idx
  ON public.messages (receiver_id, sender_id)
  WHERE is_read = false;
