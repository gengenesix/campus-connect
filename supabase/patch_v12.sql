-- patch_v12: Fast conversation aggregation + composite index for messaging
-- Run in Supabase SQL editor

-- ============================================================
-- 1. Fast conversation list via DISTINCT ON (replaces full table scan)
-- ============================================================
create or replace function public.get_conversations(p_user_id uuid)
returns table (
  partner_id   uuid,
  last_message text,
  last_time    timestamptz,
  unread_count bigint
)
language sql
security definer
stable
as $$
  with latest_msgs as (
    -- One row per conversation partner (most recent message)
    select distinct on (
      case when sender_id = p_user_id then receiver_id else sender_id end
    )
      case when sender_id = p_user_id then receiver_id else sender_id end as partner_id,
      content     as last_message,
      created_at  as last_time
    from public.messages
    where sender_id = p_user_id
       or receiver_id = p_user_id
    order by
      case when sender_id = p_user_id then receiver_id else sender_id end,
      created_at desc
  ),
  unread as (
    select sender_id as partner_id,
           count(*)  as unread_count
    from public.messages
    where receiver_id = p_user_id
      and is_read = false
    group by sender_id
  )
  select
    l.partner_id,
    l.last_message,
    l.last_time,
    coalesce(u.unread_count, 0) as unread_count
  from latest_msgs l
  left join unread u on u.partner_id = l.partner_id
  order by l.last_time desc;
$$;

grant execute on function public.get_conversations(uuid) to authenticated;

-- ============================================================
-- 2. Composite index to make the DISTINCT ON blazing fast
-- ============================================================
create index if not exists messages_conv_partner_idx
  on public.messages (
    least(sender_id, receiver_id),
    greatest(sender_id, receiver_id),
    created_at desc
  );

-- ============================================================
-- 3. Partial index for fast unread counts
-- ============================================================
create index if not exists messages_unread_idx
  on public.messages (receiver_id, sender_id)
  where is_read = false;
