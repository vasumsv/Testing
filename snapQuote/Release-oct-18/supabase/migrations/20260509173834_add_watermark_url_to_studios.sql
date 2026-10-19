/*
  # Add watermark_url to studios table

  1. Changes
    - Adds `watermark_url` text column to `studios` table for storing studio quote watermark image URL

  2. Notes
    - Nullable column; no default needed
    - No RLS changes required (existing studio RLS covers it)
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'watermark_url'
  ) THEN
    ALTER TABLE studios ADD COLUMN watermark_url text;
  END IF;
END $$;
