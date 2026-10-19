/*
  # Schedule daily PDF cleanup via pg_cron + pg_net (v2)

  ## Summary
  Replaces the previous placeholder cron job with a working one that uses
  the actual project URL and anon key to call the pdf-cleanup edge function
  via pg_net's net.http_post.

  ## Schedule
  - Runs daily at 02:00 UTC
  - Deletes PDFs in studio-assets older than 30 days
  - Only PDF files are touched; quote/invoice data is never modified
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- Remove any previously scheduled version
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'delete-old-quote-pdfs') THEN
    PERFORM cron.unschedule('delete-old-quote-pdfs');
  END IF;
END $$;

-- Schedule daily at 02:00 UTC using net.http_post (pg_net)
SELECT cron.schedule(
  'delete-old-quote-pdfs',
  '0 2 * * *',
  $cron$
    SELECT net.http_post(
      url     := 'https://trdszntygkluzwihxttu.supabase.co/functions/v1/pdf-cleanup',
      headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRyZHN6bnR5Z2tsdXp3aWh4dHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNjQzODIsImV4cCI6MjA5MDY0MDM4Mn0.y4TapqqRo_DyRzGxfTtMTBvEPbnYQt1tmMrytdNOImI"}'::jsonb,
      body    := '{}'::jsonb
    );
  $cron$
);
