-- ============================================================
-- Migration: 009_project_icons
-- Adds selectable/uploaded icon metadata to projects.
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS icon_type  TEXT,
  ADD COLUMN IF NOT EXISTS icon_value TEXT;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_icon_type_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_icon_type_check
  CHECK (icon_type IS NULL OR icon_type IN ('icon', 'image'));
