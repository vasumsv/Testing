/*
  # Add pdf_url to quotes table

  ## Summary
  Adds a `pdf_url` column to the `quotes` table to store the public Supabase Storage URL
  of the uploaded quote PDF. This URL is used as the document header attachment when
  sending Interakt WhatsApp template messages.

  ## Changes
  - `quotes.pdf_url` (text, nullable) — public URL of the uploaded PDF in studio-assets bucket
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'pdf_url'
  ) THEN
    ALTER TABLE quotes ADD COLUMN pdf_url text;
  END IF;
END $$;
