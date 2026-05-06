-- ============================================================
-- Migration: 004_project_sprint_tags
-- Adds sprint_name, sprint_end_date, tags to projects.
-- Aligns status CHECK with application-level values.
-- ============================================================

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS sprint_name     TEXT,
  ADD COLUMN IF NOT EXISTS sprint_end_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tags            TEXT[] NOT NULL DEFAULT '{}';

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_status_check;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_status_check
  CHECK (status IN ('planning', 'in-progress', 'on-hold', 'completed'));

ALTER TABLE public.projects
  ALTER COLUMN status SET DEFAULT 'planning';
