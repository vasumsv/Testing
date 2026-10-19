/*
  # Add Deliverable Groups Table

  ## Summary
  Upgrades the deliverables system from a flat list of individual deliverable names
  to structured deliverable groups. Each group has a name and an array of bullet-point items.

  ## New Tables
  - `studio_deliverable_groups`
    - `id` (uuid, primary key)
    - `studio_id` (uuid, FK to studios)
    - `name` (text) — group name, e.g. "Wedding Photography", "Premium Video"
    - `points` (text[]) — ordered list of deliverable bullet points
    - `is_active` (boolean, default true)
    - `sort_order` (int, default 0)
    - `created_at`, `updated_at` timestamps

  ## Changes to Existing Tables
  - `packages` table: add `deliverable_group_ids` (uuid[]) column to store selected group IDs
    (replaces old `deliverable_ids` text[] which referenced individual deliverable names)

  ## Security
  - RLS enabled on new table
  - Studio owners can fully manage their own groups
  - No public read (groups are only used internally)
*/

CREATE TABLE IF NOT EXISTS studio_deliverable_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  points text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE studio_deliverable_groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can select own deliverable groups"
  ON studio_deliverable_groups FOR SELECT
  TO authenticated
  USING (
    studio_id IN (
      SELECT studio_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can insert own deliverable groups"
  ON studio_deliverable_groups FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can update own deliverable groups"
  ON studio_deliverable_groups FOR UPDATE
  TO authenticated
  USING (
    studio_id IN (
      SELECT studio_id FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT studio_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can delete own deliverable groups"
  ON studio_deliverable_groups FOR DELETE
  TO authenticated
  USING (
    studio_id IN (
      SELECT studio_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Add deliverable_group_ids column to packages (nullable uuid array)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'packages' AND column_name = 'deliverable_group_ids'
  ) THEN
    ALTER TABLE packages ADD COLUMN deliverable_group_ids uuid[] DEFAULT '{}';
  END IF;
END $$;
