/*
  # Add Client Payment Access System

  ## Summary
  Creates a separate login system so studio clients can view their payment
  information without having access to the studio's main dashboard. Studio
  owners (or admin) create per-client credentials and can enable/disable
  access at any time. Financial data (invoice totals, payment amounts) is
  hidden behind this second login.

  ## New Tables

  ### `client_payment_accounts`
  - `id` (uuid, primary key)
  - `studio_id` (uuid FK → studios.id) — owning studio
  - `invoice_id` (uuid FK → invoices.id) — the invoice this account gives access to
  - `username` (text) — mobile number or username the client logs in with
  - `password_hash` (text) — bcrypt hash via hash_admin_password RPC
  - `is_enabled` (boolean, default false) — admin/owner can toggle access
  - `created_at`, `updated_at` (timestamptz)

  ### `client_payment_sessions`
  - `id` (uuid, primary key)
  - `account_id` (uuid FK → client_payment_accounts.id)
  - `token` (text, unique) — session token
  - `expires_at` (timestamptz)

  ## Security
  - RLS enabled on both tables
  - Studio owners can manage accounts for their own invoices
  - Sessions table is writeable by anon (login creates sessions) but only
    readable by service_role — the edge function validates tokens server-side
  - The `client_payment_accounts` table is readable by studio owners only;
    anon cannot list accounts

  ## Notes
  - Reuses the existing `hash_admin_password` and `verify_admin_password` RPCs
    for bcrypt hashing/verification — same pattern as admin_users
  - One account per invoice; username is unique per studio
  - Session tokens expire after 24 hours
*/

CREATE TABLE IF NOT EXISTS client_payment_accounts (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id     uuid        NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  invoice_id    uuid        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  username      text        NOT NULL,
  password_hash text        NOT NULL,
  is_enabled    boolean     NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE(studio_id, username)
);

ALTER TABLE client_payment_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Studio owners can view own client payment accounts" ON client_payment_accounts;
CREATE POLICY "Studio owners can view own client payment accounts"
  ON client_payment_accounts FOR SELECT
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Studio owners can insert own client payment accounts" ON client_payment_accounts;
CREATE POLICY "Studio owners can insert own client payment accounts"
  ON client_payment_accounts FOR INSERT
  TO authenticated
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Studio owners can update own client payment accounts" ON client_payment_accounts;
CREATE POLICY "Studio owners can update own client payment accounts"
  ON client_payment_accounts FOR UPDATE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Studio owners can delete own client payment accounts" ON client_payment_accounts;
CREATE POLICY "Studio owners can delete own client payment accounts"
  ON client_payment_accounts FOR DELETE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS cpa_studio_id_idx ON client_payment_accounts(studio_id);
CREATE INDEX IF NOT EXISTS cpa_invoice_id_idx ON client_payment_accounts(invoice_id);

-- Sessions table: anon can insert (login) and delete (logout), but only
-- service_role can read. The edge function does all token validation.
CREATE TABLE IF NOT EXISTS client_payment_sessions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid        NOT NULL REFERENCES client_payment_accounts(id) ON DELETE CASCADE,
  token      text        NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE client_payment_sessions ENABLE ROW LEVEL SECURITY;

-- No SELECT/UPDATE policies for anon or authenticated — only service_role
-- (which bypasses RLS) can read sessions. Anon can insert (login flow) and
-- delete (logout flow) by token.
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
CREATE INDEX IF NOT EXISTS cps_account_id_idx ON client_payment_sessions(account_id);
