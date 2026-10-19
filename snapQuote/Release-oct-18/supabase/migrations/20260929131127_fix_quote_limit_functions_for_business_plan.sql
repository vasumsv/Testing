/*
  # Fix quote limit functions to handle 'business' plan

  The trigger function quotes_enforce_limit(), the RPC check_studio_quote_allowed(),
  and increment_studio_quote_count() all had CASE statements that didn't include
  'business', causing it to fall to ELSE 10 (trial limit). This blocked
  Business-plan users from saving/downloading quotes after 10 quotes.
*/

-- 1. Fix quotes_enforce_limit trigger function
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
    WHEN 'business' THEN NULL
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

-- 2. Fix check_studio_quote_allowed
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
    WHEN 'business' THEN NULL
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

-- 3. Fix increment_studio_quote_count
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
    WHEN 'business' THEN NULL
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

GRANT EXECUTE ON FUNCTION increment_studio_quote_count(uuid, uuid) TO authenticated;
