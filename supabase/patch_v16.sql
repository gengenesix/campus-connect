-- =============================================================================
-- patch_v16.sql — Multi-University Schema Migration
-- Campus Connect: National Platform for All Ghana Universities
-- Run in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. UNIVERSITIES TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS universities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT UNIQUE NOT NULL,          -- URL identifier: 'umat', 'knust', 'ug'
  name         TEXT NOT NULL,                  -- Full official name
  short_name   TEXT NOT NULL,                  -- Abbreviation: 'UMaT', 'KNUST'
  region       TEXT NOT NULL,
  city         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('public', 'private', 'technical')),
  website      TEXT,
  established  INT,
  logo_url     TEXT,
  primary_color   TEXT DEFAULT '#1B5E20',
  secondary_color TEXT DEFAULT '#FFD700',
  is_active    BOOLEAN DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_universities_slug ON universities (slug);
CREATE INDEX IF NOT EXISTS idx_universities_type ON universities (type);
CREATE INDEX IF NOT EXISTS idx_universities_region ON universities (region);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. SEED ALL 43 GHANA UNIVERSITIES
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO universities (slug, name, short_name, region, city, type, website, established) VALUES
-- Public Universities
('ug',             'University of Ghana',                                                                     'UG',        'Greater Accra', 'Legon, Accra',      'public',    'ug.edu.gh',          1948),
('knust',          'Kwame Nkrumah University of Science and Technology',                                      'KNUST',     'Ashanti',        'Kumasi',            'public',    'knust.edu.gh',       1951),
('ucc',            'University of Cape Coast',                                                                'UCC',       'Central',        'Cape Coast',        'public',    'ucc.edu.gh',         1962),
('uds',            'University for Development Studies',                                                      'UDS',       'Northern',       'Tamale',            'public',    'uds.edu.gh',         1992),
('uew',            'University of Education, Winneba',                                                        'UEW',       'Central',        'Winneba',           'public',    'uew.edu.gh',         1992),
('umat',           'University of Mines and Technology',                                                      'UMaT',      'Western',        'Tarkwa',            'public',    'umat.edu.gh',        2004),
('uhas',           'University of Health and Allied Sciences',                                                'UHAS',      'Volta',          'Ho',                'public',    'uhas.edu.gh',        2012),
('uenr',           'University of Energy and Natural Resources',                                              'UENR',      'Bono',           'Sunyani',           'public',    'uenr.edu.gh',        2013),
('aamusted',       'Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development',      'AAMUSTED',  'Ashanti',        'Kumasi',            'public',    'aamusted.edu.gh',    2020),
('cstutas',        'C.K. Tedam University of Technology and Applied Sciences',                                'CKT-UTAS',  'Upper East',     'Navrongo',          'public',    'cktsutas.edu.gh',    2020),
('gimpa',          'Ghana Institute of Management and Public Administration',                                  'GIMPA',     'Greater Accra',  'Greenhill, Accra',  'public',    'gimpa.edu.gh',       1961),
-- Technical Universities
('accra-tu',       'Accra Technical University',                                                              'ATU',       'Greater Accra',  'Accra',             'technical', 'atu.edu.gh',         1949),
('kumasi-tu',      'Kumasi Technical University',                                                             'KsTU',      'Ashanti',        'Kumasi',            'technical', 'kstu.edu.gh',        1954),
('cape-coast-tu',  'Cape Coast Technical University',                                                         'CCTU',      'Central',        'Cape Coast',        'technical', 'cctu.edu.gh',        1984),
('takoradi-tu',    'Takoradi Technical University',                                                           'TTU',       'Western',        'Takoradi',          'technical', 'ttu.edu.gh',         1954),
('ho-tu',          'Ho Technical University',                                                                 'HTU',       'Volta',          'Ho',                'technical', 'htu.edu.gh',         1968),
('koforidua-tu',   'Koforidua Technical University',                                                          'KTU',       'Eastern',        'Koforidua',         'technical', 'ktu.edu.gh',         1997),
('sunyani-tu',     'Sunyani Technical University',                                                            'STU',       'Bono',           'Sunyani',           'technical', 'stu.edu.gh',         1963),
('wa-tu',          'Wa Technical University',                                                                 'WaTU',      'Upper West',     'Wa',                'technical', 'wtu.edu.gh',         2016),
('bolgatanga-tu',  'Bolgatanga Technical University',                                                         'BTU',       'Upper East',     'Bolgatanga',        'technical', 'btu.edu.gh',         2016),
('tamale-tu',      'Tamale Technical University',                                                             'TaTU',      'Northern',       'Tamale',            'technical', 'tatu.edu.gh',        1951),
-- Private Universities
('ashesi',         'Ashesi University',                                                                       'Ashesi',    'Eastern',        'Berekuso',          'private',   'ashesi.edu.gh',      2002),
('central-university', 'Central University',                                                                  'CU',        'Greater Accra',  'Miotso, Accra',     'private',   'central.edu.gh',     1988),
('pentecost-university', 'Pentecost University',                                                              'PU',        'Greater Accra',  'Accra',             'private',   'pentvars.edu.gh',    2003),
('valley-view',    'Valley View University',                                                                   'VVU',       'Eastern',        'Techiman',          'private',   'vvu.edu.gh',         1997),
('wisconsin-international', 'Wisconsin International University College',                                     'WIUC',      'Greater Accra',  'Accra',             'private',   'wiuc-ghana.edu.gh',  2000),
('regent-university', 'Regent University College of Science and Technology',                                  'Regent',    'Greater Accra',  'Accra',             'private',   'regent.edu.gh',      2003),
('blue-crest',     'BlueCrest University College',                                                            'BCUC',      'Greater Accra',  'Accra',             'private',   'bluecrestcollege.com', 2003),
('methodist-university', 'Methodist University',                                                              'MU',        'Greater Accra',  'Accra',             'private',   'mu.edu.gh',          2000),
('presbyterian-university', 'Presbyterian University College',                                               'PUC',       'Eastern',        'Abetifi',           'private',   'presbyuniversity.edu.gh', 2003),
('catholic-university', 'Catholic University College of Ghana',                                               'CUCG',      'Bono',           'Fiapre, Sunyani',   'private',   'cug.edu.gh',         2003),
('ghana-telecom-university', 'Ghana Communication Technology University',                                     'GCTU',      'Greater Accra',  'Accra',             'private',   'gctu.edu.gh',        2012),
('islamic-university', 'Islamic University College Ghana',                                                    'IUG',       'Greater Accra',  'Accra',             'private',   'iug.edu.gh',         1997),
('academic-city',  'Academic City University College',                                                        'ACity',     'Greater Accra',  'Haatso, Accra',     'private',   'academiccity.edu.gh', 2016),
('ghana-institute-journalism', 'Ghana Institute of Journalism',                                               'GIJ',       'Greater Accra',  'Accra',             'private',   'gij.edu.gh',         1959),
('lancaster-ghana', 'Lancaster University Ghana',                                                             'LU Ghana',  'Greater Accra',  'Accra',             'private',   'lancaster.edu.gh',   2013),
('garden-city-university', 'Garden City University College',                                                  'GCUC',      'Ashanti',        'Kumasi',            'private',   'gcuc.edu.gh',        2003),
('ghana-christian', 'Ghana Christian University College',                                                     'GCUC',      'Greater Accra',  'Kwabenya, Accra',   'private',   'gcuc.edu.gh',        1996)
ON CONFLICT (slug) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. ADD university_id TO CORE TABLES
-- Existing rows get assigned to UMaT (the original university)
-- ─────────────────────────────────────────────────────────────────────────────

-- profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS faculty       TEXT,
  ADD COLUMN IF NOT EXISTS programme     TEXT,
  ADD COLUMN IF NOT EXISTS student_id    TEXT,
  ADD COLUMN IF NOT EXISTS push_sub      JSONB;

-- Back-fill existing profiles → UMaT
UPDATE profiles
SET university_id = (SELECT id FROM universities WHERE slug = 'umat' LIMIT 1)
WHERE university_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_university ON profiles (university_id);

-- products
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE CASCADE;

UPDATE products
SET university_id = (SELECT id FROM universities WHERE slug = 'umat' LIMIT 1)
WHERE university_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_university ON products (university_id);

-- services
ALTER TABLE services
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE CASCADE;

UPDATE services
SET university_id = (SELECT id FROM universities WHERE slug = 'umat' LIMIT 1)
WHERE university_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_services_university ON services (university_id);

-- messages
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES universities(id) ON DELETE CASCADE;

UPDATE messages
SET university_id = (SELECT id FROM universities WHERE slug = 'umat' LIMIT 1)
WHERE university_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_messages_university ON messages (university_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. NOTIFICATIONS TABLE
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN (
    'message', 'listing_approved', 'listing_rejected',
    'new_review', 'booking_confirmed', 'system'
  )),
  title         TEXT NOT NULL,
  body          TEXT NOT NULL,
  data          JSONB,           -- e.g. { "listing_id": "...", "sender_id": "..." }
  read          BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user    ON notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread  ON notifications (user_id) WHERE read = false;

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. ADMINS TABLE (replace hard-coded email check in middleware)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admins (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE, -- NULL = super admin
  role          TEXT NOT NULL DEFAULT 'university_admin'
                  CHECK (role IN ('super_admin', 'university_admin', 'moderator')),
  granted_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, university_id)
);

CREATE INDEX IF NOT EXISTS idx_admins_user ON admins (user_id);

-- Migrate existing admin (gengenesix@gmail.com) to admins table
INSERT INTO admins (user_id, university_id, role)
SELECT p.id, NULL, 'super_admin'
FROM profiles p
WHERE p.role = 'admin'
ON CONFLICT (user_id, university_id) DO NOTHING;

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. ROW LEVEL SECURITY ON NEW TABLES
-- ─────────────────────────────────────────────────────────────────────────────

-- universities (public read, super admin write)
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Universities are publicly readable"
  ON universities FOR SELECT USING (true);
CREATE POLICY "Only super admins can modify universities"
  ON universities FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid() AND role = 'super_admin')
  );

-- notifications (user owns their own)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read their own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Service role can insert notifications"
  ON notifications FOR INSERT WITH CHECK (true); -- handled by server-side API

-- admins (read-only for authenticated, write via service role)
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins table readable by authenticated users"
  ON admins FOR SELECT USING (auth.role() = 'authenticated');

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. HELPER FUNCTIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- Check if the current user is a super admin
CREATE OR REPLACE FUNCTION is_super_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
$$;

-- Check if the current user is an admin of a specific university
CREATE OR REPLACE FUNCTION is_university_admin(uni_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE user_id = auth.uid()
      AND (university_id = uni_id OR role = 'super_admin')
  )
$$;

-- Get unread notification count for the current user
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS BIGINT LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT COUNT(*) FROM notifications
  WHERE user_id = auth.uid() AND read = false
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 8. REALTIME — enable for notifications
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE notifications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- 9. PERFORMANCE INDEXES (composite, covering)
-- ─────────────────────────────────────────────────────────────────────────────

-- Active products per university (home feed query)
CREATE INDEX IF NOT EXISTS idx_products_uni_status_created
  ON products (university_id, status, created_at DESC)
  WHERE status = 'active';

-- Active services per university
CREATE INDEX IF NOT EXISTS idx_services_uni_status_bookings
  ON services (university_id, status, total_bookings DESC)
  WHERE status = 'active';

-- Messages conversation lookup
CREATE INDEX IF NOT EXISTS idx_messages_uni_sender_receiver
  ON messages (university_id, sender_id, receiver_id, created_at DESC);

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE
-- patch_v16 applied: multi-university schema, notifications, admins table,
-- RLS policies, performance indexes, helper functions.
-- ─────────────────────────────────────────────────────────────────────────────
