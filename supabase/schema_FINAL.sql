-- =============================================================================
-- Campus Connect — DEFINITIVE SCHEMA v2 (May 2026)
-- Ghana's National Student Marketplace — All 43 Universities
-- =============================================================================
--
-- HOW TO USE (fresh database):
--   1. Supabase Dashboard → Settings → Database → "Reset database" (wipes everything)
--      OR: Supabase Dashboard → SQL Editor → run this file on an empty project
--   2. Paste this ENTIRE file into the SQL Editor and click RUN
--   3. Create storage buckets (instructions at the bottom)
--   4. Sign up with your account, then run the super-admin INSERT (bottom of file)
--
-- WHAT THIS REPLACES:
--   schema.sql + patch_v4 through patch_v20 — all merged into this single file.
--   Do NOT run any of the old patch files after running this.
--
-- VERIFIED AGAINST: All API routes and components as of May 11, 2026
-- =============================================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- =============================================================================
-- SECTION 1 — SHARED TRIGGER FUNCTION (used by multiple tables)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;


-- =============================================================================
-- SECTION 2 — UNIVERSITIES (43 Ghana institutions)
-- =============================================================================
CREATE TABLE universities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name            TEXT NOT NULL,
  short_name      TEXT NOT NULL,
  region          TEXT NOT NULL,
  city            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('public', 'private', 'technical')),
  website         TEXT,
  established     INT,
  logo_url        TEXT,
  primary_color   TEXT DEFAULT '#1B5E20',
  secondary_color TEXT DEFAULT '#FFD700',
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_universities_slug   ON universities (slug);
CREATE INDEX idx_universities_type   ON universities (type);
CREATE INDEX idx_universities_region ON universities (region);

-- Seed all 43 Ghana universities
INSERT INTO universities (slug, name, short_name, region, city, type, website, established) VALUES
-- Public Universities
('ug',               'University of Ghana',                                                                   'UG',       'Greater Accra', 'Legon, Accra',     'public',    'ug.edu.gh',               1948),
('knust',            'Kwame Nkrumah University of Science and Technology',                                    'KNUST',    'Ashanti',       'Kumasi',           'public',    'knust.edu.gh',            1951),
('ucc',              'University of Cape Coast',                                                              'UCC',      'Central',       'Cape Coast',       'public',    'ucc.edu.gh',              1962),
('uds',              'University for Development Studies',                                                    'UDS',      'Northern',      'Tamale',           'public',    'uds.edu.gh',              1992),
('uew',              'University of Education, Winneba',                                                      'UEW',      'Central',       'Winneba',          'public',    'uew.edu.gh',              1992),
('umat',             'University of Mines and Technology',                                                    'UMaT',     'Western',       'Tarkwa',           'public',    'umat.edu.gh',             2004),
('uhas',             'University of Health and Allied Sciences',                                              'UHAS',     'Volta',         'Ho',               'public',    'uhas.edu.gh',             2012),
('uenr',             'University of Energy and Natural Resources',                                            'UENR',     'Bono',          'Sunyani',          'public',    'uenr.edu.gh',             2013),
('uesd',             'University of Environment and Sustainable Development',                                 'UESD',     'Eastern',       'Somanya',          'public',    'uesd.edu.gh',             2019),
('upsa',             'University of Professional Studies, Accra',                                             'UPSA',     'Greater Accra', 'Accra',            'public',    'upsa.edu.gh',             1965),
('aamusted',         'Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development',    'AAMUSTED', 'Ashanti',       'Kumasi',           'public',    'aamusted.edu.gh',         2020),
('cstutas',          'C.K. Tedam University of Technology and Applied Sciences',                              'CKT-UTAS', 'Upper East',    'Navrongo',         'public',    'cktsutas.edu.gh',         2020),
('gimpa',            'Ghana Institute of Management and Public Administration',                                'GIMPA',    'Greater Accra', 'Greenhill, Accra', 'public',    'gimpa.edu.gh',            1961),
('sdd-ubids',        'SD Dombo University of Business and Integrated Development Studies',                    'SDD-UBIDS','Upper West',    'Wa',               'public',    'ubids.edu.gh',            2020),
-- Technical Universities
('accra-tu',         'Accra Technical University',                                                            'ATU',      'Greater Accra', 'Accra',            'technical', 'atu.edu.gh',              1949),
('kumasi-tu',        'Kumasi Technical University',                                                           'KsTU',     'Ashanti',       'Kumasi',           'technical', 'kstu.edu.gh',             1954),
('cape-coast-tu',    'Cape Coast Technical University',                                                       'CCTU',     'Central',       'Cape Coast',       'technical', 'cctu.edu.gh',             1984),
('takoradi-tu',      'Takoradi Technical University',                                                         'TTU',      'Western',       'Takoradi',         'technical', 'ttu.edu.gh',              1954),
('ho-tu',            'Ho Technical University',                                                               'HTU',      'Volta',         'Ho',               'technical', 'htu.edu.gh',              1968),
('koforidua-tu',     'Koforidua Technical University',                                                        'KTU',      'Eastern',       'Koforidua',        'technical', 'ktu.edu.gh',              1997),
('sunyani-tu',       'Sunyani Technical University',                                                          'STU',      'Bono',          'Sunyani',          'technical', 'stu.edu.gh',              1963),
('wa-tu',            'Wa Technical University',                                                               'WaTU',     'Upper West',    'Wa',               'technical', 'wtu.edu.gh',              2016),
('bolgatanga-tu',    'Bolgatanga Technical University',                                                       'BTU',      'Upper East',    'Bolgatanga',       'technical', 'btu.edu.gh',              2016),
('tamale-tu',        'Tamale Technical University',                                                           'TaTU',     'Northern',      'Tamale',           'technical', 'tatu.edu.gh',             1951),
-- Private Universities
('ashesi',           'Ashesi University',                                                                     'Ashesi',   'Eastern',       'Berekuso',         'private',   'ashesi.edu.gh',           2002),
('central-uni',      'Central University',                                                                    'CU',       'Greater Accra', 'Miotso, Accra',    'private',   'central.edu.gh',          1988),
('pentvars',         'Pentecost University',                                                                  'PU',       'Greater Accra', 'Accra',            'private',   'pentvars.edu.gh',         2003),
('valley-view',      'Valley View University',                                                                'VVU',      'Eastern',       'Techiman',         'private',   'vvu.edu.gh',              1997),
('wiuc',             'Wisconsin International University College',                                            'WIUC',     'Greater Accra', 'Accra',            'private',   'wiuc-ghana.edu.gh',       2000),
('regent',           'Regent University College of Science and Technology',                                   'Regent',   'Greater Accra', 'Accra',            'private',   'regent.edu.gh',           2003),
('bluecrest',        'BlueCrest University College',                                                          'BCUC',     'Greater Accra', 'Accra',            'private',   'bluecrestcollege.com',    2003),
('methodist-uni',    'Methodist University',                                                                  'MU',       'Greater Accra', 'Accra',            'private',   'mu.edu.gh',               2000),
('presbyterian-uni', 'Presbyterian University College',                                                       'PUC',      'Eastern',       'Abetifi',          'private',   'presbyuniversity.edu.gh', 2003),
('catholic-uni',     'Catholic University College of Ghana',                                                  'CUCG',     'Bono',          'Fiapre, Sunyani',  'private',   'cug.edu.gh',              2003),
('gctu',             'Ghana Communication Technology University',                                             'GCTU',     'Greater Accra', 'Accra',            'private',   'gctu.edu.gh',             2012),
('iug',              'Islamic University College Ghana',                                                      'IUG',      'Greater Accra', 'Accra',            'private',   'iug.edu.gh',              1997),
('academic-city',    'Academic City University College',                                                      'ACity',    'Greater Accra', 'Haatso, Accra',    'private',   'academiccity.edu.gh',     2016),
('gij',              'Ghana Institute of Journalism',                                                         'GIJ',      'Greater Accra', 'Accra',            'private',   'gij.edu.gh',              1959),
('lancaster-ghana',  'Lancaster University Ghana',                                                            'LU Ghana', 'Greater Accra', 'Accra',            'private',   'lancaster.edu.gh',        2013),
('garden-city',      'Garden City University College',                                                        'GCUC',     'Ashanti',       'Kumasi',           'private',   'gcuc.edu.gh',             2003),
('gbuc',             'Ghana Baptist University College',                                                      'GBUC',     'Ashanti',       'Kumasi',           'private',   'gbuc.edu.gh',             2003),
('aucc',             'Africa University College of Communications',                                           'AUCC',     'Greater Accra', 'Accra',            'private',   'aucc.edu.gh',             2008),
('knutsford',        'Knutsford University College',                                                          'KUC',      'Greater Accra', 'Accra',            'private',   'knutsford.edu.gh',        2010)
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- SECTION 3 — PROFILES
-- Includes ALL columns from schema + patches v18 (email verification)
-- + patch v19 (subscription_expires_at)
-- =============================================================================
CREATE TABLE profiles (
  id                         UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                      TEXT NOT NULL,
  name                       TEXT,
  university_id              UUID REFERENCES universities(id) ON DELETE SET NULL,
  department                 TEXT,
  course                     TEXT,
  class_year                 TEXT,
  hostel                     TEXT,
  faculty                    TEXT,
  programme                  TEXT,
  student_id                 TEXT,
  phone                      TEXT,
  bio                        TEXT,
  avatar_url                 TEXT,
  role                       TEXT NOT NULL DEFAULT 'buyer'
                               CHECK (role IN ('buyer', 'seller', 'provider', 'admin')),
  rating                     NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews              INT NOT NULL DEFAULT 0,
  is_verified                BOOLEAN NOT NULL DEFAULT false,
  is_banned                  BOOLEAN NOT NULL DEFAULT false,
  -- Web Push (phase 11)
  push_sub                   JSONB,
  -- University email verification (patch v18)
  university_email           TEXT,
  university_email_verified  BOOLEAN NOT NULL DEFAULT false,
  -- Seller subscription (patch v19)
  subscription_expires_at    TIMESTAMPTZ,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_university ON profiles (university_id);
CREATE INDEX idx_profiles_role       ON profiles (role);
CREATE INDEX idx_profiles_email      ON profiles (email);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- =============================================================================
-- SECTION 4 — ADMINS (no hardcoded emails — DB-driven admin access)
-- =============================================================================
CREATE TABLE admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  -- NULL university_id = super admin (access to all universities)
  role          TEXT NOT NULL DEFAULT 'university_admin'
                  CHECK (role IN ('super_admin', 'university_admin', 'moderator')),
  granted_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (user_id, university_id)
);

CREATE INDEX idx_admins_user ON admins (user_id);
CREATE INDEX idx_admins_uni  ON admins (university_id);


-- =============================================================================
-- SECTION 5 — PRODUCTS
-- =============================================================================
CREATE TABLE products (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  price         NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category      TEXT NOT NULL,
  condition     TEXT NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair')),
  image_url     TEXT,
  whatsapp      TEXT,
  views         INT NOT NULL DEFAULT 0,
  in_stock      BOOLEAN NOT NULL DEFAULT true,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'active', 'deleted')),
  search_vector TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) STORED,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Basic indexes
CREATE INDEX idx_products_seller     ON products (seller_id);
CREATE INDEX idx_products_university ON products (university_id);
CREATE INDEX idx_products_status     ON products (status);
CREATE INDEX idx_products_search     ON products USING GIN (search_vector);
-- Composite indexes for common query patterns (Section 6.1)
CREATE INDEX idx_products_uni_status_created ON products (university_id, status, created_at DESC);
CREATE INDEX idx_products_uni_active         ON products (university_id, status, created_at DESC) WHERE status = 'active';
CREATE INDEX idx_products_seller_status      ON products (seller_id, status);
CREATE INDEX idx_products_status_views       ON products (status, views DESC);

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- View counter RPC (fire-and-forget, called client-side)
CREATE OR REPLACE FUNCTION increment_product_views(product_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE products SET views = views + 1 WHERE id = product_id AND status = 'active';
$$;


-- =============================================================================
-- SECTION 6 — PRODUCT IMAGES (multi-image support, up to 5 per listing)
-- =============================================================================
CREATE TABLE product_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id    UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_product_images_product ON product_images (product_id, display_order ASC);


-- =============================================================================
-- SECTION 7 — SERVICES
-- =============================================================================
CREATE TABLE services (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id  UUID REFERENCES universities(id) ON DELETE SET NULL,
  name           TEXT NOT NULL,
  description    TEXT NOT NULL DEFAULT '',
  category       TEXT NOT NULL,
  rate           TEXT NOT NULL,
  availability   TEXT NOT NULL,
  image_url      TEXT,
  whatsapp       TEXT,
  response_time  TEXT,
  total_bookings INT NOT NULL DEFAULT 0,
  status         TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'active', 'deleted')),
  search_vector  TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) STORED,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Basic indexes
CREATE INDEX idx_services_provider    ON services (provider_id);
CREATE INDEX idx_services_university  ON services (university_id);
CREATE INDEX idx_services_status      ON services (status);
CREATE INDEX idx_services_search      ON services USING GIN (search_vector);
-- Composite indexes
CREATE INDEX idx_services_uni_status_created ON services (university_id, status, created_at DESC);
CREATE INDEX idx_services_uni_active         ON services (university_id, status, total_bookings DESC) WHERE status = 'active';
CREATE INDEX idx_services_provider_status    ON services (provider_id, status);
CREATE INDEX idx_services_status_bookings    ON services (status, total_bookings DESC);

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- SECTION 8 — SERVICE IMAGES
-- =============================================================================
CREATE TABLE service_images (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_service_images_service ON service_images (service_id, display_order ASC);


-- =============================================================================
-- SECTION 9 — MESSAGES
-- =============================================================================
CREATE TABLE messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  product_id  UUID REFERENCES products(id) ON DELETE SET NULL,
  service_id  UUID REFERENCES services(id) ON DELETE SET NULL,
  is_read     BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_message CHECK (sender_id <> receiver_id)
);

-- Composite indexes for conversation queries
CREATE INDEX idx_messages_receiver_created ON messages (receiver_id, created_at DESC);
CREATE INDEX idx_messages_sender_created   ON messages (sender_id,   created_at DESC);
CREATE INDEX idx_messages_unread           ON messages (receiver_id, is_read) WHERE is_read = false;
CREATE INDEX idx_messages_thread           ON messages (
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- Required for Realtime to broadcast full row data on INSERT
ALTER TABLE messages REPLICA IDENTITY FULL;

-- Conversations list RPC
-- Returns column names that match the messages page client code exactly:
--   r.partner_id, r.last_message, r.last_time, r.unread_count
CREATE OR REPLACE FUNCTION get_conversations(p_user_id UUID)
RETURNS TABLE (
  partner_id   UUID,
  last_message TEXT,
  last_time    TIMESTAMPTZ,
  unread_count BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH convos AS (
    SELECT
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END AS partner_id,
      content,
      created_at,
      CASE WHEN receiver_id = p_user_id AND NOT is_read THEN 1 ELSE 0 END AS is_unread
    FROM messages
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
  ),
  latest AS (
    SELECT DISTINCT ON (partner_id)
      partner_id, content, created_at
    FROM convos
    ORDER BY partner_id, created_at DESC
  )
  SELECT
    l.partner_id,
    l.content       AS last_message,
    l.created_at    AS last_time,
    COALESCE(SUM(c.is_unread), 0) AS unread_count
  FROM latest l
  LEFT JOIN convos c ON c.partner_id = l.partner_id
  GROUP BY l.partner_id, l.content, l.created_at
  ORDER BY l.created_at DESC;
$$;


-- =============================================================================
-- SECTION 10 — BOOKINGS
-- =============================================================================
CREATE TABLE bookings (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id    UUID NOT NULL REFERENCES services(id)  ON DELETE CASCADE,
  client_id     UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  provider_id   UUID NOT NULL REFERENCES profiles(id)  ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes         TEXT,
  scheduled_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_client           ON bookings (client_id,   status, created_at DESC);
CREATE INDEX idx_bookings_provider         ON bookings (provider_id, status, created_at DESC);
CREATE INDEX idx_bookings_service          ON bookings (service_id);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment service booking count when confirmed
CREATE OR REPLACE FUNCTION on_booking_status_change()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') THEN
    UPDATE services SET total_bookings = total_bookings + 1 WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_status_change
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION on_booking_status_change();


-- =============================================================================
-- SECTION 11 — REVIEWS
-- =============================================================================
CREATE TABLE reviews (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id  UUID REFERENCES products(id)  ON DELETE SET NULL,
  service_id  UUID REFERENCES services(id)  ON DELETE SET NULL,
  rating      INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment     TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_review CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX idx_reviews_reviewee        ON reviews (reviewee_id);
CREATE INDEX idx_reviews_product_created ON reviews (product_id, created_at DESC);
CREATE INDEX idx_reviews_service_created ON reviews (service_id, created_at DESC);

-- Auto-update reviewer's profile rating when a review is written
CREATE OR REPLACE FUNCTION on_review_written()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles
  SET
    rating        = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION on_review_written();


-- =============================================================================
-- SECTION 12 — NOTIFICATIONS
-- =============================================================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
    'message',
    'listing_approved',
    'listing_rejected',
    'new_review',
    'booking_request',    -- provider receives when client books
    'booking_confirmed',  -- client receives when provider confirms
    'system'
  )),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL DEFAULT '',
  data       JSONB,
  read       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user   ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id, read, created_at DESC);

ALTER TABLE notifications REPLICA IDENTITY FULL;

-- RPC used by the notifications API
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid() AND read = false;
$$;


-- =============================================================================
-- SECTION 13 — SAVED LISTINGS (wishlist)
-- =============================================================================
CREATE TABLE saved_listings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (product_id IS NOT NULL AND service_id IS NULL) OR
    (product_id IS NULL     AND service_id IS NOT NULL)
  )
);

-- Partial unique indexes: one save per item per user
CREATE UNIQUE INDEX idx_saved_unique_product ON saved_listings (user_id, product_id) WHERE product_id IS NOT NULL;
CREATE UNIQUE INDEX idx_saved_unique_service ON saved_listings (user_id, service_id) WHERE service_id IS NOT NULL;
CREATE INDEX idx_saved_user_created          ON saved_listings (user_id, created_at DESC);


-- =============================================================================
-- SECTION 14 — REPORTS (flag listings or users)
-- =============================================================================
CREATE TABLE reports (
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

CREATE INDEX idx_reports_status   ON reports (status, created_at DESC);
CREATE INDEX idx_reports_reporter ON reports (reporter_id);


-- =============================================================================
-- SECTION 15 — EMAIL OTPs (university email verification)
-- Only accessible via service role key — all client access blocked by RLS
-- =============================================================================
CREATE TABLE email_otps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email      TEXT NOT NULL,
  otp_hash   TEXT NOT NULL,  -- SHA-256 of the 6-digit OTP code
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '15 minutes'),
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_otps_user ON email_otps (user_id);


-- =============================================================================
-- SECTION 16 — SUBSCRIPTIONS (Paystack seller subscription — GHS 20/month)
-- =============================================================================
CREATE TABLE subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'active', 'failed')),
  paystack_ref TEXT UNIQUE,
  amount       INTEGER NOT NULL DEFAULT 2000,  -- pesewas (GHS 20)
  starts_at    TIMESTAMPTZ,
  ends_at      TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_subscriptions_user   ON subscriptions (user_id);
CREATE INDEX idx_subscriptions_ref    ON subscriptions (paystack_ref);
CREATE INDEX idx_subscriptions_status ON subscriptions (user_id, status);


-- =============================================================================
-- SECTION 17 — ROW LEVEL SECURITY
-- =============================================================================

-- Profiles: public read, self-write
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Universities: public read, super-admin write
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "universities_select" ON universities FOR SELECT USING (true);
CREATE POLICY "universities_write"  ON universities FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Admins: authenticated read, super-admin write
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_select" ON admins FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write"  ON admins FOR ALL USING (
  EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'super_admin')
);

-- Products: active = public, pending = seller only, admins see all
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products_select" ON products FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid() OR
         EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "products_insert" ON products FOR INSERT
  WITH CHECK (auth.uid() = seller_id AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));
CREATE POLICY "products_update" ON products FOR UPDATE
  USING (seller_id = auth.uid() OR EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "products_delete" ON products FOR DELETE USING (seller_id = auth.uid());

-- Product images
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product_images_select" ON product_images FOR SELECT USING (true);
CREATE POLICY "product_images_insert" ON product_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM products WHERE id = product_id AND seller_id = auth.uid()));
CREATE POLICY "product_images_delete" ON product_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM products WHERE id = product_id AND seller_id = auth.uid()));

-- Services: not-deleted = public, deleted = provider only, admins see all
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services_select" ON services FOR SELECT
  USING (status <> 'deleted' OR provider_id = auth.uid() OR
         EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "services_insert" ON services FOR INSERT
  WITH CHECK (auth.uid() = provider_id AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));
CREATE POLICY "services_update" ON services FOR UPDATE
  USING (provider_id = auth.uid() OR EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()));
CREATE POLICY "services_delete" ON services FOR DELETE USING (provider_id = auth.uid());

-- Service images
ALTER TABLE service_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_images_select" ON service_images FOR SELECT USING (true);
CREATE POLICY "service_images_insert" ON service_images FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM services WHERE id = service_id AND provider_id = auth.uid()));
CREATE POLICY "service_images_delete" ON service_images FOR DELETE
  USING (EXISTS (SELECT 1 FROM services WHERE id = service_id AND provider_id = auth.uid()));

-- Messages: only parties in conversation
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (receiver_id = auth.uid());

-- Bookings: only client and provider
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select" ON bookings FOR SELECT
  USING (client_id = auth.uid() OR provider_id = auth.uid());
CREATE POLICY "bookings_insert" ON bookings FOR INSERT
  WITH CHECK (client_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));
CREATE POLICY "bookings_update" ON bookings FOR UPDATE
  USING (client_id = auth.uid() OR provider_id = auth.uid());

-- Reviews: public read, authenticated write (no self-review enforced by CHECK constraint)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));

-- Notifications: own data only
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);

-- Saved listings: own data only
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saved_select" ON saved_listings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "saved_insert" ON saved_listings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "saved_delete" ON saved_listings FOR DELETE USING (user_id = auth.uid());

-- Reports: insert by anyone non-banned; read own reports; admins use service role
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reports_insert" ON reports FOR INSERT
  WITH CHECK (reporter_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (reporter_id = auth.uid());

-- Email OTPs: NO client access (service role key bypasses RLS)
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_otps_no_access" ON email_otps USING (false) WITH CHECK (false);

-- Subscriptions: users read own; insert/update via service role (Paystack webhook)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_select" ON subscriptions FOR SELECT USING (user_id = auth.uid());


-- =============================================================================
-- SECTION 18 — REALTIME PUBLICATION
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'messages'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE messages; END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN ALTER PUBLICATION supabase_realtime ADD TABLE notifications; END IF;
END;
$$;


-- =============================================================================
-- SECTION 19 — HELPER FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION is_university_admin(uni_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
      AND (university_id = uni_id OR role = 'super_admin')
  );
$$;


-- =============================================================================
-- DONE. READ THESE NEXT STEPS BEFORE CLOSING THE SQL EDITOR.
-- =============================================================================
--
-- ── STEP 1: Storage Buckets ───────────────────────────────────────────────────
-- Go to: Supabase Dashboard → Storage → New bucket
--
--   Bucket name : avatars
--   Public      : YES
--   Max size    : 5 MB
--   MIME types  : image/jpeg, image/png, image/webp, image/gif, image/avif
--
--   Bucket name : product-images
--   Public      : YES
--   Max size    : 10 MB
--   MIME types  : image/jpeg, image/png, image/webp, image/avif
--
-- ── STEP 2: Storage RLS Policies (Dashboard → Storage → Policies) ─────────────
-- For EACH bucket (avatars, product-images), create 4 policies:
--
--   Policy 1 — SELECT (read): allow all
--     Definition: true
--
--   Policy 2 — INSERT (upload): only the owner's folder
--     Definition: (storage.foldername(name))[1] = auth.uid()::text
--
--   Policy 3 — UPDATE: same as INSERT
--     Definition: (storage.foldername(name))[1] = auth.uid()::text
--
--   Policy 4 — DELETE: same as INSERT
--     Definition: (storage.foldername(name))[1] = auth.uid()::text
--
-- ── STEP 3: Connection Pooler ─────────────────────────────────────────────────
-- Dashboard → Settings → Database → "Connection pooling"
-- Copy the "Transaction mode" connection string (port 6543)
-- Add it to Vercel as: DATABASE_URL
-- This is REQUIRED for 100k+ concurrent users.
--
-- ── STEP 4: Promote yourself to Super Admin ───────────────────────────────────
-- 1. Sign up via the app (creates your profile row)
-- 2. Come back here and run THIS (replace with your real email):
--
--    INSERT INTO admins (user_id, university_id, role)
--    SELECT id, NULL, 'super_admin'
--    FROM profiles
--    WHERE email = 'your@email.com';
--
-- ── STEP 5: Supabase Realtime ─────────────────────────────────────────────────
-- Dashboard → Database → Replication
-- Ensure "messages" and "notifications" are enabled for realtime.
--
-- ── STEP 6: Run Meilisearch seed ─────────────────────────────────────────────
-- After app is deployed: npx tsx scripts/seed-meilisearch.ts
--
-- =============================================================================
