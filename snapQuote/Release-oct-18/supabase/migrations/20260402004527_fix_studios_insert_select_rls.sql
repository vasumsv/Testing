/*
  # Fix studios INSERT + SELECT RLS during onboarding

  ## Problem
  During onboarding, when a new user inserts a studio row, Supabase's
  `.insert().select('id')` tries to read the row back immediately.
  At that point the user's profile.studio_id is still NULL (the link
  hasn't been created yet), so all existing SELECT policies deny access,
  causing a "new row violates row-level security policy" error even though
  the INSERT itself is allowed.

  ## Fix
  Add a temporary-owner SELECT policy that allows a user to read any studio
  whose email matches their own auth email. This covers the narrow window
  between studio creation and profile linking during onboarding.
  After profile linking, the existing "Studio members can read own studio"
  policy takes over.
*/

DROP POLICY IF EXISTS "Creator can read studio by email match" ON studios;

CREATE POLICY "Creator can read studio by email match"
  ON studios
  FOR SELECT
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
