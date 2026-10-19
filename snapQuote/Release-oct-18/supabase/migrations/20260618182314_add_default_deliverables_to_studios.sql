-- Add default deliverables column to studios
ALTER TABLE studios ADD COLUMN IF NOT EXISTS default_deliverables text[] DEFAULT '{}';
