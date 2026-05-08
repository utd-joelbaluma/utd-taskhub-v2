-- Add sprint_id to tasks so tasks can be assigned to a project sprint.
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_sprint_id ON public.tasks(sprint_id);
