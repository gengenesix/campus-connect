-- ============================================================
-- Campus Connect — patch_v15.sql
-- RLS Cleanup + Admin Fix + DB Hardening
-- Run in Supabase SQL Editor (safe to re-run — fully idempotent)
-- ============================================================
-- Fixes:
--   1. Drop ALL accumulated/conflicting policies, recreate cleanly
--   2. Recreate is_admin() and is_not_banned() with search_path safety
--   3. Ensure admin role is set for gengenesix@gmail.com
--   4. Explicit admin SELECT + UPDATE policies (no more FOR ALL ambiguity)
--   5. Products/services status constraints include 'pending'
--   6. is_banned column on profiles
--   7. in_stock column on products
--   8. Performance indexes
-- ============================================================

-- ── 1. Recreate helper functions ─────────────────────────────

-- is_admin(): SECURITY DEFINER so it bypasses RLS on profiles.
-- SET search_path prevents search_path injection attacks.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_not_banned()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_banned = true
  );
$$;

-- Grant execute to all roles that need it
GRANT EXECUTE ON FUNCTION public.is_admin()     TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_not_banned() TO authenticated, anon;

-- ── 2. Drop ALL existing policies (idempotent) ───────────────

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone"  ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile"               ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile"              ON public.profiles;
DROP POLICY IF EXISTS "Admins can ban users"                       ON public.profiles;
DROP POLICY IF EXISTS "Users can create own profile"               ON public.profiles;
DROP POLICY IF EXISTS "Admins can read all profiles"               ON public.profiles;

-- Products
DROP POLICY IF EXISTS "Active products are viewable by everyone"   ON public.products;
DROP POLICY IF EXISTS "Users can insert own products (unbanned)"   ON public.products;
DROP POLICY IF EXISTS "Users can insert own products"              ON public.products;
DROP POLICY IF EXISTS "Sellers can update own products"            ON public.products;
DROP POLICY IF EXISTS "Sellers can delete own products"            ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products"             ON public.products;
DROP POLICY IF EXISTS "Admins can update any product"              ON public.products;
DROP POLICY IF EXISTS "Admins can read all products"               ON public.products;

-- Services
DROP POLICY IF EXISTS "Active services are viewable by everyone"   ON public.services;
DROP POLICY IF EXISTS "Providers can insert own services (unbanned)" ON public.services;
DROP POLICY IF EXISTS "Providers can insert own services"          ON public.services;
DROP POLICY IF EXISTS "Providers can update own services"          ON public.services;
DROP POLICY IF EXISTS "Providers can delete own services"          ON public.services;
DROP POLICY IF EXISTS "Admins can manage all services"             ON public.services;
DROP POLICY IF EXISTS "Admins can update any service"              ON public.services;
DROP POLICY IF EXISTS "Admins can read all services"               ON public.services;

-- ── 3. Recreate RLS policies cleanly ─────────────────────────

-- PROFILES ──────────────────────────────────────────
-- Anyone (including anon) can read all profiles
CREATE POLICY "profiles_public_read"
  ON public.profiles FOR SELECT
  USING (true);

-- Users can insert their own profile row
CREATE POLICY "profiles_own_insert"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "profiles_own_update"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can update any profile (verify/ban users)
CREATE POLICY "profiles_admin_update"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- PRODUCTS ──────────────────────────────────────────
-- Public: anyone can see non-deleted products
CREATE POLICY "products_public_read"
  ON public.products FOR SELECT
  USING (status != 'deleted');

-- Admin: can see ALL products including pending/deleted
CREATE POLICY "products_admin_read"
  ON public.products FOR SELECT
  USING (public.is_admin());

-- Authenticated + non-banned users can list products
CREATE POLICY "products_auth_insert"
  ON public.products FOR INSERT
  WITH CHECK (auth.uid() = seller_id AND public.is_not_banned());

-- Sellers can update their own products
CREATE POLICY "products_seller_update"
  ON public.products FOR UPDATE
  USING (auth.uid() = seller_id);

-- Sellers can soft-delete their own products
CREATE POLICY "products_seller_delete"
  ON public.products FOR DELETE
  USING (auth.uid() = seller_id);

-- Admins can update any product (approve/reject/remove)
CREATE POLICY "products_admin_update"
  ON public.products FOR UPDATE
  USING (public.is_admin());

-- Admins can delete any product
CREATE POLICY "products_admin_delete"
  ON public.products FOR DELETE
  USING (public.is_admin());

-- SERVICES ──────────────────────────────────────────
-- Public: anyone can see non-deleted services
CREATE POLICY "services_public_read"
  ON public.services FOR SELECT
  USING (status != 'deleted');

-- Admin: can see ALL services including pending/deleted
CREATE POLICY "services_admin_read"
  ON public.services FOR SELECT
  USING (public.is_admin());

-- Authenticated + non-banned users can offer services
CREATE POLICY "services_auth_insert"
  ON public.services FOR INSERT
  WITH CHECK (auth.uid() = provider_id AND public.is_not_banned());

-- Providers can update their own services
CREATE POLICY "services_provider_update"
  ON public.services FOR UPDATE
  USING (auth.uid() = provider_id);

-- Providers can soft-delete their own services
CREATE POLICY "services_provider_delete"
  ON public.services FOR DELETE
  USING (auth.uid() = provider_id);

-- Admins can update any service
CREATE POLICY "services_admin_update"
  ON public.services FOR UPDATE
  USING (public.is_admin());

-- Admins can delete any service
CREATE POLICY "services_admin_delete"
  ON public.services FOR DELETE
  USING (public.is_admin());

-- ── 4. Schema safety (idempotent column/constraint additions) ─

-- Ensure is_banned exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned boolean DEFAULT false NOT NULL;

-- Ensure in_stock exists
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true NOT NULL;

-- Products status must include 'pending'
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_status_check
  CHECK (status IN ('pending', 'active', 'sold', 'paused', 'deleted'));

-- Services status must include 'pending'
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_status_check;
ALTER TABLE public.services
  ADD CONSTRAINT services_status_check
  CHECK (status IN ('pending', 'active', 'paused', 'deleted'));

-- ── 5. Performance indexes ────────────────────────────────────

CREATE INDEX IF NOT EXISTS products_status_created_idx
  ON public.products (status, created_at DESC);

CREATE INDEX IF NOT EXISTS services_status_created_idx
  ON public.services (status, created_at DESC);

CREATE INDEX IF NOT EXISTS products_seller_id_idx
  ON public.products (seller_id);

CREATE INDEX IF NOT EXISTS services_provider_id_idx
  ON public.services (provider_id);

-- ── 6. Ensure admin role ──────────────────────────────────────

UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'gengenesix@gmail.com'
)
AND role != 'admin';

-- ── 7. Diagnostics — run these to verify ─────────────────────
/*
-- Check admin profile:
SELECT id, email, name, role, is_verified, is_banned
FROM public.profiles WHERE email = 'gengenesix@gmail.com';

-- Check all RLS policies are active:
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'products', 'services')
ORDER BY tablename, policyname;

-- Check is_admin works (run as authenticated user):
SELECT public.is_admin();

-- Count data:
SELECT 'profiles' AS tbl, COUNT(*) FROM public.profiles
UNION ALL
SELECT 'products', COUNT(*) FROM public.products WHERE status != 'deleted'
UNION ALL
SELECT 'services', COUNT(*) FROM public.services WHERE status != 'deleted'
UNION ALL
SELECT 'pending_products', COUNT(*) FROM public.products WHERE status = 'pending'
UNION ALL
SELECT 'pending_services', COUNT(*) FROM public.services WHERE status = 'pending';
*/
