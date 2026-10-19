/*
  # Add Details Section to Studios

  ## Summary
  Adds a `details_section` column to the `studios` table so each studio
  can store custom details/information content that will be displayed on
  quotations before the Terms & Conditions section.

  ## Changes
  - `studios` table: new `details_section` text column (nullable, defaults to empty string)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'details_section'
  ) THEN
    ALTER TABLE studios ADD COLUMN details_section text NOT NULL DEFAULT '';
  END IF;
END $$;
