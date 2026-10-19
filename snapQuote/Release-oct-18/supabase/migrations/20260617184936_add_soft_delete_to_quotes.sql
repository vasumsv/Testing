-- Add soft delete support to quotes
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_quotes_deleted_at ON quotes(deleted_at) WHERE deleted_at IS NULL;
