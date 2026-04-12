-- ============================================================
-- Campus Connect — patch_v7.sql
-- Performance & Scalability: indexes + full-text search
-- Run in Supabase SQL Editor. Safe to re-run (IF NOT EXISTS).
-- ============================================================

-- ============================================================
-- FULL-TEXT SEARCH — products
-- Generated column so it updates automatically on INSERT/UPDATE.
-- GIN index makes search fast at any row count.
-- ============================================================
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(title, '') || ' ' || coalesce(description, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS products_search_idx
  ON public.products USING GIN(search_vector);

-- ============================================================
-- FULL-TEXT SEARCH — services
-- ============================================================
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(name, '') || ' ' || coalesce(description, '')
    )
  ) STORED;

CREATE INDEX IF NOT EXISTS services_search_idx
  ON public.services USING GIN(search_vector);

-- ============================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================

-- Products: composite (status, created_at) for the browse-page query
-- (status != 'deleted' ORDER BY created_at DESC)
CREATE INDEX IF NOT EXISTS products_status_created_idx
  ON public.products(status, created_at DESC);

-- Products: price index for price-sort queries
CREATE INDEX IF NOT EXISTS products_price_idx
  ON public.products(price);

-- Services: status for the browse-page query
CREATE INDEX IF NOT EXISTS services_status_idx
  ON public.services(status);

-- Services: total_bookings for popularity sorting
CREATE INDEX IF NOT EXISTS services_bookings_idx
  ON public.services(total_bookings DESC);

-- Messages: composite (receiver_id, is_read) for unread-count queries
-- Used by dashboard unread count + mark-as-read
CREATE INDEX IF NOT EXISTS messages_receiver_read_idx
  ON public.messages(receiver_id, is_read)
  WHERE is_read = false;

-- Bookings: status for filtering
CREATE INDEX IF NOT EXISTS bookings_status_idx
  ON public.bookings(status);

-- Bookings: composite (buyer_id, created_at) for dashboard
CREATE INDEX IF NOT EXISTS bookings_buyer_created_idx
  ON public.bookings(buyer_id, created_at DESC);
