/*
  # Fix platform_settings RLS and admin write permissions

  1. Problem
    - platform_settings table had no RLS policies - nobody could read or write it
    - Admin panel uses the anon Supabase client (not service role), so direct table 
      writes from the admin UI were silently failing due to RLS denying unauthenticated access

  2. Changes
    - Add SELECT policy on platform_settings for anon/authenticated (settings are readable by all)
    - Add INSERT/UPDATE policy on platform_settings using service role bypass via a helper approach
    - The admin writes (studios updates, subscriptions) will be handled by edge functions with 
      service role key, so we just need to ensure reads work for the dashboard

  3. Notes
    - platform_settings is public-readable (maintenance_mode, signups_enabled need to be readable 
      by the frontend to show proper messages)
    - Writes are protected via edge functions with token validation
*/

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read platform settings"
  ON platform_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Service role can manage platform settings"
  ON platform_settings FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role can update platform settings"
  ON platform_settings FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);
