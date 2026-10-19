/*
  # Add Extended Studio Profile Fields

  ## Changes
  - Adds `owner_name` to store the primary contact / owner's name
  - Adds `website` for the studio's public website URL
  - Adds `gst_number` for tax/GST registration number
  - These are all optional fields used in the Studio Settings profile form

  ## Modified Tables
  - `studios`: three new optional text columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'owner_name'
  ) THEN
    ALTER TABLE studios ADD COLUMN owner_name text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'website'
  ) THEN
    ALTER TABLE studios ADD COLUMN website text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'gst_number'
  ) THEN
    ALTER TABLE studios ADD COLUMN gst_number text DEFAULT '';
  END IF;
END $$;
