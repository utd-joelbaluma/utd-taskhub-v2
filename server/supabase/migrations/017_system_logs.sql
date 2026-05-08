-- ============================================================
-- UTD TaskHub v2 - System Logs
-- 017_system_logs.sql
-- ============================================================

-- ============================================================
-- Table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.system_logs (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT        NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  table_name  TEXT        NOT NULL,
  record_id   UUID        NOT NULL,
  old_data    JSONB,
  new_data    JSONB,
  changed_by  UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- Indexes
-- ============================================================

CREATE INDEX idx_system_logs_table_name
  ON public.system_logs (table_name);

CREATE INDEX idx_system_logs_record_id
  ON public.system_logs (record_id);

CREATE INDEX idx_system_logs_changed_by
  ON public.system_logs (changed_by);

CREATE INDEX idx_system_logs_changed_at
  ON public.system_logs (changed_at DESC);

CREATE INDEX idx_system_logs_action
  ON public.system_logs (action);

CREATE INDEX idx_system_logs_table_changed_at
  ON public.system_logs (table_name, changed_at DESC);

CREATE INDEX idx_system_logs_new_data
  ON public.system_logs USING GIN (new_data);

CREATE INDEX idx_system_logs_old_data
  ON public.system_logs USING GIN (old_data);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.system_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read; no INSERT/UPDATE/DELETE policies for authenticated
-- (writes come exclusively from the SECURITY DEFINER trigger below)

CREATE POLICY "system_logs: admins can read"
  ON public.system_logs FOR SELECT
  TO authenticated
  USING (public.has_global_permission('logs.read'));

-- ============================================================
-- Trigger function
-- ============================================================

CREATE OR REPLACE FUNCTION public.log_crud_action()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.system_logs (action, table_name, record_id, old_data, new_data, changed_by)
    VALUES ('INSERT', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW), auth.uid());

  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO public.system_logs (action, table_name, record_id, old_data, new_data, changed_by)
    VALUES ('UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid());

  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.system_logs (action, table_name, record_id, old_data, new_data, changed_by)
    VALUES ('DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL, auth.uid());
  END IF;

  RETURN NULL;
END;
$$;

-- ============================================================
-- Triggers (10 tables)
-- ============================================================

DROP TRIGGER IF EXISTS trg_projects_audit ON public.projects;
CREATE TRIGGER trg_projects_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_tasks_audit ON public.tasks;
CREATE TRIGGER trg_tasks_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_tickets_audit ON public.tickets;
CREATE TRIGGER trg_tickets_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_boards_audit ON public.boards;
CREATE TRIGGER trg_boards_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_board_columns_audit ON public.board_columns;
CREATE TRIGGER trg_board_columns_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.board_columns
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_comments_audit ON public.comments;
CREATE TRIGGER trg_comments_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_project_members_audit ON public.project_members;
CREATE TRIGGER trg_project_members_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_profiles_audit ON public.profiles;
CREATE TRIGGER trg_profiles_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_sprints_audit ON public.sprints;
CREATE TRIGGER trg_sprints_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

DROP TRIGGER IF EXISTS trg_workspace_settings_audit ON public.workspace_settings;
CREATE TRIGGER trg_workspace_settings_audit
  AFTER INSERT OR UPDATE OR DELETE ON public.workspace_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_crud_action();

-- ============================================================
-- Permission seeding
-- ============================================================

INSERT INTO public.permissions (scope, key, description)
VALUES ('global', 'logs.read', 'Read system audit logs.')
ON CONFLICT (scope, key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.scope = r.scope
WHERE r.scope = 'global'
  AND r.key = 'admin'
  AND p.key = 'logs.read'
ON CONFLICT DO NOTHING;
