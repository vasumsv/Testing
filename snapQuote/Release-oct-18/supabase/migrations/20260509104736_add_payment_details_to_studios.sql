/*
  # Add Payment Details to Studios Table

  ## Summary
  Adds a `payment_details` JSONB column to the studios table to store bank/UPI
  payment information that can be displayed on quotations.

  ## Modified Tables
  - `studios`
    - `payment_details` (jsonb, nullable) — stores:
      {
        account_holder: string,
        account_number: string,
        ifsc_code: string,
        bank_name: string,
        upi_id: string,
        notes: string
      }

  ## Notes
  - No migration needed for existing data; column is nullable by default
  - No new RLS needed; studios table already has RLS policies
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'studios' AND column_name = 'payment_details'
  ) THEN
    ALTER TABLE studios ADD COLUMN payment_details jsonb;
  END IF;
END $$;
