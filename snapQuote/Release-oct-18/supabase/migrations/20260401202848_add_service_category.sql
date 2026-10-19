/*
  # Add Category to Services Table

  ## Changes
  - Adds `category` column to `services` table
  - Values: 'photography', 'videography', 'addon'
  - Defaults to 'photography' for existing rows

  ## Modified Tables
  - `services`: new `category` column with check constraint
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'services' AND column_name = 'category'
  ) THEN
    ALTER TABLE services
      ADD COLUMN category text NOT NULL DEFAULT 'photography'
        CHECK (category IN ('photography', 'videography', 'addon'));
  END IF;
END $$;
