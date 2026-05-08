-- ============================================================
-- UTD TaskHub v2 - Workspace Settings
-- 016_workspace_settings.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.workspace_settings (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_name     TEXT NOT NULL DEFAULT 'TaskHub HQ',
  workspace_timezone TEXT NOT NULL DEFAULT 'UTC',
  workspace_language TEXT NOT NULL DEFAULT 'en-us',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_workspace_settings_updated_at ON public.workspace_settings;
CREATE TRIGGER trg_workspace_settings_updated_at
  BEFORE UPDATE ON public.workspace_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed a single default row
INSERT INTO public.workspace_settings (workspace_name, workspace_timezone, workspace_language)
VALUES ('TaskHub HQ', 'UTC', 'en-us')
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.workspace_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_settings: admins can read" ON public.workspace_settings;
CREATE POLICY "workspace_settings: admins can read"
  ON public.workspace_settings FOR SELECT
  TO authenticated
  USING (public.has_global_permission('roles.read') OR public.has_global_permission('roles.manage'));

DROP POLICY IF EXISTS "workspace_settings: admins can update" ON public.workspace_settings;
CREATE POLICY "workspace_settings: admins can update"
  ON public.workspace_settings FOR UPDATE
  TO authenticated
  USING (public.has_global_permission('roles.manage'))
  WITH CHECK (public.has_global_permission('roles.manage'));
