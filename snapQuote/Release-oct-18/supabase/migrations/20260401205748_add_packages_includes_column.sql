/*
  # Add includes column to packages

  ## Summary
  Adds a `includes` JSONB array column to the packages table to store the list of
  "what's included" bullet points for each package. Previously, packages didn't
  have a way to store this structured data.

  ## Changes
  - `packages.includes` (jsonb, default '[]'): Array of string bullet points
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'packages' AND column_name = 'includes'
  ) THEN
    ALTER TABLE packages ADD COLUMN includes jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
