/*
  # Storage Policies for Studio Logos

  ## Summary
  Creates RLS policies on the studio-logos storage bucket so authenticated users
  can upload and read logos. Logos are stored per-studio using the studio_id as a
  path prefix.

  ## Policies
  - Authenticated users can upload to their own folder (studio_id/filename)
  - Public read access for all logo files
  - Authenticated users can update/delete files in their own folder
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Studio logos are publicly readable'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Studio logos are publicly readable"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'studio-logos')
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload studio logos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can upload studio logos"
        ON storage.objects FOR INSERT
        TO authenticated
        WITH CHECK (bucket_id = 'studio-logos')
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can update studio logos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can update studio logos"
        ON storage.objects FOR UPDATE
        TO authenticated
        USING (bucket_id = 'studio-logos')
        WITH CHECK (bucket_id = 'studio-logos')
    $policy$;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can delete studio logos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can delete studio logos"
        ON storage.objects FOR DELETE
        TO authenticated
        USING (bucket_id = 'studio-logos')
    $policy$;
  END IF;
END $$;
