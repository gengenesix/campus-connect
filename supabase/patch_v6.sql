-- ============================================================
-- Campus Connect — Patch v6
-- Run in Supabase → SQL Editor → New query
-- Safe to re-run. Does NOT wipe any data.
-- ============================================================

-- 1. Allow users to UPDATE (re-upload) their own avatar
--    Without this, upsert fails silently the second time a user
--    tries to change their photo (INSERT is blocked for existing path)
drop policy if exists "Users can update their own avatar" on storage.objects;
create policy "Users can update their own avatar" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. Allow users to DELETE their old avatar (cleanup)
drop policy if exists "Users can delete their own avatar" on storage.objects;
create policy "Users can delete their own avatar" on storage.objects
  for delete using (
    bucket_id = 'avatars'
    and auth.role() = 'authenticated'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3. Public SELECT on avatars (serves images without auth token)
drop policy if exists "Public can view avatars" on storage.objects;
create policy "Public can view avatars" on storage.objects
  for select using (bucket_id = 'avatars');

-- 4. Same public read for product-images and service-images
drop policy if exists "Public can view product images" on storage.objects;
create policy "Public can view product images" on storage.objects
  for select using (bucket_id = 'product-images');

drop policy if exists "Public can view service images" on storage.objects;
create policy "Public can view service images" on storage.objects
  for select using (bucket_id = 'service-images');

-- 5. Allow authenticated users to update product/service images they own
drop policy if exists "Users can update own product images" on storage.objects;
create policy "Users can update own product images" on storage.objects
  for update using (
    bucket_id = 'product-images'
    and auth.role() = 'authenticated'
  );

drop policy if exists "Users can update own service images" on storage.objects;
create policy "Users can update own service images" on storage.objects
  for update using (
    bucket_id = 'service-images'
    and auth.role() = 'authenticated'
  );
