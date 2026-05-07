-- ============================================================
-- UTD TaskHub v2 - RBAC Roles and Permissions
-- 006_rbac_permissions.sql
-- ============================================================

CREATE TABLE IF NOT EXISTS public.roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       TEXT NOT NULL CHECK (scope IN ('global', 'project')),
  key         TEXT NOT NULL CHECK (key ~ '^[a-z][a-z0-9_]*$'),
  name        TEXT NOT NULL,
  description TEXT,
  is_system   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, key)
);

CREATE TABLE IF NOT EXISTS public.permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope       TEXT NOT NULL CHECK (scope IN ('global', 'project')),
  key         TEXT NOT NULL CHECK (key ~ '^[a-z][a-z0-9_.]*$'),
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (scope, key)
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role_id       UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX IF NOT EXISTS idx_roles_scope_key ON public.roles (scope, key);
CREATE INDEX IF NOT EXISTS idx_permissions_scope_key ON public.permissions (scope, key);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission_id ON public.role_permissions (permission_id);

DROP TRIGGER IF EXISTS trg_roles_updated_at ON public.roles;
CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON public.roles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

INSERT INTO public.roles (scope, key, name, description, is_system)
VALUES
  ('global', 'admin', 'Admin', 'Full application administration access.', TRUE),
  ('global', 'manager', 'Manager', 'Can coordinate users and projects.', TRUE),
  ('global', 'developer', 'Developer', 'Can work across assigned projects.', TRUE),
  ('global', 'user', 'User', 'Default application user.', TRUE),
  ('project', 'owner', 'Owner', 'Full project administration access.', TRUE),
  ('project', 'manager', 'Manager', 'Can manage project delivery.', TRUE),
  ('project', 'member', 'Member', 'Can contribute to project work.', TRUE),
  ('project', 'viewer', 'Viewer', 'Can read project work.', TRUE)
ON CONFLICT (scope, key) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    is_system = TRUE;

INSERT INTO public.permissions (scope, key, description)
VALUES
  ('global', 'users.read', 'Read users.'),
  ('global', 'users.manage', 'Manage users.'),
  ('global', 'users.invite', 'Invite users.'),
  ('global', 'roles.read', 'Read roles and permissions.'),
  ('global', 'roles.manage', 'Manage roles and permissions.'),
  ('global', 'profiles.read', 'Read profiles.'),
  ('global', 'profiles.manage', 'Manage profiles.'),
  ('global', 'projects.create', 'Create projects.'),
  ('global', 'projects.read_all', 'Read and administer all projects.'),
  ('project', 'project.read', 'Read project details.'),
  ('project', 'project.update', 'Update project details.'),
  ('project', 'project.delete', 'Delete projects.'),
  ('project', 'members.read', 'Read project members.'),
  ('project', 'members.manage', 'Manage project members.'),
  ('project', 'invitations.read', 'Read project invitations.'),
  ('project', 'invitations.manage', 'Manage project invitations.'),
  ('project', 'boards.read', 'Read boards.'),
  ('project', 'boards.manage', 'Manage boards.'),
  ('project', 'columns.read', 'Read board columns.'),
  ('project', 'columns.manage', 'Manage board columns.'),
  ('project', 'tasks.read', 'Read tasks.'),
  ('project', 'tasks.create', 'Create tasks.'),
  ('project', 'tasks.update', 'Update tasks.'),
  ('project', 'tasks.delete', 'Delete tasks.'),
  ('project', 'tasks.move', 'Move tasks.'),
  ('project', 'tickets.read', 'Read tickets.'),
  ('project', 'tickets.create', 'Create tickets.'),
  ('project', 'tickets.update', 'Update tickets.'),
  ('project', 'tickets.delete', 'Delete tickets.'),
  ('project', 'tickets.convert', 'Convert tickets to tasks.'),
  ('project', 'comments.read', 'Read comments.'),
  ('project', 'comments.create', 'Create comments.'),
  ('project', 'comments.update_own', 'Update own comments.'),
  ('project', 'comments.delete_own', 'Delete own comments.'),
  ('project', 'comments.moderate', 'Moderate comments.')
ON CONFLICT (scope, key) DO UPDATE
SET description = EXCLUDED.description;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.scope = r.scope
WHERE r.scope = 'global'
  AND (
    r.key = 'admin'
    OR (r.key = 'manager' AND p.key IN ('users.read', 'roles.read', 'profiles.read', 'projects.create'))
    OR (r.key = 'developer' AND p.key IN ('profiles.read', 'projects.create'))
    OR (r.key = 'user' AND p.key IN ('profiles.read', 'projects.create'))
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.scope = r.scope
WHERE r.scope = 'project'
  AND (
    r.key = 'owner'
    OR (r.key = 'manager' AND p.key <> 'project.delete')
    OR (r.key = 'member' AND p.key IN (
      'project.read', 'members.read', 'boards.read', 'columns.read',
      'tasks.read', 'tasks.create', 'tasks.update', 'tasks.move',
      'tickets.read', 'tickets.create', 'comments.read', 'comments.create',
      'comments.update_own', 'comments.delete_own'
    ))
    OR (r.key = 'viewer' AND p.key IN (
      'project.read', 'members.read', 'boards.read', 'columns.read',
      'tasks.read', 'tickets.read', 'comments.read'
    ))
  )
ON CONFLICT DO NOTHING;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

ALTER TABLE public.project_members
  ADD COLUMN IF NOT EXISTS role_id UUID REFERENCES public.roles(id);

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_format_check
  CHECK (role ~ '^[a-z][a-z0-9_]*$');

ALTER TABLE public.project_members
  DROP CONSTRAINT IF EXISTS project_members_role_check;

ALTER TABLE public.project_members
  ADD CONSTRAINT project_members_role_format_check
  CHECK (role ~ '^[a-z][a-z0-9_]*$');

UPDATE public.profiles p
SET role_id = r.id
FROM public.roles r
WHERE r.scope = 'global'
  AND r.key = p.role
  AND p.role_id IS NULL;

UPDATE public.profiles p
SET role_id = r.id
FROM public.roles r
WHERE r.scope = 'global'
  AND r.key = 'user'
  AND p.role_id IS NULL;

UPDATE public.project_members pm
SET role_id = r.id
FROM public.roles r
WHERE r.scope = 'project'
  AND r.key = pm.role
  AND pm.role_id IS NULL;

UPDATE public.project_members pm
SET role_id = r.id
FROM public.roles r
WHERE r.scope = 'project'
  AND r.key = 'member'
  AND pm.role_id IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN role_id SET NOT NULL;

ALTER TABLE public.project_members
  ALTER COLUMN role_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_role_id ON public.profiles (role_id);
CREATE INDEX IF NOT EXISTS idx_project_members_role_id ON public.project_members (role_id);

CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role_id IS NULL THEN
    SELECT id INTO NEW.role_id
    FROM public.roles
    WHERE scope = 'global' AND key = COALESCE(NEW.role, 'user');
  END IF;

  IF NEW.role_id IS NOT NULL THEN
    SELECT key INTO NEW.role
    FROM public.roles
    WHERE id = NEW.role_id AND scope = 'global';

    IF NEW.role IS NULL THEN
      RAISE EXCEPTION 'profiles.role_id must reference a global role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sync_project_member_role()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role_id IS NULL THEN
    SELECT id INTO NEW.role_id
    FROM public.roles
    WHERE scope = 'project' AND key = COALESCE(NEW.role, 'member');
  END IF;

  IF NEW.role_id IS NOT NULL THEN
    SELECT key INTO NEW.role
    FROM public.roles
    WHERE id = NEW.role_id AND scope = 'project';

    IF NEW.role IS NULL THEN
      RAISE EXCEPTION 'project_members.role_id must reference a project role';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_profiles_sync_role ON public.profiles;
CREATE TRIGGER trg_profiles_sync_role
  BEFORE INSERT OR UPDATE OF role, role_id ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();

DROP TRIGGER IF EXISTS trg_project_members_sync_role ON public.project_members;
CREATE TRIGGER trg_project_members_sync_role
  BEFORE INSERT OR UPDATE OF role, role_id ON public.project_members
  FOR EACH ROW EXECUTE FUNCTION public.sync_project_member_role();

CREATE OR REPLACE FUNCTION public.has_global_permission(permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles pr
    JOIN public.roles r ON r.id = pr.role_id
    JOIN public.role_permissions rp ON rp.role_id = r.id
    JOIN public.permissions p ON p.id = rp.permission_id
    WHERE pr.id = auth.uid()
      AND pr.status <> 'disabled'
      AND r.scope = 'global'
      AND p.scope = 'global'
      AND p.key = permission_key
  );
$$;

CREATE OR REPLACE FUNCTION public.has_project_permission(project_uuid UUID, permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT public.has_global_permission('projects.read_all')
    OR EXISTS (
      SELECT 1
      FROM public.project_members pm
      JOIN public.roles r ON r.id = pm.role_id
      JOIN public.role_permissions rp ON rp.role_id = r.id
      JOIN public.permissions p ON p.id = rp.permission_id
      JOIN public.profiles pr ON pr.id = pm.user_id
      WHERE pm.project_id = project_uuid
        AND pm.user_id = auth.uid()
        AND pr.status <> 'disabled'
        AND r.scope = 'project'
        AND p.scope = 'project'
        AND p.key = permission_key
    );
$$;

CREATE OR REPLACE FUNCTION public.is_project_member(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT public.has_project_permission(project_uuid, 'project.read');
$$;

CREATE OR REPLACE FUNCTION public.is_project_manager_or_owner(project_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER STABLE
AS $$
  SELECT public.has_project_permission(project_uuid, 'members.manage');
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  default_role_id UUID;
BEGIN
  SELECT id INTO default_role_id
  FROM public.roles
  WHERE scope = 'global' AND key = 'user';

  INSERT INTO public.profiles (id, email, full_name, avatar_url, role_id, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL),
    default_role_id,
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

ALTER TABLE public.roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permissions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles: permitted users can read" ON public.roles;
CREATE POLICY "roles: permitted users can read"
  ON public.roles FOR SELECT
  TO authenticated
  USING (public.has_global_permission('roles.read') OR public.has_global_permission('roles.manage'));

DROP POLICY IF EXISTS "roles: permitted users can insert" ON public.roles;
CREATE POLICY "roles: permitted users can insert"
  ON public.roles FOR INSERT
  TO authenticated
  WITH CHECK (public.has_global_permission('roles.manage'));

DROP POLICY IF EXISTS "roles: permitted users can update" ON public.roles;
CREATE POLICY "roles: permitted users can update"
  ON public.roles FOR UPDATE
  TO authenticated
  USING (public.has_global_permission('roles.manage'))
  WITH CHECK (public.has_global_permission('roles.manage'));

DROP POLICY IF EXISTS "roles: permitted users can delete" ON public.roles;
CREATE POLICY "roles: permitted users can delete"
  ON public.roles FOR DELETE
  TO authenticated
  USING (public.has_global_permission('roles.manage') AND is_system = FALSE);

DROP POLICY IF EXISTS "permissions: permitted users can read" ON public.permissions;
CREATE POLICY "permissions: permitted users can read"
  ON public.permissions FOR SELECT
  TO authenticated
  USING (public.has_global_permission('roles.read') OR public.has_global_permission('roles.manage'));

DROP POLICY IF EXISTS "role_permissions: permitted users can read" ON public.role_permissions;
CREATE POLICY "role_permissions: permitted users can read"
  ON public.role_permissions FOR SELECT
  TO authenticated
  USING (public.has_global_permission('roles.read') OR public.has_global_permission('roles.manage'));

DROP POLICY IF EXISTS "role_permissions: permitted users can insert" ON public.role_permissions;
CREATE POLICY "role_permissions: permitted users can insert"
  ON public.role_permissions FOR INSERT
  TO authenticated
  WITH CHECK (public.has_global_permission('roles.manage'));

DROP POLICY IF EXISTS "role_permissions: permitted users can delete" ON public.role_permissions;
CREATE POLICY "role_permissions: permitted users can delete"
  ON public.role_permissions FOR DELETE
  TO authenticated
  USING (public.has_global_permission('roles.manage'));

DROP POLICY IF EXISTS "profiles: authenticated can read" ON public.profiles;
CREATE POLICY "profiles: permitted users can read"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.has_global_permission('profiles.read') OR public.has_global_permission('profiles.manage'));

DROP POLICY IF EXISTS "profiles: user can update own" ON public.profiles;
CREATE POLICY "profiles: permitted users can update"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_global_permission('profiles.manage'))
  WITH CHECK (public.has_global_permission('profiles.manage'));

DROP POLICY IF EXISTS "projects: members can read" ON public.projects;
CREATE POLICY "projects: permitted users can read"
  ON public.projects FOR SELECT
  TO authenticated
  USING (public.has_project_permission(id, 'project.read'));

DROP POLICY IF EXISTS "projects: authenticated can create" ON public.projects;
CREATE POLICY "projects: permitted users can create"
  ON public.projects FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_global_permission('projects.create'));

DROP POLICY IF EXISTS "projects: owner or manager can update" ON public.projects;
CREATE POLICY "projects: permitted users can update"
  ON public.projects FOR UPDATE
  TO authenticated
  USING (public.has_project_permission(id, 'project.update'))
  WITH CHECK (public.has_project_permission(id, 'project.update'));

DROP POLICY IF EXISTS "projects: owner can delete" ON public.projects;
CREATE POLICY "projects: permitted users can delete"
  ON public.projects FOR DELETE
  TO authenticated
  USING (public.has_project_permission(id, 'project.delete'));

DROP POLICY IF EXISTS "project_members: members can read" ON public.project_members;
CREATE POLICY "project_members: permitted users can read"
  ON public.project_members FOR SELECT
  TO authenticated
  USING (public.has_project_permission(project_id, 'members.read'));

DROP POLICY IF EXISTS "project_members: owner or manager can insert" ON public.project_members;
CREATE POLICY "project_members: permitted users can insert"
  ON public.project_members FOR INSERT
  TO authenticated
  WITH CHECK (
    public.has_project_permission(project_id, 'members.manage')
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = project_id AND p.created_by = auth.uid()
    )
  );

DROP POLICY IF EXISTS "project_members: owner or manager can update" ON public.project_members;
CREATE POLICY "project_members: permitted users can update"
  ON public.project_members FOR UPDATE
  TO authenticated
  USING (public.has_project_permission(project_id, 'members.manage'))
  WITH CHECK (public.has_project_permission(project_id, 'members.manage'));

DROP POLICY IF EXISTS "project_members: owner or manager can delete" ON public.project_members;
CREATE POLICY "project_members: permitted users can delete"
  ON public.project_members FOR DELETE
  TO authenticated
  USING (public.has_project_permission(project_id, 'members.manage'));

DROP POLICY IF EXISTS "boards: members can read" ON public.boards;
CREATE POLICY "boards: permitted users can read"
  ON public.boards FOR SELECT
  TO authenticated
  USING (public.has_project_permission(project_id, 'boards.read'));

DROP POLICY IF EXISTS "boards: owner or manager can insert" ON public.boards;
CREATE POLICY "boards: permitted users can insert"
  ON public.boards FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_project_permission(project_id, 'boards.manage'));

DROP POLICY IF EXISTS "boards: owner or manager can update" ON public.boards;
CREATE POLICY "boards: permitted users can update"
  ON public.boards FOR UPDATE
  TO authenticated
  USING (public.has_project_permission(project_id, 'boards.manage'))
  WITH CHECK (public.has_project_permission(project_id, 'boards.manage'));

DROP POLICY IF EXISTS "boards: owner or manager can delete" ON public.boards;
CREATE POLICY "boards: permitted users can delete"
  ON public.boards FOR DELETE
  TO authenticated
  USING (public.has_project_permission(project_id, 'boards.manage'));

DROP POLICY IF EXISTS "board_columns: members can read" ON public.board_columns;
CREATE POLICY "board_columns: permitted users can read"
  ON public.board_columns FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.has_project_permission(b.project_id, 'columns.read')
  ));

DROP POLICY IF EXISTS "board_columns: owner or manager can insert" ON public.board_columns;
CREATE POLICY "board_columns: permitted users can insert"
  ON public.board_columns FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.has_project_permission(b.project_id, 'columns.manage')
  ));

DROP POLICY IF EXISTS "board_columns: owner or manager can update" ON public.board_columns;
CREATE POLICY "board_columns: permitted users can update"
  ON public.board_columns FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.has_project_permission(b.project_id, 'columns.manage')
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.has_project_permission(b.project_id, 'columns.manage')
  ));

DROP POLICY IF EXISTS "board_columns: owner or manager can delete" ON public.board_columns;
CREATE POLICY "board_columns: permitted users can delete"
  ON public.board_columns FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.boards b
    WHERE b.id = board_id AND public.has_project_permission(b.project_id, 'columns.manage')
  ));

DROP POLICY IF EXISTS "tasks: members can read" ON public.tasks;
CREATE POLICY "tasks: permitted users can read"
  ON public.tasks FOR SELECT
  TO authenticated
  USING (public.has_project_permission(project_id, 'tasks.read'));

DROP POLICY IF EXISTS "tasks: members can insert" ON public.tasks;
CREATE POLICY "tasks: permitted users can insert"
  ON public.tasks FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_project_permission(project_id, 'tasks.create'));

DROP POLICY IF EXISTS "tasks: members can update" ON public.tasks;
CREATE POLICY "tasks: permitted users can update"
  ON public.tasks FOR UPDATE
  TO authenticated
  USING (public.has_project_permission(project_id, 'tasks.update') OR public.has_project_permission(project_id, 'tasks.move'))
  WITH CHECK (public.has_project_permission(project_id, 'tasks.update') OR public.has_project_permission(project_id, 'tasks.move'));

DROP POLICY IF EXISTS "tasks: owner manager or creator can delete" ON public.tasks;
CREATE POLICY "tasks: permitted users can delete"
  ON public.tasks FOR DELETE
  TO authenticated
  USING (public.has_project_permission(project_id, 'tasks.delete'));

DROP POLICY IF EXISTS "tickets: members can read" ON public.tickets;
CREATE POLICY "tickets: permitted users can read"
  ON public.tickets FOR SELECT
  TO authenticated
  USING (public.has_project_permission(project_id, 'tickets.read'));

DROP POLICY IF EXISTS "tickets: members can insert" ON public.tickets;
CREATE POLICY "tickets: permitted users can insert"
  ON public.tickets FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND public.has_project_permission(project_id, 'tickets.create'));

DROP POLICY IF EXISTS "tickets: members can update" ON public.tickets;
CREATE POLICY "tickets: permitted users can update"
  ON public.tickets FOR UPDATE
  TO authenticated
  USING (public.has_project_permission(project_id, 'tickets.update') OR public.has_project_permission(project_id, 'tickets.convert'))
  WITH CHECK (public.has_project_permission(project_id, 'tickets.update') OR public.has_project_permission(project_id, 'tickets.convert'));

DROP POLICY IF EXISTS "tickets: owner manager or creator can delete" ON public.tickets;
CREATE POLICY "tickets: permitted users can delete"
  ON public.tickets FOR DELETE
  TO authenticated
  USING (public.has_project_permission(project_id, 'tickets.delete'));

DROP POLICY IF EXISTS "comments: members can read" ON public.comments;
CREATE POLICY "comments: permitted users can read"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    (parent_type = 'task' AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = parent_id AND public.has_project_permission(t.project_id, 'comments.read')
    ))
    OR
    (parent_type = 'ticket' AND EXISTS (
      SELECT 1 FROM public.tickets tk
      WHERE tk.id = parent_id AND public.has_project_permission(tk.project_id, 'comments.read')
    ))
  );

DROP POLICY IF EXISTS "comments: members can insert" ON public.comments;
CREATE POLICY "comments: permitted users can insert"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND (
      (parent_type = 'task' AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = parent_id AND public.has_project_permission(t.project_id, 'comments.create')
      ))
      OR
      (parent_type = 'ticket' AND EXISTS (
        SELECT 1 FROM public.tickets tk
        WHERE tk.id = parent_id AND public.has_project_permission(tk.project_id, 'comments.create')
      ))
    )
  );

DROP POLICY IF EXISTS "comments: creator can update" ON public.comments;
CREATE POLICY "comments: permitted users can update"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (
    created_by = auth.uid()
    AND (
      (parent_type = 'task' AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = parent_id AND public.has_project_permission(t.project_id, 'comments.update_own')
      ))
      OR
      (parent_type = 'ticket' AND EXISTS (
        SELECT 1 FROM public.tickets tk
        WHERE tk.id = parent_id AND public.has_project_permission(tk.project_id, 'comments.update_own')
      ))
    )
  )
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "comments: creator or manager can delete" ON public.comments;
CREATE POLICY "comments: permitted users can delete"
  ON public.comments FOR DELETE
  TO authenticated
  USING (
    (created_by = auth.uid() AND (
      (parent_type = 'task' AND EXISTS (
        SELECT 1 FROM public.tasks t
        WHERE t.id = parent_id AND public.has_project_permission(t.project_id, 'comments.delete_own')
      ))
      OR
      (parent_type = 'ticket' AND EXISTS (
        SELECT 1 FROM public.tickets tk
        WHERE tk.id = parent_id AND public.has_project_permission(tk.project_id, 'comments.delete_own')
      ))
    ))
    OR
    (parent_type = 'task' AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = parent_id AND public.has_project_permission(t.project_id, 'comments.moderate')
    ))
    OR
    (parent_type = 'ticket' AND EXISTS (
      SELECT 1 FROM public.tickets tk
      WHERE tk.id = parent_id AND public.has_project_permission(tk.project_id, 'comments.moderate')
    ))
  );

DROP POLICY IF EXISTS "invitations: owner manager or invitee can read" ON public.invitations;
CREATE POLICY "invitations: permitted users can read"
  ON public.invitations FOR SELECT
  TO authenticated
  USING (
    public.has_project_permission(project_id, 'invitations.read')
    OR email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "invitations: owner or manager can insert" ON public.invitations;
CREATE POLICY "invitations: permitted users can insert"
  ON public.invitations FOR INSERT
  TO authenticated
  WITH CHECK (invited_by = auth.uid() AND public.has_project_permission(project_id, 'invitations.manage'));

DROP POLICY IF EXISTS "invitations: owner or manager can update" ON public.invitations;
CREATE POLICY "invitations: permitted users can update"
  ON public.invitations FOR UPDATE
  TO authenticated
  USING (public.has_project_permission(project_id, 'invitations.manage'))
  WITH CHECK (public.has_project_permission(project_id, 'invitations.manage'));

DROP POLICY IF EXISTS "invitations: owner or manager can delete" ON public.invitations;
CREATE POLICY "invitations: permitted users can delete"
  ON public.invitations FOR DELETE
  TO authenticated
  USING (public.has_project_permission(project_id, 'invitations.manage'));

DROP POLICY IF EXISTS "activity_logs: members can read" ON public.activity_logs;
CREATE POLICY "activity_logs: permitted users can read"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (
    project_id IS NULL
    OR public.has_project_permission(project_id, 'project.read')
  );
