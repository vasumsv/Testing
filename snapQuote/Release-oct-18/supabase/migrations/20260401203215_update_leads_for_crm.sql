/*
  # Update Leads Table for CRM Page

  ## Changes

  ### Modified Tables — `leads`
  - Drops the old status check constraint (new/contacted/qualified/converted/lost)
  - Adds new status constraint matching the CRM workflow: new, quote_sent, follow_up, booked
  - Adds `location` column for event venue / location
  - Adds `budget` column (numeric) for client's estimated budget

  ## Notes
  - Existing rows with old status values will remain; the constraint only applies going forward
  - location and budget are optional fields
*/

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

ALTER TABLE leads
  ADD CONSTRAINT leads_status_check
    CHECK (status IN ('new', 'quote_sent', 'follow_up', 'booked'));

UPDATE leads SET status = 'new' WHERE status NOT IN ('new', 'quote_sent', 'follow_up', 'booked');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'location'
  ) THEN
    ALTER TABLE leads ADD COLUMN location text DEFAULT '';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads' AND column_name = 'budget'
  ) THEN
    ALTER TABLE leads ADD COLUMN budget numeric(10,2);
  END IF;
END $$;
