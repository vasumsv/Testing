/*
  # Add Admin Studio Fields

  ## Summary
  Adds fields needed for admin panel management of studios and subscriptions.

  ## Changes

  ### Modified Table — `studios`
  - Adds `expires_at` (timestamptz, nullable): plan expiry date, set by admin
  - Adds `quotes_count` (int, default 0): running count of quotes created by this studio

  ### Modified Table — `subscriptions`
  - Adds `notes` (text): admin notes on a subscription

  ## Notes
  - `expires_at` is used by admin to manually extend or set plan expiry
  - `quotes_count` is a denormalized counter for display in admin table
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE studios ADD COLUMN expires_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'quotes_count'
  ) THEN
    ALTER TABLE studios ADD COLUMN quotes_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'notes'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN notes text DEFAULT '';
  END IF;
END $$;
