/*
  # Add quote_options column to quotes table

  ## Summary
  Adds a `quote_options` JSONB column to store event details (events array),
  signature preference, and GST inclusion flag per quote.

  ## Changes
  - `quotes` table: new `quote_options` JSONB column (nullable, no default)

  ## Reason
  Event details (event name + date) and other quote-level options were not being
  persisted, causing them to disappear when re-opening or previewing a saved quote.
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'quote_options'
  ) THEN
    ALTER TABLE quotes ADD COLUMN quote_options jsonb;
  END IF;
END $$;
