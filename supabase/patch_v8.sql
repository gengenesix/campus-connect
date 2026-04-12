-- ============================================================
-- patch_v8: Admin role enforcement, pending approval, in_stock
-- Run in Supabase SQL Editor (safe to re-run)
-- ============================================================

-- 1. Grant admin role to gengenesix@gmail.com (existing user fix)
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'gengenesix@gmail.com'
);

-- 2. Update new-user trigger to auto-assign admin for that email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN NEW.email = 'gengenesix@gmail.com' THEN 'admin'::text ELSE 'buyer'::text END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- 3. Extend products status to include 'pending'
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS products_status_check;
ALTER TABLE public.products
  ADD CONSTRAINT products_status_check
  CHECK (status IN ('pending', 'active', 'sold', 'paused', 'deleted'));

-- 4. Extend services status to include 'pending'
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_status_check;
ALTER TABLE public.services
  ADD CONSTRAINT services_status_check
  CHECK (status IN ('pending', 'active', 'paused', 'deleted'));

-- 5. Add in_stock boolean column to products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS in_stock boolean DEFAULT true NOT NULL;

-- 6. RLS policy: allow admins to update any product/service status
-- (existing RLS allows owners to update their own rows; admins need broader access)
DROP POLICY IF EXISTS "Admins can update any product" ON public.products;
CREATE POLICY "Admins can update any product"
  ON public.products FOR UPDATE
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update any service" ON public.services;
CREATE POLICY "Admins can update any service"
  ON public.services FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- Run supabase/patch_v7.sql first if you haven't already.
-- ============================================================
