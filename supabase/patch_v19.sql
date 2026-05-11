-- patch_v19: seller subscription (GHS 20/month via Paystack)
-- Run once after patch_v18

-- Track subscription expiry on the profile (fast read without join)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_expires_at timestamptz;

-- Payment history + pending state
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'active', 'failed')),
  paystack_ref text UNIQUE,
  amount integer NOT NULL DEFAULT 2000,  -- pesewas (GHS 20)
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_paystack_ref_idx ON subscriptions(paystack_ref);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can read their own subscription history
DROP POLICY IF EXISTS "users see own subscriptions" ON subscriptions;
CREATE POLICY "users see own subscriptions" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
