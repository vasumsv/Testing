/*
  # WhatsApp Workflow Tracking

  ## Summary
  Adds infrastructure to track WhatsApp message delivery and customer interactions
  throughout the quote-to-payment workflow.

  ## Changes

  ### 1. quotes table
  - `client_phone` — customer WhatsApp number stored with quote
  - `whatsapp_sent_at` — timestamp when quote was sent via WhatsApp
  - `follow_up_scheduled_at` — when the 6-hour follow-up should be sent
  - `follow_up_sent_at` already exists from prior migration

  ### 2. whatsapp_logs table (new)
  Tracks every WhatsApp message sent per quote/invoice for audit and retry logic.
  - id, studio_id, quote_id (nullable), invoice_id (nullable)
  - message_type: quote_sent | follow_up | payment_received | payment_complete
  - phone, status: sent | failed | delivered | read
  - interakt_message_id — returned by Interakt API
  - payload — full message payload for debugging
  - created_at

  ## Security
  - RLS enabled on whatsapp_logs
  - Studios can only see their own logs
*/

-- 1. Add client_phone to quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'client_phone'
  ) THEN
    ALTER TABLE quotes ADD COLUMN client_phone text DEFAULT NULL;
  END IF;
END $$;

-- 2. Add whatsapp_sent_at to quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'whatsapp_sent_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN whatsapp_sent_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- 3. Add follow_up_scheduled_at to quotes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'follow_up_scheduled_at'
  ) THEN
    ALTER TABLE quotes ADD COLUMN follow_up_scheduled_at timestamptz DEFAULT NULL;
  END IF;
END $$;

-- 4. Create whatsapp_logs table
CREATE TABLE IF NOT EXISTS whatsapp_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  quote_id uuid REFERENCES quotes(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES invoices(id) ON DELETE SET NULL,
  message_type text NOT NULL CHECK (message_type IN ('quote_sent','follow_up','payment_received','payment_complete','custom')),
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','delivered','read')),
  interakt_message_id text DEFAULT NULL,
  error_message text DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can view own whatsapp logs"
  ON whatsapp_logs FOR SELECT
  TO authenticated
  USING (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can insert own whatsapp logs"
  ON whatsapp_logs FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );
