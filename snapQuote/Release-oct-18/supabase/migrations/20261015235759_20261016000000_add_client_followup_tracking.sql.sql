/*
# Add follow-up tracking and client response columns to clients table

## Purpose
Enables per-client WhatsApp follow-up tracking with a maximum of 3 follow-ups,
plus client response status from Interakt quick-reply button taps.

## New columns on `clients`
1. `followup_count` (int, default 0) — number of successfully sent follow-up messages.
   Incremented only when Interakt API returns success. Enforced server-side to never exceed 3.
2. `last_followup_at` (timestamptz, nullable) — timestamp of the most recent successful follow-up.
3. `last_followup_result` (text, nullable) — 'success' or 'failed' from the last attempt.
4. `client_response` (text, nullable) — one of: 'awaiting_response', 'interested',
   'wants_to_discuss', 'not_interested'. NULL means no response received yet.
5. `client_response_at` (timestamptz, nullable) — when the client tapped a quick-reply button.
6. `client_response_quote_id` (uuid, nullable) — which quote the response corresponds to.

## RLS
No policy changes — the existing clients CRUD policies already cover these new columns.
*/

ALTER TABLE clients
  ADD COLUMN IF NOT EXISTS followup_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_followup_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_followup_result text,
  ADD COLUMN IF NOT EXISTS client_response text
    CHECK (client_response IN ('awaiting_response', 'interested', 'wants_to_discuss', 'not_interested')),
  ADD COLUMN IF NOT EXISTS client_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_response_quote_id uuid;

-- Backfill existing clients to 'awaiting_response' so the UI can show it
-- Only for clients that have at least one quote (others stay NULL)
UPDATE clients
SET client_response = 'awaiting_response'
WHERE client_response IS NULL
  AND EXISTS (SELECT 1 FROM quotes WHERE quotes.client_id = clients.id);
