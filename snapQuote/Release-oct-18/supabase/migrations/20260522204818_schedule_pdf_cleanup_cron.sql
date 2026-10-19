/*
  # Schedule daily PDF cleanup via pg_cron

  ## Summary
  Enables the pg_cron extension and schedules a daily job that calls the
  `pdf-cleanup` edge function to delete quote PDFs older than 30 days from
  the `studio-assets` storage bucket.

  ## Details
  - Extension: pg_cron (job scheduler for PostgreSQL)
  - Extension: pg_net (async HTTP client — required to call the edge function)
  - Schedule: daily at 02:00 UTC (low-traffic window)
  - Job name: "delete-old-quote-pdfs" (idempotent — safe to re-run migration)
  - Only PDF files are deleted; quote/invoice data is never touched

  ## Notes
  - The cleanup function walks {studioId}/quotes/{year}/{month}/ paths
  - Files are deleted in batches of 100 to respect Supabase limits
  - The cron job calls the deployed edge function over HTTPS
*/

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net  WITH SCHEMA extensions;

-- Remove any existing job with this name before (re-)creating it
SELECT cron.unschedule('delete-old-quote-pdfs')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'delete-old-quote-pdfs'
);

-- Schedule daily at 02:00 UTC
SELECT cron.schedule(
  'delete-old-quote-pdfs',
  '0 2 * * *',
  $$
  SELECT extensions.http_post(
    url     => (SELECT value->>'url' FROM public.platform_settings WHERE id = 'supabase_url')
              || '/functions/v1/pdf-cleanup',
    headers => jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (SELECT value->>'anon_key' FROM public.platform_settings WHERE id = 'supabase_url')
    ),
    body    => '{}'::jsonb
  );
  $$
);
