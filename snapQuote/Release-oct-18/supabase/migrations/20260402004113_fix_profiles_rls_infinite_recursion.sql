/*
  # Fix infinite recursion in profiles RLS policy

  ## Problem
  The "Admins can read all profiles" policy caused infinite recursion because it queries
  the profiles table while already inside a profiles RLS policy evaluation.

  ## Fix
  Replace the recursive subquery with a direct check against auth.jwt() app_metadata,
  which is evaluated without touching the profiles table.
*/

DROP POLICY IF EXISTS "Admins can read all profiles" ON profiles;

CREATE POLICY "Admins can read all profiles"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR auth.uid() = id
  );
