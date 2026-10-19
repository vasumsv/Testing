-- Drop deliverable group IDs column from packages
ALTER TABLE packages DROP COLUMN IF EXISTS deliverable_group_ids;

-- Drop deliverable IDs column from packages
ALTER TABLE packages DROP COLUMN IF EXISTS deliverable_ids;

-- Drop studio deliverable groups table
DROP TABLE IF EXISTS studio_deliverable_groups CASCADE;

-- Drop studio deliverables table
DROP TABLE IF EXISTS studio_deliverables CASCADE;
