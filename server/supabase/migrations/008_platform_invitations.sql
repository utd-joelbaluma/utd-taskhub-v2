-- ============================================================
-- UTD TaskHub v2
-- 008_platform_invitations.sql
-- Allow platform-level (non-project) invitations.
-- ============================================================

-- Allow invitations without a project context
ALTER TABLE public.invitations
  ALTER COLUMN project_id DROP NOT NULL;

-- Track when an invitation was cancelled
ALTER TABLE public.invitations
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Remove old role constraint if it only supports project-level roles
ALTER TABLE public.invitations
  DROP CONSTRAINT IF EXISTS invitations_role_check;

-- Add index for platform-level invitations
CREATE INDEX IF NOT EXISTS idx_invitations_platform
  ON public.invitations (email, status)
  WHERE project_id IS NULL;