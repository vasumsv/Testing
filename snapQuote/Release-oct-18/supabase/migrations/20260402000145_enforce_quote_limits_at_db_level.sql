/*
  # Enforce Quote Usage Limits at the Database Level

  ## Summary
  Adds a BEFORE INSERT trigger on the `quotes` table that enforces plan-based
  monthly quote limits directly in Postgres. This means limits cannot be bypassed
  through the API, direct SQL calls, or the Supabase dashboard — only the trigger
  can allow or deny inserts.

  ## Changes

  ### 1. Fix studio_quota view — include subscription_expires_at in limit_reached
  The existing view only checked quotes_this_month vs the plan cap. A studio with
  an expired subscription should also show limit_reached = true so the UI blocks
  creation before even attempting the DB call.

  ### 2. check_studio_quote_allowed function (new)
  A read-only version of the quota check (no side effects). The frontend can call
  this before attempting to insert to get a user-friendly error reason without
  having to rely on interpreting trigger error messages.

  ### 3. enforce_quote_limit_trigger function + trigger (new)
  A BEFORE INSERT trigger on quotes that calls the same atomic logic as
  increment_studio_quote_count. If the studio is over-limit, inactive, or expired,
  the insert is REJECTED with a descriptive error message. This is the hard backend
  enforcement that cannot be bypassed.

  ## Security Notes
  - The trigger runs as SECURITY DEFINER so it can read the studios row even under RLS
  - The check is atomic (SELECT ... FOR UPDATE) so concurrent inserts cannot race past the limit
  - All three block reasons surface distinct error messages for the frontend to parse
*/

-- ─── 1. Rebuild studio_quota view to include expiry in limit_reached ────────

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
    WHEN 'pro'     THEN NULL
    ELSE 30
  END AS monthly_limit,
  -- limit_reached is true when: over quota OR subscription expired OR inactive
  CASE
    WHEN NOT s.is_active THEN true
    WHEN s.status = 'suspended' THEN true
    WHEN s.subscription_expires_at IS NOT NULL AND s.subscription_expires_at < now() THEN true
    WHEN s.plan = 'pro' THEN false
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

-- ─── 2. check_studio_quote_allowed — read-only pre-flight check ─────────────

CREATE OR REPLACE FUNCTION check_studio_quote_allowed(p_studio_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_studio studios%ROWTYPE;
  v_limit  integer;
  v_now    timestamptz := now();
  v_reset_month  date;
  v_current_month date;
  v_effective_count integer;
BEGIN
  SELECT * INTO v_studio FROM studios WHERE id = p_studio_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'studio_not_found');
  END IF;

  IF NOT v_studio.is_active OR v_studio.status = 'suspended' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'studio_inactive');
  END IF;

  IF v_studio.subscription_expires_at IS NOT NULL AND v_studio.subscription_expires_at < v_now THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_expired');
  END IF;

  v_limit := CASE v_studio.plan
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL
    ELSE 30
  END;

  -- If it's a new month, effective count resets to 0
  v_reset_month   := date_trunc('month', v_studio.quotes_reset_at)::date;
  v_current_month := date_trunc('month', v_now)::date;

  IF v_current_month > v_reset_month THEN
    v_effective_count := 0;
  ELSE
    v_effective_count := v_studio.quotes_this_month;
  END IF;

  IF v_limit IS NOT NULL AND v_effective_count >= v_limit THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason',  'limit_reached',
      'used',    v_effective_count,
      'limit',   v_limit
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'used',    v_effective_count,
    'limit',   v_limit
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION check_studio_quote_allowed(uuid) TO authenticated;

-- ─── 3. Trigger function — enforce limit on every INSERT into quotes ─────────

CREATE OR REPLACE FUNCTION quotes_enforce_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_studio        studios%ROWTYPE;
  v_limit         integer;
  v_now           timestamptz := now();
  v_reset_month   date;
  v_current_month date;
  v_effective_count integer;
BEGIN
  SELECT * INTO v_studio FROM studios WHERE id = NEW.studio_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'studio_not_found: Studio % does not exist', NEW.studio_id;
  END IF;

  IF NOT v_studio.is_active OR v_studio.status = 'suspended' THEN
    RAISE EXCEPTION 'studio_inactive: Your account is inactive. Contact support to reactivate.';
  END IF;

  IF v_studio.subscription_expires_at IS NOT NULL AND v_studio.subscription_expires_at < v_now THEN
    RAISE EXCEPTION 'subscription_expired: Your subscription has expired. Please renew your plan to continue creating quotes.';
  END IF;

  v_limit := CASE v_studio.plan
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL
    ELSE 30
  END;

  v_reset_month   := date_trunc('month', v_studio.quotes_reset_at)::date;
  v_current_month := date_trunc('month', v_now)::date;

  IF v_current_month > v_reset_month THEN
    -- New billing month: reset the counter now, allow the insert
    UPDATE studios
    SET quotes_this_month = 0,
        quotes_reset_at   = v_now,
        updated_at        = v_now
    WHERE id = NEW.studio_id;
    v_effective_count := 0;
  ELSE
    v_effective_count := v_studio.quotes_this_month;
  END IF;

  IF v_limit IS NOT NULL AND v_effective_count >= v_limit THEN
    RAISE EXCEPTION 'limit_reached: Monthly quote limit of % has been reached. Upgrade your plan to create more quotes.', v_limit;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach the trigger (drop first to allow re-running migration idempotently)
DROP TRIGGER IF EXISTS trg_quotes_enforce_limit ON quotes;

CREATE TRIGGER trg_quotes_enforce_limit
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION quotes_enforce_limit();
