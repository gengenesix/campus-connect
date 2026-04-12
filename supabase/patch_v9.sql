-- ============================================================
-- Campus Connect — patch_v9.sql
-- Applied via MCP on 2026-04-12. Documents all DB changes.
-- ✅ Already applied — do NOT re-run.
-- ============================================================

-- Patches v7 and v8 were applied via Supabase MCP:
--   patch_v7: FTS search_vector columns + GIN indexes + performance indexes
--   patch_v8: pending status, in_stock column, admin RLS policies, Realtime

-- This file documents additional RLS clarifications applied:

-- Products: sellers can soft-delete their own (update status = 'deleted')
-- (covered by existing "Sellers can update own products" policy)

-- Messages: product_id now passed on first message from product page
-- (no schema change needed — product_id column already exists)

-- Admin: gengenesix@gmail.com has role = 'admin' set via UPDATE

-- Summary of columns added by v7+v8:
--   products.search_vector  tsvector GENERATED ALWAYS (FTS)
--   products.in_stock        boolean DEFAULT true NOT NULL
--   services.search_vector  tsvector GENERATED ALWAYS (FTS)
-- Status constraints now include 'pending':
--   products.status IN ('pending','active','sold','paused','deleted')
--   services.status IN ('pending','active','paused','deleted')
