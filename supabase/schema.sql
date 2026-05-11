-- =============================================================================
-- Campus Connect — Complete Fresh Schema (REBUILD)
-- National Student Marketplace for All Ghana Universities (43+ institutions)
-- =============================================================================
-- Run instructions:
--   1. Supabase Dashboard → SQL Editor → New Query
--   2. Paste this entire file and run
--   3. Create storage buckets (see bottom of file)
--   4. Sign up, then promote yourself to super_admin (see bottom of file)
-- =============================================================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";


-- =============================================================================
-- 1. UNIVERSITIES
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
-- Public
('ug',                       'University of Ghana',                                                                    'UG',       'Greater Accra', 'Legon, Accra',     'public',    'ug.edu.gh',               1948),
('knust',                    'Kwame Nkrumah University of Science and Technology',                                     'KNUST',    'Ashanti',       'Kumasi',           'public',    'knust.edu.gh',            1951),
('ucc',                      'University of Cape Coast',                                                               'UCC',      'Central',       'Cape Coast',       'public',    'ucc.edu.gh',              1962),
('uds',                      'University for Development Studies',                                                     'UDS',      'Northern',      'Tamale',           'public',    'uds.edu.gh',              1992),
('uew',                      'University of Education, Winneba',                                                       'UEW',      'Central',       'Winneba',          'public',    'uew.edu.gh',              1992),
('umat',                     'University of Mines and Technology',                                                     'UMaT',     'Western',       'Tarkwa',           'public',    'umat.edu.gh',             2004),
('uhas',                     'University of Health and Allied Sciences',                                               'UHAS',     'Volta',         'Ho',               'public',    'uhas.edu.gh',             2012),
('uenr',                     'University of Energy and Natural Resources',                                             'UENR',     'Bono',          'Sunyani',          'public',    'uenr.edu.gh',             2013),
('aamusted',                 'Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development',     'AAMUSTED', 'Ashanti',       'Kumasi',           'public',    'aamusted.edu.gh',         2020),
('cstutas',                  'C.K. Tedam University of Technology and Applied Sciences',                               'CKT-UTAS', 'Upper East',    'Navrongo',         'public',    'cktsutas.edu.gh',         2020),
('gimpa',                    'Ghana Institute of Management and Public Administration',                                 'GIMPA',    'Greater Accra', 'Greenhill, Accra', 'public',    'gimpa.edu.gh',            1961),
-- Technical
('accra-tu',                 'Accra Technical University',                                                             'ATU',      'Greater Accra', 'Accra',            'technical', 'atu.edu.gh',              1949),
('kumasi-tu',                'Kumasi Technical University',                                                            'KsTU',     'Ashanti',       'Kumasi',           'technical', 'kstu.edu.gh',             1954),
('cape-coast-tu',            'Cape Coast Technical University',                                                        'CCTU',     'Central',       'Cape Coast',       'technical', 'cctu.edu.gh',             1984),
('takoradi-tu',              'Takoradi Technical University',                                                          'TTU',      'Western',       'Takoradi',         'technical', 'ttu.edu.gh',              1954),
('ho-tu',                    'Ho Technical University',                                                                'HTU',      'Volta',         'Ho',               'technical', 'htu.edu.gh',              1968),
('koforidua-tu',             'Koforidua Technical University',                                                         'KTU',      'Eastern',       'Koforidua',        'technical', 'ktu.edu.gh',              1997),
('sunyani-tu',               'Sunyani Technical University',                                                           'STU',      'Bono',          'Sunyani',          'technical', 'stu.edu.gh',              1963),
('wa-tu',                    'Wa Technical University',                                                                'WaTU',     'Upper West',    'Wa',               'technical', 'wtu.edu.gh',              2016),
('bolgatanga-tu',            'Bolgatanga Technical University',                                                        'BTU',      'Upper East',    'Bolgatanga',       'technical', 'btu.edu.gh',              2016),
('tamale-tu',                'Tamale Technical University',                                                            'TaTU',     'Northern',      'Tamale',           'technical', 'tatu.edu.gh',             1951),
-- Private
('ashesi',                   'Ashesi University',                                                                      'Ashesi',   'Eastern',       'Berekuso',         'private',   'ashesi.edu.gh',           2002),
('central-university',       'Central University',                                                                     'CU',       'Greater Accra', 'Miotso, Accra',    'private',   'central.edu.gh',          1988),
('pentecost-university',     'Pentecost University',                                                                   'PU',       'Greater Accra', 'Accra',            'private',   'pentvars.edu.gh',         2003),
('valley-view',              'Valley View University',                                                                  'VVU',      'Eastern',       'Techiman',         'private',   'vvu.edu.gh',              1997),
('wisconsin-international',  'Wisconsin International University College',                                             'WIUC',     'Greater Accra', 'Accra',            'private',   'wiuc-ghana.edu.gh',       2000),
('regent-university',        'Regent University College of Science and Technology',                                    'Regent',   'Greater Accra', 'Accra',            'private',   'regent.edu.gh',           2003),
('blue-crest',               'BlueCrest University College',                                                           'BCUC',     'Greater Accra', 'Accra',            'private',   'bluecrestcollege.com',    2003),
('methodist-university',     'Methodist University',                                                                   'MU',       'Greater Accra', 'Accra',            'private',   'mu.edu.gh',               2000),
('presbyterian-university',  'Presbyterian University College',                                                        'PUC',      'Eastern',       'Abetifi',          'private',   'presbyuniversity.edu.gh', 2003),
('catholic-university',      'Catholic University College of Ghana',                                                   'CUCG',     'Bono',          'Fiapre, Sunyani',  'private',   'cug.edu.gh',              2003),
('ghana-telecom-university', 'Ghana Communication Technology University',                                              'GCTU',     'Greater Accra', 'Accra',            'private',   'gctu.edu.gh',             2012),
('islamic-university',       'Islamic University College Ghana',                                                       'IUG',      'Greater Accra', 'Accra',            'private',   'iug.edu.gh',              1997),
('academic-city',            'Academic City University College',                                                       'ACity',    'Greater Accra', 'Haatso, Accra',    'private',   'academiccity.edu.gh',     2016),
('ghana-institute-journalism','Ghana Institute of Journalism',                                                         'GIJ',      'Greater Accra', 'Accra',            'private',   'gij.edu.gh',              1959),
('lancaster-ghana',          'Lancaster University Ghana',                                                             'LU Ghana', 'Greater Accra', 'Accra',            'private',   'lancaster.edu.gh',        2013),
('garden-city-university',   'Garden City University College',                                                         'GCUC',     'Ashanti',       'Kumasi',           'private',   'gcuc.edu.gh',             2003),
('ghana-christian',          'Ghana Christian University College',                                                     'GHCUC',    'Greater Accra', 'Kwabenya, Accra',  'private',   'gcuc.edu.gh',             1996)
ON CONFLICT (slug) DO NOTHING;


-- =============================================================================
-- 2. PROFILES (auto-created on sign-up via trigger)
-- =============================================================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email           TEXT NOT NULL,
  name            TEXT,
  university_id   UUID REFERENCES universities(id) ON DELETE SET NULL,
  department      TEXT,
  course          TEXT,
  class_year      TEXT,
  hostel          TEXT,
  faculty         TEXT,
  programme       TEXT,
  student_id      TEXT,
  phone           TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  role            TEXT NOT NULL DEFAULT 'buyer'
                    CHECK (role IN ('buyer', 'seller', 'provider', 'admin')),
  rating          NUMERIC(3,2) NOT NULL DEFAULT 0,
  total_reviews   INT NOT NULL DEFAULT 0,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  is_banned       BOOLEAN NOT NULL DEFAULT false,
  push_sub        JSONB,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_profiles_university ON profiles (university_id);
CREATE INDEX idx_profiles_role       ON profiles (role);

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

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
-- 3. ADMINS (source of truth for admin access — no hardcoded emails)
-- =============================================================================
CREATE TABLE admins (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
  -- NULL university_id = super admin (access to all universities)
  role            TEXT NOT NULL DEFAULT 'university_admin'
                    CHECK (role IN ('super_admin', 'university_admin', 'moderator')),
  granted_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE NULLS NOT DISTINCT (user_id, university_id)
);

CREATE INDEX idx_admins_user ON admins (user_id);
CREATE INDEX idx_admins_uni  ON admins (university_id);


-- =============================================================================
-- 4. PRODUCTS
-- =============================================================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  price           NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  category        TEXT NOT NULL,
  condition       TEXT NOT NULL CHECK (condition IN ('New', 'Like New', 'Good', 'Fair')),
  image_url       TEXT,
  whatsapp        TEXT,
  views           INT NOT NULL DEFAULT 0,
  in_stock        BOOLEAN NOT NULL DEFAULT true,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'deleted')),
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_seller      ON products (seller_id);
CREATE INDEX idx_products_university  ON products (university_id);
CREATE INDEX idx_products_status      ON products (status);
CREATE INDEX idx_products_search      ON products USING GIN (search_vector);
-- Hot path: university feed (most common query)
CREATE INDEX idx_products_uni_active  ON products (university_id, status, created_at DESC)
  WHERE status = 'active';

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- View counter RPC (called client-side, fire-and-forget)
CREATE OR REPLACE FUNCTION increment_product_views(product_id UUID)
RETURNS VOID LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE products SET views = views + 1 WHERE id = product_id AND status = 'active';
$$;


-- =============================================================================
-- 5. SERVICES
-- =============================================================================
CREATE TABLE services (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  category        TEXT NOT NULL,
  rate            TEXT NOT NULL,
  availability    TEXT NOT NULL,
  image_url       TEXT,
  whatsapp        TEXT,
  response_time   TEXT,
  total_bookings  INT NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'active', 'deleted')),
  search_vector   TSVECTOR GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) STORED,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_services_provider    ON services (provider_id);
CREATE INDEX idx_services_university  ON services (university_id);
CREATE INDEX idx_services_status      ON services (status);
CREATE INDEX idx_services_search      ON services USING GIN (search_vector);
CREATE INDEX idx_services_uni_active  ON services (university_id, status, total_bookings DESC)
  WHERE status = 'active';

CREATE TRIGGER services_updated_at
  BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- =============================================================================
-- 6. MESSAGES
-- =============================================================================
CREATE TABLE messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
  content         TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
  is_read         BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_message CHECK (sender_id <> receiver_id)
);

CREATE INDEX idx_messages_sender       ON messages (sender_id, created_at DESC);
CREATE INDEX idx_messages_receiver     ON messages (receiver_id, created_at DESC);
CREATE INDEX idx_messages_unread       ON messages (receiver_id) WHERE is_read = false;
-- Conversation thread lookup
CREATE INDEX idx_messages_thread       ON messages (
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

ALTER TABLE messages REPLICA IDENTITY FULL;

-- Conversations list RPC
CREATE OR REPLACE FUNCTION get_conversations(p_user_id UUID)
RETURNS TABLE (
  other_user_id   UUID,
  other_name      TEXT,
  other_avatar    TEXT,
  last_message    TEXT,
  last_at         TIMESTAMPTZ,
  unread_count    BIGINT
) LANGUAGE sql STABLE SECURITY DEFINER AS $$
  WITH convos AS (
    SELECT
      CASE WHEN sender_id = p_user_id THEN receiver_id ELSE sender_id END AS other_id,
      content,
      created_at,
      CASE WHEN receiver_id = p_user_id AND NOT is_read THEN 1 ELSE 0 END AS is_unread
    FROM messages
    WHERE sender_id = p_user_id OR receiver_id = p_user_id
  ),
  latest AS (
    SELECT DISTINCT ON (other_id) other_id, content, created_at
    FROM convos
    ORDER BY other_id, created_at DESC
  )
  SELECT
    l.other_id,
    p.name,
    p.avatar_url,
    l.content,
    l.created_at,
    COALESCE(SUM(c.is_unread), 0)
  FROM latest l
  JOIN profiles p ON p.id = l.other_id
  LEFT JOIN convos c ON c.other_id = l.other_id
  GROUP BY l.other_id, p.name, p.avatar_url, l.content, l.created_at
  ORDER BY l.created_at DESC;
$$;


-- =============================================================================
-- 7. BOOKINGS
-- =============================================================================
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  client_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  provider_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes           TEXT,
  scheduled_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bookings_client    ON bookings (client_id);
CREATE INDEX idx_bookings_provider  ON bookings (provider_id);
CREATE INDEX idx_bookings_service   ON bookings (service_id);

CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-increment service bookings count on confirm
CREATE OR REPLACE FUNCTION on_booking_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'confirmed' AND (OLD.status IS NULL OR OLD.status <> 'confirmed') THEN
    UPDATE services SET total_bookings = total_bookings + 1 WHERE id = NEW.service_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER booking_confirmed
  AFTER INSERT OR UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION on_booking_confirmed();


-- =============================================================================
-- 8. REVIEWS
-- =============================================================================
CREATE TABLE reviews (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reviewee_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id      UUID REFERENCES products(id) ON DELETE SET NULL,
  service_id      UUID REFERENCES services(id) ON DELETE SET NULL,
  rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT no_self_review CHECK (reviewer_id <> reviewee_id)
);

CREATE INDEX idx_reviews_reviewee ON reviews (reviewee_id);

-- Auto-update profile rating on new review
CREATE OR REPLACE FUNCTION on_review_written()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  UPDATE profiles
  SET
    rating = (SELECT ROUND(AVG(rating)::NUMERIC, 2) FROM reviews WHERE reviewee_id = NEW.reviewee_id),
    total_reviews = (SELECT COUNT(*) FROM reviews WHERE reviewee_id = NEW.reviewee_id)
  WHERE id = NEW.reviewee_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER review_inserted
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION on_review_written();


-- =============================================================================
-- 9. NOTIFICATIONS
-- =============================================================================
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id   UUID REFERENCES universities(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN (
    'message', 'listing_approved', 'listing_rejected',
    'new_review', 'booking_confirmed', 'system'
  )),
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  data            JSONB,
  read            BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_notifications_user   ON notifications (user_id, created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE read = false;

ALTER TABLE notifications REPLICA IDENTITY FULL;

CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid() AND read = false;
$$;


-- =============================================================================
-- 10. ROW LEVEL SECURITY
-- =============================================================================

-- Profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_select"  ON profiles FOR SELECT  USING (true);
CREATE POLICY "profiles_insert"  ON profiles FOR INSERT  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update"  ON profiles FOR UPDATE  USING (auth.uid() = id);

-- Universities
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "universities_select" ON universities FOR SELECT USING (true);
CREATE POLICY "universities_write"  ON universities FOR ALL USING (
  EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'super_admin')
);

-- Admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins_select" ON admins FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "admins_write"  ON admins FOR ALL USING (
  EXISTS (SELECT 1 FROM admins a WHERE a.user_id = auth.uid() AND a.role = 'super_admin')
);

-- Products
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

-- Services
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

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "messages_select" ON messages FOR SELECT
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());
CREATE POLICY "messages_insert" ON messages FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));
CREATE POLICY "messages_update" ON messages FOR UPDATE USING (receiver_id = auth.uid());

-- Bookings
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_select" ON bookings FOR SELECT
  USING (client_id = auth.uid() OR provider_id = auth.uid());
CREATE POLICY "bookings_insert" ON bookings FOR INSERT
  WITH CHECK (client_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));
CREATE POLICY "bookings_update" ON bookings FOR UPDATE
  USING (client_id = auth.uid() OR provider_id = auth.uid());

-- Reviews
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT
  WITH CHECK (reviewer_id = auth.uid() AND
              EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND NOT is_banned));

-- Notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (true);


-- =============================================================================
-- 11. REALTIME
-- =============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='products') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE products;
  END IF;
END;
$$;


-- =============================================================================
-- 12. HELPER FUNCTIONS
-- =============================================================================
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'super_admin');
$$;

CREATE OR REPLACE FUNCTION is_university_admin(uni_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid() AND (university_id = uni_id OR role = 'super_admin')
  );
$$;


-- =============================================================================
-- DONE — Next steps:
--
-- 1. Storage buckets (Dashboard → Storage → New bucket):
--    - Name: "avatars"   | Public: YES | Max size: 5MB  | Allowed: image/*
--    - Name: "listings"  | Public: YES | Max size: 10MB | Allowed: image/*
--
-- 2. After your first sign-up, run this to become super admin:
--    INSERT INTO admins (user_id, university_id, role)
--    SELECT id, NULL, 'super_admin' FROM profiles WHERE email = 'your@email.com';
--
-- 3. Storage RLS policies for avatars bucket (Dashboard → Storage → Policies):
--    - SELECT: true (public read)
--    - INSERT: (storage.foldername(name))[1] = auth.uid()::text
--    - UPDATE: (storage.foldername(name))[1] = auth.uid()::text
--    - DELETE: (storage.foldername(name))[1] = auth.uid()::text
-- =============================================================================
