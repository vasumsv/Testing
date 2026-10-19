/*
# Centralize WhatsApp/Interakt Configuration at Admin Level

## Purpose
Move all Interakt/WhatsApp API configuration from per-studio settings to a single
admin-level configuration stored in `platform_settings`. All studios share one
Interakt account and one set of WhatsApp templates managed by the SnapQuote admin.

## Changes

### 1. Seed WhatsApp config rows into platform_settings
Inserts rows for: whatsapp_api_key, whatsapp_business_number, whatsapp_active,
whatsapp_quote_template, whatsapp_followup_template_1, whatsapp_followup_template_2,
whatsapp_followup_template_3, whatsapp_final_followup_template,
whatsapp_payment_received_template, whatsapp_final_payment_template.
All values default to empty/false (not configured).

### 2. RLS: Restrict whatsapp_api_key row from anon/authenticated
Replaces the existing permissive SELECT policy ("Anyone can read platform settings",
USING true) with one that excludes the `whatsapp_api_key` row for anon/authenticated
roles. The service role bypasses RLS entirely, so edge functions can still read it.
Template names and whatsapp_active remain readable so the frontend can check
whether WhatsApp is configured.

### 3. Studio-level columns
The existing studios.whatsapp_* columns are NOT dropped (data safety). They remain
in the schema but application code will no longer read them.
*/

-- Seed WhatsApp configuration rows into platform_settings (value column is jsonb)
INSERT INTO platform_settings (id, value, updated_at)
VALUES
  ('whatsapp_api_key', to_jsonb(''::text), now()),
  ('whatsapp_business_number', to_jsonb(''::text), now()),
  ('whatsapp_active', to_jsonb(false), now()),
  ('whatsapp_quote_template', to_jsonb(''::text), now()),
  ('whatsapp_followup_template_1', to_jsonb(''::text), now()),
  ('whatsapp_followup_template_2', to_jsonb(''::text), now()),
  ('whatsapp_followup_template_3', to_jsonb(''::text), now()),
  ('whatsapp_final_followup_template', to_jsonb(''::text), now()),
  ('whatsapp_payment_received_template', to_jsonb(''::text), now()),
  ('whatsapp_final_payment_template', to_jsonb(''::text), now())
ON CONFLICT (id) DO NOTHING;

-- Replace the permissive SELECT policy with one that excludes the API key row
DROP POLICY IF EXISTS "Anyone can read platform settings" ON platform_settings;

CREATE POLICY "anon_read_platform_settings_except_secrets"
ON platform_settings FOR SELECT
TO anon, authenticated
USING (id <> 'whatsapp_api_key');
