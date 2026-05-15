ALTER TABLE public.tasks
    ADD COLUMN IF NOT EXISTS parent_task_id UUID
    REFERENCES public.tasks(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS tasks_parent_task_id_idx
    ON public.tasks(parent_task_id);
