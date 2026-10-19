/*
  # Subscription & Usage Control System

  ## Overview
  Implements plan-based quote limits with real-time usage tracking and admin controls.

  ## Plan Definitions
  - starter: 30 quotes/month — $19/mo
  - growth: 100 quotes/month — $49/mo
  - pro: Unlimited quotes — $99/mo

  ## Changes

  ### 1. studios table additions
  - `plan` column updated to support 'starter' | 'growth' | 'pro' (was starter/pro/agency)
  - `is_active` (boolean) — admin toggle to activate/deactivate a studio account
  - `subscription_expires_at` (timestamptz) — when the current plan period ends
  - `quotes_this_month` (integer) — running count of quotes created in the current billing month
  - `quotes_reset_at` (timestamptz) — timestamp of the last monthly counter reset

  ### 2. quote_usage_log table (new)
  Immutable append-only log of every quote creation event for auditing.
  - `id` (uuid PK)
  - `studio_id` (uuid FK → studios)
  - `quote_id` (uuid FK → quotes, nullable — in case quote is later deleted)
  - `created_at` (timestamptz)

  ### 3. plan_limits view
  Convenience view that exposes per-studio usage vs. limit.

  ### 4. RLS policies
  - Studios can only read their own usage data
  - Only service role / admin can update quota counters
  - quote_usage_log is insert-only for authenticated users (their own studio)

  ### 5. increment_studio_quote_count function
  Atomically increments `quotes_this_month`, resets if a new month has started,
  and logs to `quote_usage_log`. Returns whether the operation was allowed or blocked.
*/

-- ─── 1. Update studios table ────────────────────────────────────────────────

DO $$
BEGIN
  -- Add is_active column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE studios ADD COLUMN is_active boolean NOT NULL DEFAULT true;
  END IF;

  -- Add subscription_expires_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE studios ADD COLUMN subscription_expires_at timestamptz DEFAULT NULL;
  END IF;

  -- Add quotes_this_month counter
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'quotes_this_month'
  ) THEN
    ALTER TABLE studios ADD COLUMN quotes_this_month integer NOT NULL DEFAULT 0;
  END IF;

  -- Add quotes_reset_at to track when the counter was last reset
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'quotes_reset_at'
  ) THEN
    ALTER TABLE studios ADD COLUMN quotes_reset_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

-- Migrate old plan values to new plan names
UPDATE studios SET plan = 'growth' WHERE plan = 'agency';
-- 'starter' and 'pro' remain unchanged

-- ─── 2. quote_usage_log table ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS quote_usage_log (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  quote_id   uuid REFERENCES quotes(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_usage_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studios can view own usage log"
  ON quote_usage_log FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.studio_id = quote_usage_log.studio_id
    )
  );

CREATE POLICY "Studios can insert own usage log"
  ON quote_usage_log FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.studio_id = quote_usage_log.studio_id
    )
  );

-- Index for fast monthly lookups
CREATE INDEX IF NOT EXISTS idx_quote_usage_log_studio_created
  ON quote_usage_log(studio_id, created_at DESC);

-- ─── 3. plan_limits view ────────────────────────────────────────────────────

CREATE OR REPLACE VIEW studio_quota AS
SELECT
  s.id AS studio_id,
  s.plan,
  s.is_active,
  s.status,
  s.subscription_expires_at,
  s.quotes_this_month,
  s.quotes_reset_at,
  CASE s.plan
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL  -- NULL = unlimited
    ELSE 30
  END AS monthly_limit,
  CASE s.plan
    WHEN 'pro' THEN false
    ELSE (
      s.quotes_this_month >= CASE s.plan
        WHEN 'starter' THEN 30
        WHEN 'growth'  THEN 100
        ELSE 30
      END
    )
  END AS limit_reached,
  CASE s.plan
    WHEN 'pro' THEN false
    ELSE (
      s.quotes_this_month >= GREATEST(
        CASE s.plan WHEN 'starter' THEN 30 WHEN 'growth' THEN 100 ELSE 30 END * 0.8,
        CASE s.plan WHEN 'starter' THEN 30 WHEN 'growth' THEN 100 ELSE 30 END - 5
      )
    )
  END AS near_limit
FROM studios s;

-- ─── 4. Atomic increment function ───────────────────────────────────────────

CREATE OR REPLACE FUNCTION increment_studio_quote_count(p_studio_id uuid, p_quote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_studio       studios%ROWTYPE;
  v_limit        integer;
  v_now          timestamptz := now();
  v_reset_month  date;
  v_current_month date;
  v_new_count    integer;
BEGIN
  SELECT * INTO v_studio FROM studios WHERE id = p_studio_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'studio_not_found');
  END IF;

  -- Check studio is active
  IF NOT v_studio.is_active OR v_studio.status = 'suspended' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'studio_inactive');
  END IF;

  -- Check subscription expiry
  IF v_studio.subscription_expires_at IS NOT NULL AND v_studio.subscription_expires_at < v_now THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_expired');
  END IF;

  -- Determine plan limit (NULL = unlimited)
  v_limit := CASE v_studio.plan
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL
    ELSE 30
  END;

  -- Reset counter if we're in a new calendar month
  v_reset_month   := date_trunc('month', v_studio.quotes_reset_at)::date;
  v_current_month := date_trunc('month', v_now)::date;

  IF v_current_month > v_reset_month THEN
    v_new_count := 1;
    UPDATE studios
      SET quotes_this_month = 1,
          quotes_reset_at   = v_now,
          updated_at        = v_now
    WHERE id = p_studio_id;
  ELSE
    -- Check limit before incrementing
    IF v_limit IS NOT NULL AND v_studio.quotes_this_month >= v_limit THEN
      RETURN jsonb_build_object(
        'allowed',  false,
        'reason',   'limit_reached',
        'used',     v_studio.quotes_this_month,
        'limit',    v_limit
      );
    END IF;

    v_new_count := v_studio.quotes_this_month + 1;
    UPDATE studios
      SET quotes_this_month = v_new_count,
          updated_at        = v_now
    WHERE id = p_studio_id;
  END IF;

  -- Log the usage event
  INSERT INTO quote_usage_log(studio_id, quote_id, created_at)
  VALUES (p_studio_id, p_quote_id, v_now);

  RETURN jsonb_build_object(
    'allowed', true,
    'used',    v_new_count,
    'limit',   v_limit
  );
END;
$$;

-- ─── 5. Additional RLS for studios (read own quota fields) ──────────────────

-- Allow authenticated studio owners to read their own studio row
-- (policy may already exist, so use DO block to guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'studios' AND policyname = 'Studio owners can read own studio'
  ) THEN
    CREATE POLICY "Studio owners can read own studio"
      ON studios FOR SELECT
      TO authenticated
      USING (
        id IN (
          SELECT studio_id FROM profiles WHERE id = auth.uid()
        )
      );
  END IF;
END $$;
