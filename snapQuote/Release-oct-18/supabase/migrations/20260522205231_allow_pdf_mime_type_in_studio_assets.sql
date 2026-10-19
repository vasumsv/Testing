/*
  # Allow PDF uploads in studio-assets bucket

  ## Change
  - Adds application/pdf to the allowed_mime_types list for the studio-assets bucket
  - Increases file_size_limit from 5 MB to 20 MB to accommodate quote PDFs

  ## Why
  Quote PDFs are generated client-side and uploaded to storage before being sent
  as Interakt WhatsApp document messages. The bucket previously only allowed image
  types, causing every PDF upload to fail with "mime type application/pdf is not
  supported".
*/

UPDATE storage.buckets
SET
  allowed_mime_types = ARRAY[
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf'
  ],
  file_size_limit = 20971520  -- 20 MB
WHERE id = 'studio-assets';
