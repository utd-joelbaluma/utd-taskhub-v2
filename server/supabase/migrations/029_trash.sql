-- ============================================================
-- UTD TaskHub v2 - Trash (admin-only recoverable deletes)
-- 029_trash.sql
-- ============================================================

-- 1. trash table -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trash (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  record_type  TEXT        NOT NULL,
  record_id    UUID        NOT NULL,
  name         TEXT,
  payload      JSONB       NOT NULL,
  deleted_by   UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  deleted_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_trash_record_type_deleted_at
  ON public.trash (record_type, deleted_at DESC);
CREATE INDEX IF NOT EXISTS idx_trash_deleted_by
  ON public.trash (deleted_by);
CREATE INDEX IF NOT EXISTS idx_trash_record_id
  ON public.trash (record_id);

-- 2. capture trigger function ---------------------------------------------
CREATE OR REPLACE FUNCTION public.capture_trash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleter UUID;
  label   TEXT;
BEGIN
  -- Skip if a recent trash row already exists for this record
  -- (handles user delete which manually inserts before cascade fires the trigger)
  IF EXISTS (
    SELECT 1 FROM public.trash
    WHERE record_type = TG_TABLE_NAME
      AND record_id = OLD.id
      AND deleted_at > NOW() - INTERVAL '60 seconds'
  ) THEN
    RETURN OLD;
  END IF;

  BEGIN
    deleter := NULLIF(current_setting('app.deleted_by', true), '')::UUID;
  EXCEPTION WHEN OTHERS THEN
    deleter := NULL;
  END;

  IF deleter IS NULL THEN
    deleter := auth.uid();
  END IF;

  label := CASE TG_TABLE_NAME
    WHEN 'projects' THEN OLD.name
    WHEN 'tasks'    THEN OLD.title
    WHEN 'tickets'  THEN OLD.title
    WHEN 'sprints'  THEN OLD.name
    WHEN 'profiles' THEN COALESCE(OLD.full_name, OLD.email)
    ELSE NULL
  END;

  INSERT INTO public.trash (record_type, record_id, name, payload, deleted_by)
  VALUES (TG_TABLE_NAME, OLD.id, label, to_jsonb(OLD), deleter);

  RETURN OLD;
END;
$$;

-- 3. attach BEFORE DELETE triggers ----------------------------------------
DROP TRIGGER IF EXISTS trash_projects ON public.projects;
CREATE TRIGGER trash_projects BEFORE DELETE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.capture_trash();

DROP TRIGGER IF EXISTS trash_tasks ON public.tasks;
CREATE TRIGGER trash_tasks BEFORE DELETE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.capture_trash();

DROP TRIGGER IF EXISTS trash_tickets ON public.tickets;
CREATE TRIGGER trash_tickets BEFORE DELETE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.capture_trash();

DROP TRIGGER IF EXISTS trash_sprints ON public.sprints;
CREATE TRIGGER trash_sprints BEFORE DELETE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.capture_trash();

DROP TRIGGER IF EXISTS trash_profiles ON public.profiles;
CREATE TRIGGER trash_profiles BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.capture_trash();

-- 4. RLS: admin-only access ------------------------------------------------
ALTER TABLE public.trash ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "trash: admin read" ON public.trash;
CREATE POLICY "trash: admin read"
  ON public.trash FOR SELECT
  TO authenticated
  USING (public.has_global_permission('trash.manage'));

DROP POLICY IF EXISTS "trash: admin delete" ON public.trash;
CREATE POLICY "trash: admin delete"
  ON public.trash FOR DELETE
  TO authenticated
  USING (public.has_global_permission('trash.manage'));

-- 5. permission seed -------------------------------------------------------
INSERT INTO public.permissions (scope, key, description)
VALUES ('global', 'trash.manage', 'View, restore, and permanently delete trashed records.')
ON CONFLICT (scope, key) DO UPDATE SET description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.scope = r.scope
WHERE r.scope = 'global'
  AND r.key = 'admin'
  AND p.key = 'trash.manage'
ON CONFLICT DO NOTHING;

-- 6. helper RPC: delete with deleter context ------------------------------
-- Wraps SET LOCAL app.deleted_by + DELETE in a single transaction so the
-- BEFORE DELETE trigger sees the deleter id. Controllers call this RPC for
-- projects/tasks/tickets/sprints. profiles are deleted via auth admin api.
CREATE OR REPLACE FUNCTION public.delete_with_trash(
  table_name TEXT,
  record_id UUID,
  deleter UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected INT;
BEGIN
  IF table_name NOT IN ('projects', 'tasks', 'tickets', 'sprints') THEN
    RAISE EXCEPTION 'delete_with_trash: unsupported table %', table_name;
  END IF;

  PERFORM set_config('app.deleted_by', deleter::TEXT, true);

  EXECUTE format('DELETE FROM public.%I WHERE id = $1', table_name)
    USING record_id;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

-- 7. RPC: restore a trashed record ----------------------------------------
-- Strategy:
--   - fetch trash row
--   - for known nullable FKs: NULL them when the parent no longer exists
--   - for NOT NULL FKs (e.g. tasks.project_id, tasks.created_by): if the
--     parent is gone, raise a friendly error; controller surfaces as 400
--   - INSERT the payload back via jsonb_populate_record
--   - DELETE the trash row
-- profiles restore is rejected: auth.users row no longer exists.
CREATE OR REPLACE FUNCTION public.restore_trash_record(trash_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  t       public.trash%ROWTYPE;
  payload JSONB;
BEGIN
  SELECT * INTO t FROM public.trash WHERE id = trash_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'trash row not found' USING ERRCODE = 'P0002';
  END IF;

  IF t.record_type = 'profiles' THEN
    RAISE EXCEPTION 'profile restore not supported; re-invite user instead'
      USING ERRCODE = 'P0001';
  END IF;

  payload := t.payload;

  -- ---- Per-table FK scrub ----
  IF t.record_type = 'projects' THEN
    -- nullable FK: sprint_id
    IF payload ? 'sprint_id' AND payload->>'sprint_id' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.sprints s WHERE s.id = (payload->>'sprint_id')::UUID) THEN
        payload := payload || jsonb_build_object('sprint_id', NULL);
      END IF;
    END IF;
    -- NOT NULL: created_by
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = (payload->>'created_by')::UUID) THEN
      RAISE EXCEPTION 'cannot restore: creator no longer exists' USING ERRCODE = 'P0001';
    END IF;

  ELSIF t.record_type = 'tasks' THEN
    -- NOT NULL: project_id
    IF NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = (payload->>'project_id')::UUID) THEN
      RAISE EXCEPTION 'parent project no longer exists' USING ERRCODE = 'P0001';
    END IF;
    -- NOT NULL: created_by
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = (payload->>'created_by')::UUID) THEN
      RAISE EXCEPTION 'cannot restore: creator no longer exists' USING ERRCODE = 'P0001';
    END IF;
    -- nullable FKs
    IF payload ? 'board_column_id' AND payload->>'board_column_id' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.board_columns WHERE id = (payload->>'board_column_id')::UUID) THEN
        payload := payload || jsonb_build_object('board_column_id', NULL);
      END IF;
    END IF;
    IF payload ? 'ticket_id' AND payload->>'ticket_id' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.tickets WHERE id = (payload->>'ticket_id')::UUID) THEN
        payload := payload || jsonb_build_object('ticket_id', NULL);
      END IF;
    END IF;
    IF payload ? 'sprint_id' AND payload->>'sprint_id' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.sprints WHERE id = (payload->>'sprint_id')::UUID) THEN
        payload := payload || jsonb_build_object('sprint_id', NULL);
      END IF;
    END IF;
    IF payload ? 'assigned_to' AND payload->>'assigned_to' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = (payload->>'assigned_to')::UUID) THEN
        payload := payload || jsonb_build_object('assigned_to', NULL);
      END IF;
    END IF;
    IF payload ? 'parent_task_id' AND payload->>'parent_task_id' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE id = (payload->>'parent_task_id')::UUID) THEN
        payload := payload || jsonb_build_object('parent_task_id', NULL);
      END IF;
    END IF;

  ELSIF t.record_type = 'tickets' THEN
    IF NOT EXISTS (SELECT 1 FROM public.projects p WHERE p.id = (payload->>'project_id')::UUID) THEN
      RAISE EXCEPTION 'parent project no longer exists' USING ERRCODE = 'P0001';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = (payload->>'created_by')::UUID) THEN
      RAISE EXCEPTION 'cannot restore: creator no longer exists' USING ERRCODE = 'P0001';
    END IF;
    IF payload ? 'converted_task_id' AND payload->>'converted_task_id' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.tasks WHERE id = (payload->>'converted_task_id')::UUID) THEN
        payload := payload || jsonb_build_object('converted_task_id', NULL);
      END IF;
    END IF;
    IF payload ? 'assigned_to' AND payload->>'assigned_to' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = (payload->>'assigned_to')::UUID) THEN
        payload := payload || jsonb_build_object('assigned_to', NULL);
      END IF;
    END IF;
    IF payload ? 'closed_by' AND payload->>'closed_by' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = (payload->>'closed_by')::UUID) THEN
        payload := payload || jsonb_build_object('closed_by', NULL);
      END IF;
    END IF;

  ELSIF t.record_type = 'sprints' THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = (payload->>'created_by')::UUID) THEN
      RAISE EXCEPTION 'cannot restore: creator no longer exists' USING ERRCODE = 'P0001';
    END IF;
    IF payload ? 'project_id' AND payload->>'project_id' IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.projects WHERE id = (payload->>'project_id')::UUID) THEN
        payload := payload || jsonb_build_object('project_id', NULL);
      END IF;
    END IF;

  ELSE
    RAISE EXCEPTION 'restore: unsupported record_type %', t.record_type USING ERRCODE = 'P0001';
  END IF;

  -- Insert back into target table
  EXECUTE format(
    'INSERT INTO public.%I SELECT * FROM jsonb_populate_record(NULL::public.%I, $1)',
    t.record_type, t.record_type
  ) USING payload;

  DELETE FROM public.trash WHERE id = trash_id;

  RETURN payload;
END;
$$;
