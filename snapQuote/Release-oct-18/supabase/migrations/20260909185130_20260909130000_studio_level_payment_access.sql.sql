/*
  # Studio-Level Payment Access

  Moves payment access from per-invoice to per-studio. Admin sets a single
  contact number + password for each studio. Clients use those credentials
  to see ALL that studio's invoices and payments in a dashboard view.

  ## Changes
  - Adds payment_contact_number, payment_password_hash, payment_access_enabled
    columns to the studios table.
  - Drops the old per-invoice client_payment_accounts table and its sessions.
  - Creates a new client_payment_sessions table keyed by studio_id.
*/

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS payment_contact_number text DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_password_hash text DEFAULT '',
  ADD COLUMN IF NOT EXISTS payment_access_enabled boolean DEFAULT false;

-- Drop old per-invoice tables
DROP TABLE IF EXISTS client_payment_sessions;
DROP TABLE IF EXISTS client_payment_accounts;

-- New studio-level sessions table
CREATE TABLE IF NOT EXISTS client_payment_sessions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid        NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  token      text        NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_payment_sessions ENABLE ROW LEVEL SECURITY;

-- Anon can insert (login) and delete (logout). Only service_role can read.
DROP POLICY IF EXISTS "anon_insert_client_payment_sessions" ON client_payment_sessions;
CREATE POLICY "anon_insert_client_payment_sessions"
  ON client_payment_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_client_payment_sessions" ON client_payment_sessions;
CREATE POLICY "anon_delete_client_payment_sessions"
  ON client_payment_sessions FOR DELETE
  TO anon, authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS cps_token_idx ON client_payment_sessions(token);
CREATE INDEX IF NOT EXISTS cps_studio_id_idx ON client_payment_sessions(studio_id);
