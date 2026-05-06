-- ============================================================
-- UTD TaskHub v2 - Initial Schema Migration
-- 001_initial_schema.sql
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ============================================================
-- TRIGGER FUNCTION: auto-update updated_at
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TABLE: profiles
-- ============================================================

CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT NOT NULL UNIQUE,
  full_name    TEXT,
  avatar_url   TEXT,
  role         TEXT NOT NULL DEFAULT 'user'
               CHECK (role IN ('admin', 'manager', 'developer', 'user')),
  status       TEXT NOT NULL DEFAULT 'invited'
               CHECK (status IN ('active', 'invited', 'disabled')),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_profiles_email  ON public.profiles (email);
CREATE INDEX idx_profiles_role   ON public.profiles (role);
CREATE INDEX idx_profiles_status ON public.profiles (status);

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: projects
-- ============================================================

CREATE TABLE public.projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  description TEXT,
  status      TEXT NOT NULL DEFAULT 'active'
              CHECK (status IN ('active', 'completed', 'archived')),
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_projects_created_by ON public.projects (created_by);
CREATE INDEX idx_projects_status     ON public.projects (status);

CREATE TRIGGER trg_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: project_members
-- ============================================================

CREATE TABLE public.project_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id)  ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.profiles(id)  ON DELETE CASCADE,
  role       TEXT NOT NULL DEFAULT 'member'
             CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  joined_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_id, user_id)
);

CREATE INDEX idx_project_members_project_id ON public.project_members (project_id);
CREATE INDEX idx_project_members_user_id    ON public.project_members (user_id);
CREATE INDEX idx_project_members_role       ON public.project_members (role);

-- ============================================================
-- TABLE: boards
-- ============================================================

CREATE TABLE public.boards (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_boards_project_id ON public.boards (project_id);
CREATE INDEX idx_boards_created_by ON public.boards (created_by);

CREATE TRIGGER trg_boards_updated_at
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: board_columns
-- ============================================================

CREATE TABLE public.board_columns (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id   UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  status_key TEXT NOT NULL
             CHECK (status_key IN ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled')),
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_board_columns_board_id   ON public.board_columns (board_id);
CREATE INDEX idx_board_columns_status_key ON public.board_columns (status_key);
CREATE INDEX idx_board_columns_position   ON public.board_columns (board_id, position);

CREATE TRIGGER trg_board_columns_updated_at
  BEFORE UPDATE ON public.board_columns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: tasks
-- ============================================================

CREATE TABLE public.tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects(id)      ON DELETE CASCADE,
  board_column_id UUID          REFERENCES public.board_columns(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'backlog'
                  CHECK (status IN ('backlog', 'todo', 'in_progress', 'review', 'done', 'cancelled')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                  CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to     UUID          REFERENCES public.profiles(id)      ON DELETE SET NULL,
  created_by      UUID NOT NULL REFERENCES public.profiles(id)      ON DELETE RESTRICT,
  due_date        TIMESTAMPTZ,
  position        INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_project_id      ON public.tasks (project_id);
CREATE INDEX idx_tasks_board_column_id ON public.tasks (board_column_id);
CREATE INDEX idx_tasks_assigned_to     ON public.tasks (assigned_to);
CREATE INDEX idx_tasks_created_by      ON public.tasks (created_by);
CREATE INDEX idx_tasks_status          ON public.tasks (status);
CREATE INDEX idx_tasks_priority        ON public.tasks (priority);
CREATE INDEX idx_tasks_due_date        ON public.tasks (due_date);

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: tickets
-- ============================================================

CREATE TABLE public.tickets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  converted_task_id UUID          REFERENCES public.tasks(id)    ON DELETE SET NULL,
  title             TEXT NOT NULL,
  description       TEXT,
  type              TEXT NOT NULL DEFAULT 'issue'
                    CHECK (type IN ('bug', 'feature_request', 'issue', 'support', 'other')),
  status            TEXT NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open', 'in_review', 'resolved', 'closed', 'cancelled')),
  priority          TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to       UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_by        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  due_date          TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_project_id        ON public.tickets (project_id);
CREATE INDEX idx_tickets_converted_task_id ON public.tickets (converted_task_id);
CREATE INDEX idx_tickets_assigned_to       ON public.tickets (assigned_to);
CREATE INDEX idx_tickets_created_by        ON public.tickets (created_by);
CREATE INDEX idx_tickets_status            ON public.tickets (status);
CREATE INDEX idx_tickets_type              ON public.tickets (type);
CREATE INDEX idx_tickets_priority          ON public.tickets (priority);

CREATE TRIGGER trg_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: comments
-- ============================================================

CREATE TABLE public.comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_type TEXT NOT NULL
              CHECK (parent_type IN ('task', 'ticket')),
  parent_id   UUID NOT NULL,
  body        TEXT NOT NULL,
  created_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_parent     ON public.comments (parent_type, parent_id);
CREATE INDEX idx_comments_created_by ON public.comments (created_by);

CREATE TRIGGER trg_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- TABLE: invitations
-- ============================================================

CREATE TABLE public.invitations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  invited_by  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'member'
              CHECK (role IN ('owner', 'manager', 'member', 'viewer')),
  token       TEXT NOT NULL UNIQUE DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invitations_project_id ON public.invitations (project_id);
CREATE INDEX idx_invitations_email      ON public.invitations (email);
CREATE INDEX idx_invitations_token      ON public.invitations (token);
CREATE INDEX idx_invitations_status     ON public.invitations (status);
CREATE INDEX idx_invitations_expires_at ON public.invitations (expires_at);

-- ============================================================
-- TABLE: activity_logs
-- ============================================================

CREATE TABLE public.activity_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID          REFERENCES public.projects(id) ON DELETE SET NULL,
  actor_id    UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL
              CHECK (entity_type IN ('project', 'board', 'task', 'ticket', 'comment', 'user', 'project_member', 'invitation')),
  entity_id   UUID NOT NULL,
  action      TEXT NOT NULL,
  metadata    JSONB NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_project_id ON public.activity_logs (project_id);
CREATE INDEX idx_activity_logs_actor_id   ON public.activity_logs (actor_id);
CREATE INDEX idx_activity_logs_entity     ON public.activity_logs (entity_type, entity_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX idx_activity_logs_metadata   ON public.activity_logs USING GIN (metadata);
