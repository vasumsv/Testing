/*
  # Add theme_id to quotes table

  ## Summary
  Adds a `theme_id` column to the `quotes` table so each quote can store
  its chosen visual theme. Defaults to 'classic-dark' to match the existing
  default rendering.

  ## Changes
  - `quotes.theme_id` (text, default 'classic-dark') — stores the theme identifier
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'theme_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN theme_id text NOT NULL DEFAULT 'classic-dark';
  END IF;
END $$;
