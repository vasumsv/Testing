/*
  # Migrate to Free + SnapQuote Business Plans

  Replaces Starter/Growth/Pro with Free (trial) + SnapQuote Business.
  Legacy plans remain for historical records but are not selectable.
*/

-- 1. studios table: add 'business' to plan CHECK constraint
ALTER TABLE studios DROP CONSTRAINT IF EXISTS studios_plan_check;
ALTER TABLE studios ADD CONSTRAINT studios_plan_check
  CHECK (plan = ANY (ARRAY['trial', 'starter', 'growth', 'pro', 'business']));

-- 2. payments table: add 'business' to plan CHECK constraint
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_plan_check;
ALTER TABLE payments ADD CONSTRAINT payments_plan_check
  CHECK (plan IN ('starter', 'growth', 'pro', 'business'));

-- 3. Migrate existing active paid subscriptions to 'business'
UPDATE studios
SET plan = 'business', updated_at = now()
WHERE plan IN ('starter', 'growth', 'pro');

-- 4. Update upgrade_studio_plan RPC to accept p_expires_at and validate plan
CREATE OR REPLACE FUNCTION upgrade_studio_plan(
  p_studio_id     uuid,
  p_payment_id    text,
  p_order_id      text,
  p_plan          text,
  p_billing_cycle text,
  p_amount_paise  integer,
  p_expires_at    timestamptz DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expires_at   timestamptz;
BEGIN
  IF p_plan NOT IN ('business') THEN
    RETURN json_build_object('success', false, 'error', 'Invalid plan for new purchase');
  END IF;

  v_expires_at := COALESCE(p_expires_at,
    CASE WHEN p_billing_cycle = 'annual' THEN now() + '365 days'::interval ELSE now() + '30 days'::interval END);

  UPDATE studios
  SET
    plan                    = 'business',
    status                  = 'active',
    is_active               = true,
    subscription_expires_at = v_expires_at,
    quotes_this_month       = 0,
    quotes_reset_at         = date_trunc('month', now()),
    updated_at              = now()
  WHERE id = p_studio_id;

  UPDATE payments
  SET
    razorpay_payment_id = p_payment_id,
    status              = 'paid',
    updated_at          = now()
  WHERE razorpay_order_id = p_order_id
    AND studio_id         = p_studio_id;

  RETURN json_build_object('success', true, 'plan', 'business', 'expires_at', v_expires_at);
END;
$$;

-- Drop the old-arity version to avoid ambiguity
DROP FUNCTION IF EXISTS upgrade_studio_plan(uuid, text, text, text, text, integer) CASCADE;

GRANT EXECUTE ON FUNCTION upgrade_studio_plan(uuid, text, text, text, text, integer, timestamptz) TO authenticated;
