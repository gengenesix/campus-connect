-- ============================================================
-- Campus Connect — patch_v14.sql
-- Admin SELECT policies + DB hardening
-- Run in Supabase SQL Editor (safe to re-run / idempotent)
-- ============================================================
-- Fixes:
--   1. Explicit admin SELECT policies on all tables (belt-and-suspenders
--      alongside the existing FOR ALL policies — ensures admin panel loads)
--   2. Ensure is_admin() helper is correct (idempotent recreate)
--   3. Ensure products/services accept 'pending' status (idempotent)
--   4. Ensure profiles has is_banned column (idempotent)
--   5. Performance index for admin queries (status + created_at)
-- ============================================================

-- 1. Recreate is_admin() helper to be safe (idempotent)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. Explicit admin SELECT policies
--    (The existing FOR ALL policies should cover this, but explicit is safer)

-- Admin can read ALL profiles (already covered by public select policy, but explicit for clarity)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

-- Admin can read ALL products including pending/deleted
DROP POLICY IF EXISTS "Admins can read all products" ON public.products;
CREATE POLICY "Admins can read all products" ON public.products
  FOR SELECT USING (public.is_admin());

-- Admin can read ALL services including pending/deleted
DROP POLICY IF EXISTS "Admins can read all services" ON public.services;
CREATE POLICY "Admins can read all services" ON public.services
  FOR SELECT USING (public.is_admin());

-- 3. Ensure products status constraint includes 'pending' (idempotent)
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_status_check
  CHECK (status IN ('pending', 'active', 'sold', 'paused', 'deleted'));

-- 4. Ensure services status constraint includes 'pending' (idempotent)
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_status_check;
ALTER TABLE public.services
  ADD CONSTRAINT services_status_check
  CHECK (status IN ('pending', 'active', 'paused', 'deleted'));

-- 5. Ensure is_banned column exists on profiles (idempotent)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false;

-- 6. Performance indexes for admin panel queries
CREATE INDEX IF NOT EXISTS products_status_created_idx
  ON public.products (status, created_at DESC);

CREATE INDEX IF NOT EXISTS services_status_created_idx
  ON public.services (status, created_at DESC);

-- 7. Ensure admin user still has admin role (safety net)
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'gengenesix@gmail.com'
)
AND role != 'admin';

-- ============================================================
-- Verify (run these SELECTs to confirm everything is working):
-- SELECT role FROM public.profiles WHERE id = auth.uid();
-- SELECT COUNT(*) FROM public.products;
-- SELECT COUNT(*) FROM public.services;
-- SELECT COUNT(*) FROM public.profiles;
-- ============================================================
