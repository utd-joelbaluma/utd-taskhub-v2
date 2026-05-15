-- Add short uppercase prefix key to projects (e.g. WEB, API)
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS key text;

-- Backfill existing rows: take first alpha chars of name, uppercase, slice 3
DO $$
DECLARE
  rec RECORD;
  base text;
  candidate text;
  suffix int;
BEGIN
  FOR rec IN
    SELECT id, name FROM public.projects WHERE key IS NULL ORDER BY created_at
  LOOP
    base := upper(regexp_replace(coalesce(rec.name, ''), '[^A-Za-z0-9]', '', 'g'));
    IF length(base) < 2 THEN
      base := 'PRJ';
    END IF;
    candidate := substr(base, 1, 4);
    suffix := 1;
    WHILE EXISTS (SELECT 1 FROM public.projects WHERE key = candidate) LOOP
      candidate := substr(base, 1, 3) || suffix::text;
      suffix := suffix + 1;
    END LOOP;
    UPDATE public.projects SET key = candidate WHERE id = rec.id;
  END LOOP;
END$$;

ALTER TABLE public.projects
  ALTER COLUMN key SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_key_unique'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_key_unique UNIQUE (key);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'projects_key_format_check'
  ) THEN
    ALTER TABLE public.projects
      ADD CONSTRAINT projects_key_format_check
      CHECK (key ~ '^[A-Z0-9]{2,10}$');
  END IF;
END$$;
