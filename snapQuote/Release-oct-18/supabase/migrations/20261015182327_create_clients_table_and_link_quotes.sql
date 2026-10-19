/*
# Create Clients Table and Link Quotes

## Purpose
Replace the Leads module with a Clients module. Clients are auto-created/updated
when quotations are saved in Quote Builder, deduplicated by phone number within
each studio. This preserves existing lead data (the leads table is NOT dropped)
while introducing a dedicated clients table that links to quotes.

## Changes

### 1. New table: `clients`
- `id` (uuid, primary key)
- `studio_id` (uuid, references studios, NOT NULL) — owning studio
- `full_name` (text, NOT NULL) — client name
- `phone` (text, NOT NULL default '') — phone number, used for dedup
- `email` (text, default '') — email address
- `event_type` (text) — latest event type if known
- `event_date` (date, nullable) — latest event date if known
- `notes` (text, nullable) — free-form notes
- `created_at` (timestamptz, default now())
- `updated_at` (timestamptz, default now())
- Unique constraint on (studio_id, phone) where phone != '' — prevents duplicate
  clients within the same studio when a phone number is provided.

### 2. New column on `quotes`
- `client_id` (uuid, nullable, references clients ON DELETE SET NULL) — links
  a quote to its client record.

### 3. Backfill
- Insert into `clients` from existing `leads` rows (dedup by studio_id + phone).
- Update `quotes.client_id` by matching quotes to clients via `lead_id` when
  possible, or by `studio_id + client_name + client_phone` as a fallback.

### 4. Security
- RLS enabled on `clients`.
- Studio-scoped CRUD policies (same pattern as leads): authenticated users can
  only access rows where studio_id matches their profile's studio_id.
- `quotes.client_id` is covered by the existing quotes RLS policies (studio-scoped).

### 5. Indexes
- Index on clients(studio_id) for fast listing.
- Index on clients(studio_id, phone) for dedup lookups.
- Index on quotes(client_id) for reverse lookups.

## Notes
1. The leads table is NOT dropped — existing data is preserved. The Leads UI
   module is replaced by the Clients UI module, but the table remains for
   backward compatibility.
2. Quotes without a matching client (e.g. orphaned or quick-add quotes) get
   client_id = NULL. They are NOT broken.
3. Future quote saves will auto-upsert clients via the application layer.
*/

-- 1. Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id  uuid        NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  full_name  text        NOT NULL,
  phone      text        NOT NULL DEFAULT '',
  email      text        NOT NULL DEFAULT '',
  event_type text        DEFAULT '',
  event_date date,
  notes      text        DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint for dedup: one client per studio per phone number
-- Only enforces uniqueness when phone is non-empty (using a partial index)
CREATE UNIQUE INDEX IF NOT EXISTS clients_studio_phone_uniq
  ON clients(studio_id, phone)
  WHERE phone != '';

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_clients_studio_id ON clients(studio_id);
CREATE INDEX IF NOT EXISTS idx_clients_studio_name ON clients(studio_id, full_name);

-- 2. Add client_id to quotes
ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES clients(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);

-- 3. Enable RLS on clients
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- 4. RLS policies (studio-scoped, same pattern as leads)
DROP POLICY IF EXISTS "select_own_clients" ON clients;
CREATE POLICY "select_own_clients"
  ON clients FOR SELECT
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "insert_own_clients" ON clients;
CREATE POLICY "insert_own_clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "update_own_clients" ON clients;
CREATE POLICY "update_own_clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

DROP POLICY IF EXISTS "delete_own_clients" ON clients;
CREATE POLICY "delete_own_clients"
  ON clients FOR DELETE
  TO authenticated
  USING (studio_id = (SELECT studio_id FROM profiles WHERE id = auth.uid()));

-- 5. Backfill: create clients from existing leads
-- Insert leads that have a phone, dedup by studio_id + phone
INSERT INTO clients (studio_id, full_name, phone, email, event_type, event_date, created_at, updated_at)
SELECT DISTINCT ON (l.studio_id, l.phone)
  l.studio_id, l.full_name, COALESCE(l.phone, ''), COALESCE(l.email, ''),
  COALESCE(l.event_type, ''), l.event_date, l.created_at, l.updated_at
FROM leads l
WHERE l.phone IS NOT NULL AND l.phone != ''
ORDER BY l.studio_id, l.phone, l.created_at DESC
ON CONFLICT DO NOTHING;

-- Insert leads without a phone (these won't be deduped, but we still create records)
INSERT INTO clients (studio_id, full_name, phone, email, event_type, event_date, created_at, updated_at)
SELECT l.studio_id, l.full_name, COALESCE(l.phone, ''), COALESCE(l.email, ''),
  COALESCE(l.event_type, ''), l.event_date, l.created_at, l.updated_at
FROM leads l
WHERE (l.phone IS NULL OR l.phone = '')
  AND NOT EXISTS (
    SELECT 1 FROM clients c
    WHERE c.studio_id = l.studio_id
      AND c.full_name = l.full_name
      AND c.phone = ''
  )
ORDER BY l.created_at DESC
ON CONFLICT DO NOTHING;

-- 6. Backfill: link quotes to clients via lead_id
UPDATE quotes q
SET client_id = c.id
FROM clients c
WHERE q.lead_id IS NOT NULL
  AND q.lead_id IN (SELECT id FROM leads)
  AND c.studio_id = q.studio_id
  AND c.full_name = (SELECT full_name FROM leads WHERE id = q.lead_id)
  AND c.phone = COALESCE((SELECT phone FROM leads WHERE id = q.lead_id), '')
  AND q.client_id IS NULL;

-- 7. Backfill: link remaining quotes to clients by name + phone
UPDATE quotes q
SET client_id = c.id
FROM clients c
WHERE q.client_id IS NULL
  AND q.studio_id = c.studio_id
  AND q.client_name = c.full_name
  AND COALESCE(q.client_phone, '') != ''
  AND COALESCE(q.client_phone, '') = c.phone;

-- 8. Auto-create clients for quotes that have client_phone but no matching client
INSERT INTO clients (studio_id, full_name, phone, email, created_at, updated_at)
SELECT DISTINCT ON (q.studio_id, q.client_phone)
  q.studio_id, q.client_name, q.client_phone, COALESCE(q.client_email, ''),
  q.created_at, q.created_at
FROM quotes q
WHERE q.client_phone IS NOT NULL
  AND q.client_phone != ''
  AND q.client_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM clients c
    WHERE c.studio_id = q.studio_id AND c.phone = q.client_phone
  )
ORDER BY q.studio_id, q.client_phone, q.created_at DESC
ON CONFLICT DO NOTHING;

-- 9. Link those newly created clients back to quotes
UPDATE quotes q
SET client_id = c.id
FROM clients c
WHERE q.client_id IS NULL
  AND q.studio_id = c.studio_id
  AND COALESCE(q.client_phone, '') != ''
  AND COALESCE(q.client_phone, '') = c.phone;
