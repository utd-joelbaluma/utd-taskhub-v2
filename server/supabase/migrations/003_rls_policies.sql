-- ============================================================
-- UTD TaskHub v2 - Row Level Security
-- 003_rls_policies.sql
-- ============================================================

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = project_uuid AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_project_manager_or_owner(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.project_members
    WHERE project_id = project_uuid
      AND user_id = auth.uid()
      AND role IN ('owner', 'manager')
  );
$$;

-- ============================================================
-- ENABLE RLS
-- ============================================================

ALTER TABLE public.profiles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_columns   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs   ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PROFILES
-- Inserts are handled by the SECURITY DEFINER trigger and the
-- service-role backend — no INSERT policy needed.
-- ============================================================

CREATE POLICY "profiles: authenticated can read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles: user can update own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- ============================================================
-- PROJECTS
-- ============================================================

CREATE POLICY "projects: members can read"
  ON public.projects FOR SELECT
  TO authenticated
  USING (is_project_member(id));

CREATE POLICY "projects: authenticated can create"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "projects: owner or manager can update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (is_project_manager_or_owner(id))
  WITH CHECK (is_project_manager_or_owner(id));

CREATE POLICY "projects: owner can delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_members
      WHERE project_id = id AND user_id = auth.uid() AND role = 'owner'
    )
  );

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================

CREATE POLICY "project_members: members can read"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (is_project_member(project_id));

CREATE POLICY "project_members: owner or manager can insert"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (is_project_manager_or_owner(project_id));

CREATE POLICY "project_members: owner or manager can update"
  ON public.project_members FOR UPDATE
  TO authenticated
  USING (is_project_manager_or_owner(project_id))
  WITH CHECK (is_project_manager_or_owner(project_id));

CREATE POLICY "project_members: owner or manager can delete"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (is_project_manager_or_owner(project_id));

-- ============================================================
-- BOARDS
-- ============================================================

CREATE POLICY "boards: members can read"
  ON public.boards FOR SELECT
  TO authenticated
  USING (is_project_member(project_id));

CREATE POLICY "boards: owner or manager can insert"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (
    is_project_manager_or_owner(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "boards: owner or manager can update"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (is_project_manager_or_owner(project_id))
  WITH CHECK (is_project_manager_or_owner(project_id));

CREATE POLICY "boards: owner or manager can delete"
  ON public.boards FOR DELETE
  TO authenticated
  USING (is_project_manager_or_owner(project_id));

-- ============================================================
-- BOARD COLUMNS
-- ============================================================

CREATE POLICY "board_columns: members can read"
  ON public.board_columns FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id AND is_project_member(b.project_id)
    )
  );

CREATE POLICY "board_columns: owner or manager can insert"
  ON public.board_columns FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id AND is_project_manager_or_owner(b.project_id)
    )
  );

CREATE POLICY "board_columns: owner or manager can update"
  ON public.board_columns FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id AND is_project_manager_or_owner(b.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id AND is_project_manager_or_owner(b.project_id)
    )
  );

CREATE POLICY "board_columns: owner or manager can delete"
  ON public.board_columns FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.boards b
      WHERE b.id = board_id AND is_project_manager_or_owner(b.project_id)
    )
  );

-- ============================================================
-- TASKS
-- ============================================================

CREATE POLICY "tasks: members can read"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (is_project_member(project_id));

CREATE POLICY "tasks: members can insert"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (
    is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "tasks: members can update"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "tasks: owner manager or creator can delete"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (
    is_project_manager_or_owner(project_id)
    OR created_by = auth.uid()
  );

-- ============================================================
-- TICKETS
-- ============================================================

CREATE POLICY "tickets: members can read"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (is_project_member(project_id));

CREATE POLICY "tickets: members can insert"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (
    is_project_member(project_id)
    AND created_by = auth.uid()
  );

CREATE POLICY "tickets: members can update"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (is_project_member(project_id))
  WITH CHECK (is_project_member(project_id));

CREATE POLICY "tickets: owner manager or creator can delete"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (
    is_project_manager_or_owner(project_id)
    OR created_by = auth.uid()
  );

-- ============================================================
-- COMMENTS
-- Comments are linked to tasks/tickets via parent_type + parent_id.
-- Access is derived from the parent entity's project membership.
-- ============================================================

CREATE POLICY "comments: members can read"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    (parent_type = 'task' AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = parent_id AND is_project_member(t.project_id)
    ))
    OR
    (parent_type = 'ticket' AND EXISTS (
      SELECT 1 FROM public.tickets tk
      WHERE tk.id = parent_id AND is_project_member(tk.project_id)
    ))
  );

CREATE POLICY "comments: members can insert"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      (parent_type = 'task' AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = parent_id AND is_project_member(t.project_id)
      ))
      OR
      (parent_type = 'ticket' AND EXISTS (
        SELECT 1 FROM public.tickets tk
        WHERE tk.id = parent_id AND is_project_member(tk.project_id)
      ))
    )
  );

CREATE POLICY "comments: creator can update"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "comments: creator or manager can delete"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid()
    OR (
      (parent_type = 'task' AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = parent_id AND is_project_manager_or_owner(t.project_id)
      ))
      OR
      (parent_type = 'ticket' AND EXISTS (
        SELECT 1 FROM public.tickets tk
        WHERE tk.id = parent_id AND is_project_manager_or_owner(tk.project_id)
      ))
    )
  );

-- ============================================================
-- INVITATIONS
-- ============================================================

CREATE POLICY "invitations: owner manager or invitee can read"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (
    is_project_manager_or_owner(project_id)
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "invitations: owner or manager can insert"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (
    is_project_manager_or_owner(project_id)
    AND invited_by = auth.uid()
  );

CREATE POLICY "invitations: owner or manager can update"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (is_project_manager_or_owner(project_id))
  WITH CHECK (is_project_manager_or_owner(project_id));

CREATE POLICY "invitations: owner or manager can delete"
  ON public.invitations FOR DELETE
  TO authenticated
  USING (is_project_manager_or_owner(project_id));

-- ============================================================
-- ACTIVITY LOGS
-- Read-only for members. Writes go through SECURITY DEFINER
-- functions on the backend — no INSERT/UPDATE/DELETE policies.
-- ============================================================

CREATE POLICY "activity_logs: members can read"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL
    OR is_project_member(project_id)
  );
