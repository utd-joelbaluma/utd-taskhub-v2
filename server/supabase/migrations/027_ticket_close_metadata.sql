ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS resolution text,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_by uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tickets_closed_by_fkey'
  ) THEN
    ALTER TABLE public.tickets
      ADD CONSTRAINT tickets_closed_by_fkey
      FOREIGN KEY (closed_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_tickets_closed_at
  ON public.tickets (closed_at DESC) WHERE closed_at IS NOT NULL;
