/*
  # Payments Table and Plan Upgrade RPC

  ## Summary
  Adds a `payments` table to record all Razorpay payment transactions, and a
  `upgrade_studio_plan` function to atomically update a studio's plan, status,
  and subscription expiry after a successful payment.

  ## New Tables
  - `payments`
    - `id` (uuid, primary key)
    - `studio_id` (uuid FK → studios.id) – the studio that paid
    - `razorpay_order_id` (text) – the Razorpay order ID created server-side
    - `razorpay_payment_id` (text, nullable) – set after successful capture
    - `plan` (text) – 'starter' | 'growth' | 'pro'
    - `billing_cycle` (text) – 'monthly' | 'annual'
    - `amount` (integer) – amount in paise (INR smallest unit)
    - `currency` (text, default 'INR')
    - `status` (text) – 'created' | 'paid' | 'failed'
    - `created_at`, `updated_at` (timestamptz)

  ## New Functions
  - `upgrade_studio_plan(p_studio_id, p_payment_id, p_plan, p_billing_cycle, p_amount_paise)`
    Updates the studio's plan, resets quote counter, sets expiry, and marks payment as paid.

  ## Security
  - RLS enabled on `payments`
  - Studio owners can only view their own payments
  - Only the service role (edge functions) can insert/update payments
*/

CREATE TABLE IF NOT EXISTS payments (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id           uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  razorpay_order_id   text NOT NULL,
  razorpay_payment_id text,
  plan                text NOT NULL CHECK (plan IN ('starter', 'growth', 'pro')),
  billing_cycle       text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  amount              integer NOT NULL,
  currency            text NOT NULL DEFAULT 'INR',
  status              text NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'paid', 'failed')),
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE id = (
        SELECT studio_id FROM profiles WHERE id = auth.uid()
      )
    )
  );

CREATE OR REPLACE FUNCTION upgrade_studio_plan(
  p_studio_id     uuid,
  p_payment_id    text,
  p_order_id      text,
  p_plan          text,
  p_billing_cycle text,
  p_amount_paise  integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_months       integer;
  v_expires_at   timestamptz;
BEGIN
  v_months := CASE WHEN p_billing_cycle = 'annual' THEN 12 ELSE 1 END;
  v_expires_at := now() + (v_months || ' months')::interval;

  UPDATE studios
  SET
    plan                    = p_plan,
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

  RETURN json_build_object(
    'success', true,
    'plan', p_plan,
    'expires_at', v_expires_at
  );
END;
$$;
