-- ============================================================
-- Campus Connect — Patch v4
-- Run this in Supabase → SQL Editor → New query
-- Safe to re-run. Does NOT wipe any data.
-- ============================================================

-- 1. Fix rating default (new users start at 0, not 5.0)
alter table public.profiles alter column rating set default 0.0;

-- 2. Add INSERT policy so new users can create their profile row
--    (was missing — caused "violates row-level security" error)
drop policy if exists "Users can create own profile" on public.profiles;
create policy "Users can create own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- 3. Admin moderation — read all messages, manage bookings/reviews, delete profiles
drop policy if exists "Admins can read all messages" on public.messages;
create policy "Admins can read all messages" on public.messages
  for select using (public.is_admin());

drop policy if exists "Admins can delete any message" on public.messages;
create policy "Admins can delete any message" on public.messages
  for delete using (public.is_admin());

drop policy if exists "Admins can manage all bookings" on public.bookings;
create policy "Admins can manage all bookings" on public.bookings
  for all using (public.is_admin());

drop policy if exists "Admins can manage all reviews" on public.reviews;
create policy "Admins can manage all reviews" on public.reviews
  for all using (public.is_admin());

drop policy if exists "Admins can delete profiles" on public.profiles;
create policy "Admins can delete profiles" on public.profiles
  for delete using (public.is_admin());
