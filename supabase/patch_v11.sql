-- patch_v11: Ensure product views RPC is correct + Realtime on products
-- Run in Supabase SQL editor

-- ============================================================
-- 1. Re-create increment_product_views with anon access
-- ============================================================
create or replace function public.increment_product_views(product_id uuid)
returns void as $$
begin
  update public.products
  set views = coalesce(views, 0) + 1
  where id = product_id
    and status != 'deleted';
end;
$$ language plpgsql security definer;

-- Allow anon + authenticated to call it (security definer bypasses RLS)
grant execute on function public.increment_product_views(uuid) to anon, authenticated;

-- ============================================================
-- 2. Enable Realtime on products table (idempotent)
-- ============================================================
-- Use a DO block to safely drop then re-add (ALTER PUBLICATION has no IF EXISTS)
do $$
begin
  begin
    alter publication supabase_realtime drop table public.products;
  exception when others then
    null; -- table wasn't in publication yet, that's fine
  end;
  alter publication supabase_realtime add table public.products;
end;
$$;

-- ============================================================
-- 3. Ensure views column has a default of 0
-- ============================================================
alter table public.products
  alter column views set default 0;

update public.products set views = 0 where views is null;

alter table public.products
  alter column views set not null;
