/*
# Add Analytics Section Credentials

## Purpose
Extends the existing Dashboard & Payments section auth pattern to cover Analytics.
Studio admins can set separate username/password credentials for Analytics access,
and users must log in through a section login screen before viewing the Analytics page.

## Changes

### 1. New columns on `studios` table
- `analytics_username` (text, nullable) — username for Analytics section login
- `analytics_password_hash` (text, nullable) — hash for Analytics section login
- `analytics_access_enabled` (boolean, default false) — whether Analytics section login is active

### 2. Update `section_sessions` constraint
- The existing `section` CHECK constraint only allows 'dashboard' and 'payments'.
- We alter it to also allow 'analytics'.
- Since we cannot DROP a constraint conditionally, we use DO block to check if it exists before dropping.

### 3. Security
- No new tables. Existing RLS on `section_sessions` applies.
- All access remains via edge functions using the service role key.

### Notes
1. Existing studios data is untouched; all new columns are nullable with safe defaults.
2. Studios without analytics credentials simply can't access the Analytics section until configured.
*/

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS analytics_username text DEFAULT '',
  ADD COLUMN IF NOT EXISTS analytics_password_hash text DEFAULT '',
  ADD COLUMN IF NOT EXISTS analytics_access_enabled boolean DEFAULT false;

-- Replace the section check constraint to include 'analytics'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'section_sessions_section_check'
      AND conrelid = 'section_sessions'::regclass
  ) THEN
    ALTER TABLE section_sessions DROP CONSTRAINT section_sessions_section_check;
  END IF;
END $$;

ALTER TABLE section_sessions
  ADD CONSTRAINT section_sessions_section_check
  CHECK (section IN ('dashboard', 'payments', 'analytics'));
