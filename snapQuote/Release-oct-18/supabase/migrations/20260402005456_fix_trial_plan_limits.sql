/*
  # Fix trial plan limits across all DB objects

  ## Problem
  The `trial` plan was missing from every CASE statement in:
  - studio_quota view (monthly_limit, limit_reached, near_limit)
  - check_studio_quote_allowed function
  - quotes_enforce_limit trigger function
  - increment_studio_quote_count function

  All fell through to ELSE 30 instead of the correct limit of 10.

  ## Fix
  Add `WHEN 'trial' THEN 10` to every CASE statement in all four objects.
  The near_limit threshold for trial is >= 8 (80% of 10).
*/

-- ─── 1. Rebuild studio_quota view with trial support ─────────────────────────

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
    WHEN 'trial'   THEN 10
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL
    ELSE 10
  END AS monthly_limit,
  CASE
    WHEN NOT s.is_active THEN true
    WHEN s.status = 'suspended' THEN true
    WHEN s.subscription_expires_at IS NOT NULL AND s.subscription_expires_at < now() THEN true
    WHEN s.plan = 'pro' THEN false
    ELSE (
      s.quotes_this_month >= CASE s.plan
        WHEN 'trial'   THEN 10
        WHEN 'starter' THEN 30
        WHEN 'growth'  THEN 100
        ELSE 10
      END
    )
  END AS limit_reached,
  CASE s.plan
    WHEN 'pro' THEN false
    ELSE (
      s.quotes_this_month >= GREATEST(
        CASE s.plan
          WHEN 'trial'   THEN 10
          WHEN 'starter' THEN 30
          WHEN 'growth'  THEN 100
          ELSE 10
        END * 0.8,
        CASE s.plan
          WHEN 'trial'   THEN 10
          WHEN 'starter' THEN 30
          WHEN 'growth'  THEN 100
          ELSE 10
        END - 5
      )
    )
  END AS near_limit
FROM studios s;

-- ─── 2. Fix check_studio_quote_allowed ───────────────────────────────────────

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
    WHEN 'trial'   THEN 10
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL
    ELSE 10
  END;

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
      'reason',  CASE WHEN v_studio.plan = 'trial' THEN 'trial_limit_reached' ELSE 'limit_reached' END,
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

GRANT EXECUTE ON FUNCTION check_studio_quote_allowed(uuid) TO authenticated;

-- ─── 3. Fix quotes_enforce_limit trigger function ────────────────────────────

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
    WHEN 'trial'   THEN 10
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL
    ELSE 10
  END;

  v_reset_month   := date_trunc('month', v_studio.quotes_reset_at)::date;
  v_current_month := date_trunc('month', v_now)::date;

  IF v_current_month > v_reset_month THEN
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
    RAISE EXCEPTION 'trial_limit_reached: Your free trial of % quotes has been reached. Upgrade to a paid plan to continue creating quotes.', v_limit;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quotes_enforce_limit ON quotes;
CREATE TRIGGER trg_quotes_enforce_limit
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION quotes_enforce_limit();

-- ─── 4. Fix increment_studio_quote_count ─────────────────────────────────────

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

  IF NOT v_studio.is_active OR v_studio.status = 'suspended' THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'studio_inactive');
  END IF;

  IF v_studio.subscription_expires_at IS NOT NULL AND v_studio.subscription_expires_at < v_now THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'subscription_expired');
  END IF;

  v_limit := CASE v_studio.plan
    WHEN 'trial'   THEN 10
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL
    ELSE 10
  END;

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
    IF v_limit IS NOT NULL AND v_studio.quotes_this_month >= v_limit THEN
      RETURN jsonb_build_object(
        'allowed',  false,
        'reason',   CASE WHEN v_studio.plan = 'trial' THEN 'trial_limit_reached' ELSE 'limit_reached' END,
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

  INSERT INTO quote_usage_log(studio_id, quote_id, created_at)
  VALUES (p_studio_id, p_quote_id, v_now);

  RETURN jsonb_build_object(
    'allowed', true,
    'used',    v_new_count,
    'limit',   v_limit
  );
END;
$$;
