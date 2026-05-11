-- ============================================================
-- patch_v17.sql — Phase 7: Wishlist, Multi-Image, Reports
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. SAVED LISTINGS (wishlist)
-- ============================================================
CREATE TABLE IF NOT EXISTS saved_listings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  service_id  UUID REFERENCES services(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (product_id IS NOT NULL AND service_id IS NULL) OR
    (product_id IS NULL AND service_id IS NOT NULL)
  )
);

-- Unique constraints (one save per item per user)
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_unique_product ON saved_listings (user_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_unique_service ON saved_listings (user_id, service_id) WHERE service_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_saved_user ON saved_listings (user_id, created_at DESC);

ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_select"  ON saved_listings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "saved_insert"  ON saved_listings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_delete"  ON saved_listings FOR DELETE USING (user_id = auth.uid());


-- 2. PRODUCT IMAGES (multi-image support)
-- ============================================================
CREATE TABLE IF NOT EXISTS product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  display_order INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images (product_id, display_order ASC);

ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_images_select" ON product_images FOR SELECT USING (true);
CREATE POLICY "product_images_insert" ON product_images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM products WHERE id = product_id AND seller_id = auth.uid()
  ));
CREATE POLICY "product_images_delete" ON product_images FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM products WHERE id = product_id AND seller_id = auth.uid()
  ));


-- 3. SERVICE IMAGES (multi-image support)
-- ============================================================
CREATE TABLE IF NOT EXISTS service_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  display_order INT  NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_images_service ON service_images (service_id, display_order ASC);

ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_images_select" ON service_images FOR SELECT USING (true);
CREATE POLICY "service_images_insert" ON service_images FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM services WHERE id = service_id AND provider_id = auth.uid()
  ));
CREATE POLICY "service_images_delete" ON service_images FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM services WHERE id = service_id AND provider_id = auth.uid()
  ));


-- 4. REPORTS (flag listings / users)
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id       UUID REFERENCES products(id)  ON DELETE CASCADE,
  service_id       UUID REFERENCES services(id)  ON DELETE CASCADE,
  reported_user_id UUID REFERENCES profiles(id)  ON DELETE CASCADE,
  reason           TEXT NOT NULL CHECK (reason IN (
    'spam', 'inappropriate', 'fraud', 'wrong_price', 'already_sold', 'other'
  )),
  details          TEXT,
  status           TEXT NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'reviewed', 'dismissed', 'actioned'
  )),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON reports (reporter_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON reports FOR INSERT
  WITH CHECK (
    reporter_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned)
  );
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (reporter_id = auth.uid());
-- Admins view all reports via service role key (bypasses RLS)
