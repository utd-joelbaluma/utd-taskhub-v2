-- ============================================================
-- UTD TaskHub v2 - Trash trigger fix
-- 030_trash_fix_label.sql
--
-- The capture_trash() function referenced OLD.name / OLD.title /
-- OLD.full_name directly inside a CASE on TG_TABLE_NAME. PL/pgSQL
-- resolves those record field references at parse time for every
-- branch, so triggering on a table missing one of those columns
-- (e.g. `tasks` has no `name`) raised:
--   record "old" has no field "name"
-- Rewrite to source the label via to_jsonb(OLD), which tolerates
-- missing keys.
-- ============================================================

CREATE OR REPLACE FUNCTION public.capture_trash()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleter  UUID;
  label    TEXT;
  row_json JSONB;
BEGIN
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

  row_json := to_jsonb(OLD);

  label := CASE TG_TABLE_NAME
    WHEN 'projects' THEN row_json->>'name'
    WHEN 'tasks'    THEN row_json->>'title'
    WHEN 'tickets'  THEN row_json->>'title'
    WHEN 'sprints'  THEN row_json->>'name'
    WHEN 'profiles' THEN COALESCE(row_json->>'full_name', row_json->>'email')
    ELSE NULL
  END;

  INSERT INTO public.trash (record_type, record_id, name, payload, deleted_by)
  VALUES (TG_TABLE_NAME, OLD.id, label, row_json, deleter);

  RETURN OLD;
END;
$$;
