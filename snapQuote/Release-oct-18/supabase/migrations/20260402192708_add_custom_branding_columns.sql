/*
  # Add Custom Branding Columns to Studios

  ## Summary
  Adds Pro-plan custom branding fields to the studios table.

  ## New Columns
  - `accent_color` (text) — hex color used as brand accent in quote PDFs, defaults to #2563EB
  - `font_preference` (text) — preferred font for quotes: inter, georgia, or poppins
  - `tagline` (text) — short studio tagline shown on quote header
  - `footer_text` (text) — custom footer message on every quote

  ## Notes
  - All columns are nullable and have safe defaults
  - No RLS changes needed; existing studio policies cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'accent_color'
  ) THEN
    ALTER TABLE studios ADD COLUMN accent_color text DEFAULT '#2563EB';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'font_preference'
  ) THEN
    ALTER TABLE studios ADD COLUMN font_preference text DEFAULT 'inter';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'tagline'
  ) THEN
    ALTER TABLE studios ADD COLUMN tagline text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'footer_text'
  ) THEN
    ALTER TABLE studios ADD COLUMN footer_text text DEFAULT '';
  END IF;
END $$;
