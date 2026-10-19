/*
# Add WhatsApp Webhook Secret Setting

## Summary
Adds a `whatsapp_webhook_secret` row to `platform_settings` so the
`interakt-webhook` edge function can verify HMAC-SHA256 signatures on
incoming Interakt webhook payloads. This prevents forged status updates.

## Changes
1. Inserts a new `whatsapp_webhook_secret` row (empty by default — no
   verification until the admin sets a value).
2. The `interakt-webhook` edge function checks this setting; if empty,
   it accepts without verification (backward compatible). If set, it
   verifies the `X-Webhook-Signature` header.

## Security
- The secret is stored in `platform_settings` which is only readable by
  the service role (RLS excludes `whatsapp_api_key` from anon reads, but
  this new key is also not in the anon-readable list by default since no
  SELECT policy grants access to it specifically — the existing policy
  only excludes `whatsapp_api_key`, so this new row IS readable by anon.
  We fix this by updating the policy to exclude all secret keys).
*/

-- 1. Seed the webhook secret setting
INSERT INTO platform_settings (id, value)
VALUES ('whatsapp_webhook_secret', to_jsonb(''::text))
ON CONFLICT (id) DO NOTHING;

-- 2. Update the anon SELECT policy to also exclude the webhook secret
DROP POLICY IF EXISTS "anon_read_platform_settings_except_secrets" ON platform_settings;
CREATE POLICY "anon_read_platform_settings_except_secrets"
  ON platform_settings FOR SELECT
  TO anon, authenticated
  USING (id NOT IN ('whatsapp_api_key', 'whatsapp_webhook_secret'));
