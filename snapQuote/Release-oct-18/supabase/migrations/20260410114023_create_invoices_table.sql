/*
  # Create Invoices Table

  ## Summary
  Introduces a proper `invoices` table that is separate from quotes. An invoice
  is generated from an accepted quote and becomes the billing document. Payments
  are attached to invoices, not to quotes. This separates the quotation workflow
  from the billing workflow.

  ## New Tables

  ### `invoices`
  - `id` (uuid, primary key)
  - `studio_id` (uuid FK → studios.id)
  - `quote_id` (uuid FK → quotes.id) — the source quote
  - `invoice_number` (text) — auto-generated sequential number like INV-0001
  - `client_name`, `client_email`, `client_phone` — copied from quote/lead
  - `issue_date` (date) — when invoice was issued
  - `due_date` (date, nullable) — payment due date
  - `subtotal` (numeric) — pre-tax total
  - `gst_rate` (numeric, default 0) — GST % (0 if not applicable)
  - `gst_amount` (numeric, default 0) — computed GST
  - `total` (numeric) — final total including GST
  - `notes` (text)
  - `status` — 'unpaid' | 'partial' | 'paid'
  - `items` (jsonb) — line items copied from quote
  - `created_at`, `updated_at` (timestamptz)

  ### `invoice_payments`
  - `id` (uuid, primary key)
  - `studio_id` (uuid FK → studios.id)
  - `invoice_id` (uuid FK → invoices.id)
  - `amount` (numeric)
  - `payment_method` — cash | upi | bank_transfer | cheque | other
  - `payment_date` (date)
  - `note` (text, nullable)
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Studio owners can manage their own invoices and payments only

  ## Notes
  - `quote_payments` table from earlier remains for backwards compat but new
    payments use `invoice_payments`
  - Invoice number sequence is scoped per studio
*/

CREATE TABLE IF NOT EXISTS invoices (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id      uuid        NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  quote_id       uuid        NOT NULL REFERENCES quotes(id) ON DELETE RESTRICT,
  invoice_number text        NOT NULL,
  client_name    text        NOT NULL DEFAULT '',
  client_email   text        NOT NULL DEFAULT '',
  client_phone   text        NOT NULL DEFAULT '',
  issue_date     date        NOT NULL DEFAULT CURRENT_DATE,
  due_date       date,
  subtotal       numeric     NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  gst_rate       numeric     NOT NULL DEFAULT 0 CHECK (gst_rate >= 0 AND gst_rate <= 100),
  gst_amount     numeric     NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
  total          numeric     NOT NULL DEFAULT 0 CHECK (total >= 0),
  notes          text        NOT NULL DEFAULT '',
  status         text        NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid')),
  items          jsonb       NOT NULL DEFAULT '[]'::jsonb,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE(studio_id, invoice_number)
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can view own invoices"
  ON invoices FOR SELECT
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio owners can insert own invoices"
  ON invoices FOR INSERT
  TO authenticated
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio owners can update own invoices"
  ON invoices FOR UPDATE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio owners can delete own invoices"
  ON invoices FOR DELETE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS invoices_studio_id_idx ON invoices(studio_id);
CREATE INDEX IF NOT EXISTS invoices_quote_id_idx  ON invoices(quote_id);

CREATE TABLE IF NOT EXISTS invoice_payments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id      uuid        NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  invoice_id     uuid        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount         numeric     NOT NULL CHECK (amount > 0),
  payment_method text        NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque', 'other')),
  payment_date   date        NOT NULL DEFAULT CURRENT_DATE,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can view own invoice payments"
  ON invoice_payments FOR SELECT
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio owners can insert own invoice payments"
  ON invoice_payments FOR INSERT
  TO authenticated
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio owners can update own invoice payments"
  ON invoice_payments FOR UPDATE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio owners can delete own invoice payments"
  ON invoice_payments FOR DELETE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS invoice_payments_studio_id_idx  ON invoice_payments(studio_id);
CREATE INDEX IF NOT EXISTS invoice_payments_invoice_id_idx ON invoice_payments(invoice_id);
