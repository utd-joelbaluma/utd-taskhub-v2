-- 023_user_sprint_capacity_rls.sql
-- RLS for user_sprint_capacity.
--
-- Model:
--   * Each user can read + update their own row.
--   * Platform admins/managers can read + manage every row.
--   * assigned_hours is backend-computed (tasks * estimated_time). Column-level
--     GRANT restricts authenticated UPDATE to capacity_hours only; service-role
--     backend keeps full write access for refresh logic.
--   * INSERT/DELETE limited to admin/manager (backend service role bypasses RLS
--     for upsert during refreshUserCapacity).

-- ---------------------------------------------------------------
-- Helper: platform-level admin/manager check
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_platform_admin_or_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'manager')
  );
$$;

-- ---------------------------------------------------------------
-- Enable RLS
-- ---------------------------------------------------------------
ALTER TABLE public.user_sprint_capacity ENABLE ROW LEVEL SECURITY;

-- Drop existing (idempotent re-run)
DROP POLICY IF EXISTS "usc: self or admin/manager can read"   ON public.user_sprint_capacity;
DROP POLICY IF EXISTS "usc: self or admin/manager can update" ON public.user_sprint_capacity;
DROP POLICY IF EXISTS "usc: admin/manager can insert"         ON public.user_sprint_capacity;
DROP POLICY IF EXISTS "usc: admin/manager can delete"         ON public.user_sprint_capacity;

-- ---------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------
CREATE POLICY "usc: self or admin/manager can read"
  ON public.user_sprint_capacity FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_platform_admin_or_manager()
  );

CREATE POLICY "usc: self or admin/manager can update"
  ON public.user_sprint_capacity FOR UPDATE
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_platform_admin_or_manager()
  )
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_platform_admin_or_manager()
  );

CREATE POLICY "usc: admin/manager can insert"
  ON public.user_sprint_capacity FOR INSERT
  TO authenticated
  WITH CHECK (public.is_platform_admin_or_manager());

CREATE POLICY "usc: admin/manager can delete"
  ON public.user_sprint_capacity FOR DELETE
  TO authenticated
  USING (public.is_platform_admin_or_manager());

-- ---------------------------------------------------------------
-- Column-level grants: authenticated may only update capacity_hours.
-- assigned_hours stays backend-managed (service role bypasses RLS + grants).
-- ---------------------------------------------------------------
REVOKE UPDATE ON public.user_sprint_capacity FROM authenticated;
GRANT  UPDATE (capacity_hours, updated_at) ON public.user_sprint_capacity TO authenticated;

-- Keep SELECT/INSERT/DELETE intact for authenticated; RLS narrows row visibility.
GRANT SELECT, INSERT, DELETE ON public.user_sprint_capacity TO authenticated;
