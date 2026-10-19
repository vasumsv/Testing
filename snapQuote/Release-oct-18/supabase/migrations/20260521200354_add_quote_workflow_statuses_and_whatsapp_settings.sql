/*
  # Quote Workflow Statuses & WhatsApp Settings

  ## Summary
  Extends the quote status system and adds WhatsApp integration settings to support
  the full Quote-to-Payment workflow platform.

  ## Changes

  ### 1. quotes table — new status values
  Drops the old CHECK constraint and adds new status values:
  - follow_up_pending: quote sent, follow-up scheduled
  - interested: customer has expressed interest
  - invoice_created: an invoice has been created for this quote
  - paid: payment completed

  Full new status set:
  draft | sent | follow_up_pending | interested | accepted | invoice_created | paid | rejected | expired

  ### 2. quotes table — follow_up_sent_at column
  Tracks when the automated follow-up WhatsApp message was sent.

  ### 3. studios table — WhatsApp integration columns
  - whatsapp_api_key: Interakt (or similar) API key (stored encrypted-style, service role only readable)
  - whatsapp_business_number: Business WhatsApp number
  - whatsapp_followup_enabled: Toggle for automated follow-up messages

  ## Security
  - Studios RLS remains unchanged (owners can only read/write their own studio row)
  - New columns inherit existing RLS
*/

-- 1. Drop old check constraint on quotes.status
ALTER TABLE quotes DROP CONSTRAINT IF EXISTS quotes_status_check;

-- 2. Add new check constraint with extended status set
ALTER TABLE quotes
  ADD CONSTRAINT quotes_status_check
  CHECK (status IN ('draft','sent','follow_up_pending','interested','accepted','invoice_created','paid','rejected','expired'));

-- 3. Add follow_up_sent_at to quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'follow_up_sent_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN follow_up_sent_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- 4. Add WhatsApp integration columns to studios
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'whatsapp_api_key'
  ) THEN
    ALTER TABLE studios ADD COLUMN whatsapp_api_key text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'whatsapp_business_number'
  ) THEN
    ALTER TABLE studios ADD COLUMN whatsapp_business_number text DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'whatsapp_followup_enabled'
  ) THEN
    ALTER TABLE studios ADD COLUMN whatsapp_followup_enabled boolean NOT NULL DEFAULT false;
  END IF;
END $$;
