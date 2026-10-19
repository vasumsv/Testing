/*
  # Fix studios creator SELECT policy to avoid auth.users permission error

  ## Problem
  The previous policy queried `auth.users` directly which is not accessible
  from RLS policies (permission denied for table users).

  ## Fix
  Use the built-in `auth.email()` helper function instead, which returns the
  authenticated user's email without requiring direct table access.
*/

DROP POLICY IF EXISTS "Creator can read studio by email match" ON studios;

CREATE POLICY "Creator can read studio by email match"
  ON studios
  FOR SELECT
  TO authenticated
  USING (
    email = auth.email()
  );
