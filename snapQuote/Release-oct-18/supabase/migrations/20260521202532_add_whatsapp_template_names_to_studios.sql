/*
  # Add WhatsApp Template Names to Studios

  1. Changes to `studios` table:
    - `whatsapp_quote_template` (text, nullable) — Interakt template name for quote sent message
    - `whatsapp_followup_template` (text, nullable) — Interakt template name for follow-up message
    - `whatsapp_payment_template` (text, nullable) — Interakt template name for payment received message
    - `whatsapp_final_template` (text, nullable) — Interakt template name for final payment message

  2. Notes:
    - All columns are optional (nullable) — studios that haven't set them up fall back to manual wa.me links
    - No RLS changes needed; existing studio RLS policies cover these columns
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'whatsapp_quote_template'
  ) THEN
    ALTER TABLE studios ADD COLUMN whatsapp_quote_template text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'whatsapp_followup_template'
  ) THEN
    ALTER TABLE studios ADD COLUMN whatsapp_followup_template text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'whatsapp_payment_template'
  ) THEN
    ALTER TABLE studios ADD COLUMN whatsapp_payment_template text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'whatsapp_final_template'
  ) THEN
    ALTER TABLE studios ADD COLUMN whatsapp_final_template text;
  END IF;
END $$;
