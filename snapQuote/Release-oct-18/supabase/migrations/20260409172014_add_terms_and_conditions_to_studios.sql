/*
  # Add Terms & Conditions to Studios

  ## Summary
  Adds a `terms_and_conditions` column to the `studios` table so each studio
  can store their own custom terms text that will be displayed on the last page
  of every quotation document they generate.

  ## Changes
  - `studios` table: new `terms_and_conditions` text column (nullable, defaults to empty string)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'terms_and_conditions'
  ) THEN
    ALTER TABLE studios ADD COLUMN terms_and_conditions text NOT NULL DEFAULT '';
  END IF;
END $$;
