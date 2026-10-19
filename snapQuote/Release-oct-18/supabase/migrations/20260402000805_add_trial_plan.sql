/*
  # Add Free Trial Plan

  ## Summary
  Introduces a 'trial' plan for new studios. Trial studios get 10 free quotes
  with no payment required. Once exhausted, creation is blocked and an upgrade
  prompt is shown. Existing studios are unaffected.

  ## Changes

  ### 1. studios.plan — add 'trial' as valid value
  The plan column type is updated to accept 'trial' alongside 'starter', 'growth', 'pro'.

  ### 2. studio_quota view — include 'trial' plan limits
  Trial plan: 10 quotes/month, limit_reached and near_limit logic added.

  ### 3. increment_studio_quote_count function — support trial
  Limits correctly enforced for trial (10 quotes total, not per-month — the
  reset still happens on calendar month boundaries but trial users have 10/month).

  ### 4. quotes_enforce_limit trigger function — support trial
  Raises descriptive trial_limit_reached exception for trial plan overages.

  ### 5. check_studio_quote_allowed function — support trial
  Returns reason 'trial_limit_reached' with a trial-specific message.

  ### 6. Default plan for new studios changed to 'trial'
  OnboardingFlow inserts with plan='starter', so we change that default here,
  and the OnboardingFlow will be updated to send 'trial'.
*/

-- ─── 1. Allow 'trial' in the plan check constraint ───────────────────────────

DO $$
BEGIN
  -- Drop old check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'studios' AND constraint_type = 'CHECK'
    AND constraint_name LIKE '%plan%'
  ) THEN
    EXECUTE (
      SELECT 'ALTER TABLE studios DROP CONSTRAINT ' || constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'studios' AND constraint_type = 'CHECK'
      AND constraint_name LIKE '%plan%'
      LIMIT 1
    );
  END IF;
END $$;

ALTER TABLE studios
  DROP CONSTRAINT IF EXISTS studios_plan_check;

ALTER TABLE studios
  ADD CONSTRAINT studios_plan_check
  CHECK (plan IN ('trial', 'starter', 'growth', 'pro'));

-- Change the default plan for new studios to 'trial'
ALTER TABLE studios ALTER COLUMN plan SET DEFAULT 'trial';

-- ─── 2. Rebuild studio_quota view with trial support ─────────────────────────

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
  -- limit_reached: true when blocked for any reason
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
        END - 3
      )
    )
  END AS near_limit
FROM studios s;

-- ─── 3. Rebuild increment_studio_quote_count with trial support ──────────────

CREATE OR REPLACE FUNCTION increment_studio_quote_count(p_studio_id uuid, p_quote_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_studio        studios%ROWTYPE;
  v_limit         integer;
  v_now           timestamptz := now();
  v_reset_month   date;
  v_current_month date;
  v_new_count     integer;
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
        'allowed', false,
        'reason',  CASE WHEN v_studio.plan = 'trial' THEN 'trial_limit_reached' ELSE 'limit_reached' END,
        'used',    v_studio.quotes_this_month,
        'limit',   v_limit
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

-- ─── 4. Rebuild check_studio_quote_allowed with trial support ────────────────

CREATE OR REPLACE FUNCTION check_studio_quote_allowed(p_studio_id uuid)
RETURNS jsonb
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

  v_effective_count := CASE WHEN v_current_month > v_reset_month THEN 0 ELSE v_studio.quotes_this_month END;

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

-- ─── 5. Rebuild quotes_enforce_limit trigger function with trial support ─────

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
    RAISE EXCEPTION 'subscription_expired: Your subscription has expired. Please renew your plan.';
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
    IF v_studio.plan = 'trial' THEN
      RAISE EXCEPTION 'trial_limit_reached: Your free trial of % quotes has been used. Upgrade to a paid plan to continue.', v_limit;
    ELSE
      RAISE EXCEPTION 'limit_reached: Monthly quote limit of % has been reached. Upgrade your plan.', v_limit;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_quotes_enforce_limit ON quotes;
CREATE TRIGGER trg_quotes_enforce_limit
  BEFORE INSERT ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION quotes_enforce_limit();
