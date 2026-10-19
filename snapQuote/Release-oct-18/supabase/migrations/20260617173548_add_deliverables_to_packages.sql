ALTER TABLE packages ADD COLUMN IF NOT EXISTS deliverables text[] NOT NULL DEFAULT '{}';
