/*
# Add Dashboard & Payments Section Credentials + Session Tables

## Purpose
SnapQuote needs three separate access levels:
1. Normal app login (existing Supabase auth)
2. Dashboard login (new — separate credentials per studio)
3. Payments login (new — separate credentials per studio, distinct from dashboard and from the existing client payment portal)

This migration adds the credential columns and session tables for the Dashboard and Payments section logins.

## Changes

### 1. New columns on `studios` table
- `dashboard_username` (text, nullable) — username for Dashboard section login
- `dashboard_password_hash` (text, nullable) — bcrypt-style hash for Dashboard login
- `dashboard_access_enabled` (boolean, default false) — whether Dashboard section login is active
- `payments_username` (text, nullable) — username for Payments section login (in-app, NOT the client portal)
- `payments_password_hash` (text, nullable) — hash for Payments section login
- `payments_access_enabled` (boolean, default false) — whether Payments section login is active

These are completely separate from:
- The existing `payment_contact_number` / `payment_password_hash` / `payment_access_enabled` columns (client-facing payment portal)
- The Supabase auth.users login (normal app login)

### 2. New table: `section_sessions`
Stores session tokens for both Dashboard and Payments section logins.
- `id` (uuid, primary key)
- `studio_id` (uuid, references studios)
- `section` (text — 'dashboard' or 'payments')
- `token` (text, unique)
- `expires_at` (timestamptz)
- `created_at` (timestamptz, default now())

### 3. Security
- RLS enabled on `section_sessions`
- No policies added — all access is via edge functions using the service role key
- Existing studio data is untouched; all new columns are nullable with safe defaults

### Notes
1. Existing quotations, studios, and all other data remain unchanged.
2. Studios without these credentials simply can't access Dashboard/Payments sections until configured.
3. The existing client payment portal (`payment_*` columns) is NOT affected.
*/

-- Add credential columns to studios
ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS dashboard_username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS dashboard_password_hash text DEFAULT '',
  ADD COLUMN IF NOT EXISTS dashboard_access_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS payments_username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS payments_password_hash text DEFAULT '',
  ADD COLUMN IF NOT EXISTS payments_access_enabled boolean DEFAULT false;

-- Create session table for dashboard/payments section logins
CREATE TABLE IF NOT EXISTS section_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  section text NOT NULL CHECK (section IN ('dashboard', 'payments')),
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE section_sessions ENABLE ROW LEVEL SECURITY;

-- Index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_section_sessions_token ON section_sessions(token);
CREATE INDEX IF NOT EXISTS idx_section_sessions_studio_section ON section_sessions(studio_id, section);

-- Auto-cleanup expired sessions (cron every hour)
CREATE OR REPLACE FUNCTION cleanup_expired_section_sessions() RETURNS void AS $$
BEGIN
  DELETE FROM section_sessions WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;

SELECT cron.schedule(
  'cleanup-section-sessions',
  '0 * * * *',
  'SELECT cleanup_expired_section_sessions()'
);
