/*
  # Add Studio Deliverables Table

  ## Summary
  Creates a master deliverables list per studio that can be assigned to packages
  and used in the quote builder.

  ## New Tables
  - `studio_deliverables`
    - `id` (uuid, primary key)
    - `studio_id` (uuid, foreign key to studios)
    - `name` (text) — deliverable label
    - `is_active` (boolean) — active/inactive toggle
    - `sort_order` (int) — ordering within the list
    - `created_at` / `updated_at` (timestamps)

  ## Modified Tables
  - `packages` — adds `deliverable_ids` (uuid[]) column to store which master
    deliverables are associated with the package

  ## Security
  - RLS enabled on `studio_deliverables`
  - Authenticated users can only access their own studio's deliverables
*/

CREATE TABLE IF NOT EXISTS studio_deliverables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE studio_deliverables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio members can select own deliverables"
  ON studio_deliverables FOR SELECT
  TO authenticated
  USING (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio members can insert own deliverables"
  ON studio_deliverables FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio members can update own deliverables"
  ON studio_deliverables FOR UPDATE
  TO authenticated
  USING (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio members can delete own deliverables"
  ON studio_deliverables FOR DELETE
  TO authenticated
  USING (
    studio_id IN (
      SELECT studio_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_studio_deliverables_studio_id
  ON studio_deliverables(studio_id);

-- Add deliverable_ids to packages table (stores selected master deliverable IDs)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'packages' AND column_name = 'deliverable_ids'
  ) THEN
    ALTER TABLE packages ADD COLUMN deliverable_ids uuid[] NOT NULL DEFAULT '{}';
  END IF;
END $$;
