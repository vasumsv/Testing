/*
  # Studio Portfolio Images

  1. New Tables
    - `studio_portfolio_images`
      - `id` (uuid, primary key)
      - `studio_id` (uuid, FK to studios)
      - `url` (text) - public URL of the uploaded image
      - `storage_path` (text) - path in Supabase storage
      - `caption` (text, optional) - image caption/label
      - `sort_order` (integer) - display order (0-9)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `studio_portfolio_images`
    - Studio owners can manage their own portfolio images
    - Public can read portfolio images (needed for quote PDFs)

  3. Constraints
    - Max 10 images per studio enforced at application level
    - sort_order for controlled display ordering
*/

CREATE TABLE IF NOT EXISTS studio_portfolio_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id uuid NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  url text NOT NULL,
  storage_path text NOT NULL,
  caption text DEFAULT '',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_portfolio_studio_id ON studio_portfolio_images(studio_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_sort_order ON studio_portfolio_images(studio_id, sort_order);

ALTER TABLE studio_portfolio_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Studio owners can view own portfolio images"
  ON studio_portfolio_images FOR SELECT
  TO authenticated
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE auth.uid()::text = (
        SELECT raw_user_meta_data->>'studio_id' FROM auth.users WHERE id = auth.uid()
      )
      OR email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Studio owners can insert portfolio images"
  ON studio_portfolio_images FOR INSERT
  TO authenticated
  WITH CHECK (
    studio_id IN (
      SELECT id FROM studios WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Studio owners can update portfolio images"
  ON studio_portfolio_images FOR UPDATE
  TO authenticated
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    studio_id IN (
      SELECT id FROM studios WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Studio owners can delete portfolio images"
  ON studio_portfolio_images FOR DELETE
  TO authenticated
  USING (
    studio_id IN (
      SELECT id FROM studios WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
