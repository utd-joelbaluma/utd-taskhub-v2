CREATE TABLE IF NOT EXISTS public.user_sprint_capacity (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sprint_id      UUID        NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  capacity_hours INTEGER     NOT NULL DEFAULT 40,
  assigned_hours INTEGER     NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_sprint UNIQUE (user_id, sprint_id)
);

CREATE INDEX IF NOT EXISTS idx_usc_user_id   ON public.user_sprint_capacity (user_id);
CREATE INDEX IF NOT EXISTS idx_usc_sprint_id ON public.user_sprint_capacity (sprint_id);
