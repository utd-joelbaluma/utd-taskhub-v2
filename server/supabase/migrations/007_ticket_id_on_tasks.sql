-- Add ticket_id to tasks for reference when a task is created from a ticket
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tasks_ticket_id ON public.tasks(ticket_id);
