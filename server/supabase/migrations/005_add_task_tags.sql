ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX idx_tasks_tags ON public.tasks USING GIN (tags);
