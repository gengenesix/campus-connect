-- ============================================================
-- Campus Connect — Patch v5
-- Run in Supabase → SQL Editor → New query
-- Safe to re-run. Does NOT wipe any data.
-- ============================================================

-- 1. Ensure new profile columns exist
alter table public.profiles add column if not exists course text;
alter table public.profiles add column if not exists class_year text;
alter table public.profiles add column if not exists is_banned boolean default false;

-- 2. Re-create UPDATE policy with both USING + WITH CHECK clauses
--    (fixes silent "0 rows updated" when RLS rejects the new row value)
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 3. Re-ensure INSERT policy exists
drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 4. Ensure storage buckets exist
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
  on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('service-images', 'service-images', true)
  on conflict (id) do nothing;

-- 5. Storage upload policies (idempotent)
drop policy if exists "Users can upload their own avatar" on storage.objects;
create policy "Users can upload their own avatar" on storage.objects
  for insert with check (bucket_id = 'avatars' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Authenticated users can upload product images" on storage.objects
  for insert with check (bucket_id = 'product-images' and auth.role() = 'authenticated');

drop policy if exists "Authenticated users can upload service images" on storage.objects;
create policy "Authenticated users can upload service images" on storage.objects
  for insert with check (bucket_id = 'service-images' and auth.role() = 'authenticated');

-- 6. Add is_banned column-based ban check to products/services insert policies
--    (re-creates with is_not_banned guard if function exists)
drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products" on public.products
  for insert with check (
    auth.uid() = seller_id
    and (
      not exists (select 1 from public.profiles where id = auth.uid() and is_banned = true)
    )
  );

drop policy if exists "Providers can insert own services" on public.services;
create policy "Providers can insert own services" on public.services
  for insert with check (
    auth.uid() = provider_id
    and (
      not exists (select 1 from public.profiles where id = auth.uid() and is_banned = true)
    )
  );
