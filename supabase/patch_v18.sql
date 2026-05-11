-- patch_v18: university email verification
-- Run once after patch_v17

-- Add university email fields to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS university_email text,
  ADD COLUMN IF NOT EXISTS university_email_verified boolean NOT NULL DEFAULT false;

-- OTP storage — accessed only via service role key
CREATE TABLE IF NOT EXISTS email_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  otp_hash text NOT NULL,  -- SHA-256 of the 6-digit code
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  used boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otps_user_idx ON email_otps(user_id);

-- Block all client-side access; only service role bypasses RLS
ALTER TABLE email_otps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "no client access" ON email_otps;
CREATE POLICY "no client access" ON email_otps USING (false) WITH CHECK (false);
