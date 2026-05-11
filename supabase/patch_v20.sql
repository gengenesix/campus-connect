-- patch_v20: composite indexes for 100k+ query performance
-- Run once after patch_v19
-- Uses CONCURRENTLY so existing traffic is not blocked during index creation

-- ─── PRODUCTS ────────────────────────────────────────────────────────────────

-- Main listing query: filter by university + status, sort by newest
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_uni_status_created_idx
  ON products (university_id, status, created_at DESC);

-- Seller's own listings
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_seller_status_idx
  ON products (seller_id, status);

-- Views counter bump (by id — already has PK, but explicit for partial scans)
CREATE INDEX CONCURRENTLY IF NOT EXISTS products_status_views_idx
  ON products (status, views DESC);

-- ─── SERVICES ────────────────────────────────────────────────────────────────

-- Main service listing query: filter by university + status, sort by newest
CREATE INDEX CONCURRENTLY IF NOT EXISTS services_uni_status_created_idx
  ON services (university_id, status, created_at DESC);

-- Provider's own services
CREATE INDEX CONCURRENTLY IF NOT EXISTS services_provider_status_idx
  ON services (provider_id, status);

-- Popular services by booking count
CREATE INDEX CONCURRENTLY IF NOT EXISTS services_status_bookings_idx
  ON services (status, total_bookings DESC);

-- ─── MESSAGES ────────────────────────────────────────────────────────────────

-- Inbox: all messages to a user, newest first
CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_receiver_created_idx
  ON messages (receiver_id, created_at DESC);

-- Outbox: all messages from a user, newest first
CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_sender_created_idx
  ON messages (sender_id, created_at DESC);

-- Unread count per receiver
CREATE INDEX CONCURRENTLY IF NOT EXISTS messages_receiver_read_idx
  ON messages (receiver_id, is_read) WHERE is_read = false;

-- ─── NOTIFICATIONS ───────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS notifications_user_read_created_idx
  ON notifications (user_id, is_read, created_at DESC);

-- ─── SAVED LISTINGS ──────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS saved_listings_user_created_idx
  ON saved_listings (user_id, created_at DESC);

-- ─── REVIEWS ─────────────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS reviews_product_created_idx
  ON reviews (product_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS reviews_service_created_idx
  ON reviews (service_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS reviews_reviewee_created_idx
  ON reviews (reviewee_id, created_at DESC);

-- ─── BOOKINGS ────────────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_client_status_idx
  ON bookings (client_id, status, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS bookings_provider_status_idx
  ON bookings (provider_id, status, created_at DESC);

-- ─── REPORTS ─────────────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS reports_status_created_idx
  ON reports (status, created_at DESC);

-- ─── SUBSCRIPTIONS ───────────────────────────────────────────────────────────

CREATE INDEX CONCURRENTLY IF NOT EXISTS subscriptions_user_status_idx
  ON subscriptions (user_id, status);

-- ─── PROFILES ────────────────────────────────────────────────────────────────

-- University member lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS profiles_university_idx
  ON profiles (university_id);
