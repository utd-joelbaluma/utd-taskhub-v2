-- Add human-readable ticket_code (e.g. WEB-001), unique per project
ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS ticket_code text;

-- Backfill: number tickets per project in created_at order, prefix with project key
WITH numbered AS (
  SELECT
    t.id,
    p.key AS project_key,
    row_number() OVER (PARTITION BY t.project_id ORDER BY t.created_at, t.id) AS seq
  FROM public.tickets t
  JOIN public.projects p ON p.id = t.project_id
  WHERE t.ticket_code IS NULL
)
UPDATE public.tickets t
SET ticket_code = n.project_key || '-' || lpad(n.seq::text, 3, '0')
FROM numbered n
WHERE t.id = n.id;

ALTER TABLE public.tickets
  ALTER COLUMN ticket_code SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_project_code_unique'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_project_code_unique UNIQUE (project_id, ticket_code);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_code_format_check'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_code_format_check
      CHECK (ticket_code ~ '^[A-Z0-9][A-Z0-9-]{0,29}$');
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_tickets_project_code
  ON public.tickets (project_id, ticket_code);
