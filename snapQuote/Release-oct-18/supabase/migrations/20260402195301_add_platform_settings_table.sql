/*
  # Add Platform Settings Table

  1. New Tables
    - `platform_settings`
      - `id` (text, primary key) - setting key
      - `value` (jsonb) - setting value (flexible JSON)
      - `updated_at` (timestamptz)

  2. Default Settings
    - maintenance_mode: false
    - signups_enabled: true
    - trial_days: 14

  3. Security
    - Enable RLS
    - Only service role can read/write (admin edge functions use service role key)
    - No direct client access
*/

CREATE TABLE IF NOT EXISTS platform_settings (
  id text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

INSERT INTO platform_settings (id, value) VALUES
  ('maintenance_mode', 'false'::jsonb),
  ('signups_enabled', 'true'::jsonb),
  ('trial_days', '14'::jsonb)
ON CONFLICT (id) DO NOTHING;
