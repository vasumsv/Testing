/*
  # Fix studio_portfolio_images RLS policies

  ## Problem
  The existing policies query `auth.users` table directly which causes "permission denied
  for table users" errors. The policies were using subqueries against auth.users which
  authenticated users don't have direct access to.

  ## Fix
  Replace all policies to use `auth.uid()` directly for lookups, and join through the
  studios table using the profile/studio relationship instead of querying auth.users.

  ## Changes
  - Drop all existing policies on studio_portfolio_images
  - Recreate with safe patterns using auth.uid() via profiles table
*/

DROP POLICY IF EXISTS "Studio owners can view own portfolio images" ON studio_portfolio_images;
DROP POLICY IF EXISTS "Studio owners can insert portfolio images" ON studio_portfolio_images;
DROP POLICY IF EXISTS "Studio owners can update portfolio images" ON studio_portfolio_images;
DROP POLICY IF EXISTS "Studio owners can delete portfolio images" ON studio_portfolio_images;

CREATE POLICY "Studio owners can view own portfolio images"
  ON studio_portfolio_images FOR SELECT
  TO authenticated
  USING (
    studio_id IN (
      SELECT s.id FROM studios s
      INNER JOIN profiles p ON p.studio_id = s.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can insert portfolio images"
  ON studio_portfolio_images FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id IN (
      SELECT s.id FROM studios s
      INNER JOIN profiles p ON p.studio_id = s.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can update portfolio images"
  ON studio_portfolio_images FOR UPDATE
  TO authenticated
  USING (
    studio_id IN (
      SELECT s.id FROM studios s
      INNER JOIN profiles p ON p.studio_id = s.id
      WHERE p.id = auth.uid()
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT s.id FROM studios s
      INNER JOIN profiles p ON p.studio_id = s.id
      WHERE p.id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can delete portfolio images"
  ON studio_portfolio_images FOR DELETE
  TO authenticated
  USING (
    studio_id IN (
      SELECT s.id FROM studios s
      INNER JOIN profiles p ON p.studio_id = s.id
      WHERE p.id = auth.uid()
    )
  );
