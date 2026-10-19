/*
  # Add Quote Line Items and Extend Quotes Table

  ## Summary
  Extends the quote builder functionality by adding a line items structure
  and additional fields to the quotes table.

  ## Changes

  ### Modified Table — `quotes`
  - Adds `final_price` (numeric): the negotiated final price
  - Adds `show_discount` (boolean): whether to display the discount in the preview
  - Adds `notes` already exists, no change
  - Adds `package_id` (uuid, nullable): optional linked package
  - Adds `items` (jsonb): stores the line items array directly on the quote
    (name, price, enabled) — avoids a separate join table for speed

  ## Notes
  - items JSONB field stores array like: [{"name":"...", "price": 1000, "enabled": true}]
  - final_price nullable; when null the quote total is the subtotal of items
  - show_discount defaults to false
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'final_price'
  ) THEN
    ALTER TABLE quotes ADD COLUMN final_price numeric(10,2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'show_discount'
  ) THEN
    ALTER TABLE quotes ADD COLUMN show_discount boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'package_id'
  ) THEN
    ALTER TABLE quotes ADD COLUMN package_id uuid REFERENCES packages(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'quotes' AND column_name = 'items'
  ) THEN
    ALTER TABLE quotes ADD COLUMN items jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;
