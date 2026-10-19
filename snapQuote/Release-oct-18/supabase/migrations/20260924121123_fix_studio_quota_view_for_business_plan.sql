/*
  # Fix studio_quota view to handle 'business' plan

  The studio_quota view had hardcoded CASE statements that didn't include
  the 'business' plan, causing it to fall through to ELSE 10 (trial limit).
  This made Business-plan users see "limit reached" after 10 quotes.

  Now business is treated as unlimited (like pro).
*/
CREATE OR REPLACE VIEW studio_quota AS
SELECT
  id AS studio_id,
  plan,
  is_active,
  status,
  subscription_expires_at,
  quotes_this_month,
  quotes_reset_at,
  CASE plan
    WHEN 'trial'   THEN 10
    WHEN 'starter' THEN 30
    WHEN 'growth'  THEN 100
    WHEN 'pro'     THEN NULL
    WHEN 'business' THEN NULL
    ELSE 10
  END AS monthly_limit,
  CASE
    WHEN NOT is_active THEN true
    WHEN status = 'suspended' THEN true
    WHEN subscription_expires_at IS NOT NULL AND subscription_expires_at < now() THEN true
    WHEN plan IN ('pro', 'business') THEN false
    ELSE quotes_this_month >=
      CASE plan
        WHEN 'trial'   THEN 10
        WHEN 'starter' THEN 30
        WHEN 'growth'  THEN 100
        ELSE 10
      END
  END AS limit_reached,
  CASE
    WHEN plan IN ('pro', 'business') THEN false
    ELSE quotes_this_month::numeric >= GREATEST(
      CASE plan
        WHEN 'trial'   THEN 10
        WHEN 'starter' THEN 30
        WHEN 'growth'  THEN 100
        ELSE 10
      END::numeric * 0.8,
      (
        CASE plan
          WHEN 'trial'   THEN 10
          WHEN 'starter' THEN 30
          WHEN 'growth'  THEN 100
          ELSE 10
        END - 5
      )::numeric
    )
  END AS near_limit
FROM studios s;
