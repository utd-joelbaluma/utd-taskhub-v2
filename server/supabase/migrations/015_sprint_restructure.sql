-- Make sprints.project_id nullable (sprints are now org-level, not project-scoped)
ALTER TABLE sprints
  ALTER COLUMN project_id DROP NOT NULL;

-- Drop the per-project unique week constraint
DROP INDEX IF EXISTS idx_sprints_project_week;

-- Deduplicate sprints by start_date: keep the earliest-created row per week,
-- null out sprint_id on tasks that reference the deleted duplicates (FK is SET NULL),
-- then drop the duplicate rows.
DELETE FROM sprints
WHERE id IN (
  SELECT id FROM (
    SELECT id,
           ROW_NUMBER() OVER (PARTITION BY start_date ORDER BY created_at ASC) AS rn
    FROM sprints
  ) ranked
  WHERE rn > 1
);

-- Replace with a global unique-per-start-date constraint
CREATE UNIQUE INDEX idx_sprints_start_date ON sprints(start_date);

-- Add sprint_id to projects so a project can belong to a sprint
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES sprints(id) ON DELETE SET NULL;

CREATE INDEX idx_projects_sprint_id ON projects(sprint_id);
