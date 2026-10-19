/*
  # Add Quote Payments Table

  ## Summary
  Creates a `quote_payments` table to track partial or full payments made against
  accepted quotes. This powers the Payments & Invoices billing workflow, allowing
  studios to record payments received from clients and track outstanding balances.

  ## New Tables
  - `quote_payments`
    - `id` (uuid, primary key)
    - `studio_id` (uuid FK → studios.id) – owning studio
    - `quote_id` (uuid FK → quotes.id) – the accepted quote being paid
    - `amount` (numeric) – amount paid in this transaction
    - `payment_method` (text) – 'cash' | 'upi' | 'bank_transfer' | 'cheque' | 'other'
    - `payment_date` (date) – when the payment was received
    - `note` (text, nullable) – optional note about this payment
    - `created_at`, `updated_at` (timestamptz)

  ## Security
  - RLS enabled
  - Studio owners can select, insert, update their own quote payments
  - No cross-studio access

  ## Notes
  - Paid amount is derived by summing all quote_payments for a quote
  - Remaining = quote.amount - SUM(quote_payments.amount)
*/

CREATE TABLE IF NOT EXISTS quote_payments (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id      uuid        NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  quote_id       uuid        NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  amount         numeric     NOT NULL CHECK (amount > 0),
  payment_method text        NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'upi', 'bank_transfer', 'cheque', 'other')),
  payment_date   date        NOT NULL DEFAULT CURRENT_DATE,
  note           text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE quote_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can view own quote payments"
  ON quote_payments FOR SELECT
  TO authenticated
  USING (
    studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Studio owners can insert own quote payments"
  ON quote_payments FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Studio owners can update own quote payments"
  ON quote_payments FOR UPDATE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Studio owners can delete own quote payments"
  ON quote_payments FOR DELETE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS quote_payments_studio_id_idx ON quote_payments(studio_id);
CREATE INDEX IF NOT EXISTS quote_payments_quote_id_idx ON quote_payments(quote_id);
