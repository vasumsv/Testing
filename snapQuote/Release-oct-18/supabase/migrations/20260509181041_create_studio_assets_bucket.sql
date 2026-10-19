/*
  # Create studio-assets storage bucket

  1. New Bucket
    - `studio-assets` — public bucket for studio watermark images and other branding assets
    - 5 MB file size limit
    - Allows JPEG, PNG, WebP image formats

  2. Security
    - Public read access for all users (images are served in quotes/previews)
    - Authenticated users can upload/update/delete only within their own studio folder
    - Folder structure: {studio_id}/filename
    - Ownership checked via profiles table: profiles.id = auth.uid() AND profiles.studio_id matches folder
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'studio-assets',
  'studio-assets',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read studio assets"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'studio-assets');

CREATE POLICY "Studio owners can upload assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'studio-assets'
    AND (storage.foldername(name))[1] = (
      SELECT studio_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can update assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'studio-assets'
    AND (storage.foldername(name))[1] = (
      SELECT studio_id::text FROM public.profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'studio-assets'
    AND (storage.foldername(name))[1] = (
      SELECT studio_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Studio owners can delete assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'studio-assets'
    AND (storage.foldername(name))[1] = (
      SELECT studio_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );
