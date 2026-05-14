-- 022_invitations_token_rpc.sql
-- Token-gated read + accept for anonymous (pre-auth) invitees.
-- Keeps invitations table locked under RLS while exposing two narrow RPCs.

DROP FUNCTION IF EXISTS public.get_invitation_by_token(text);
DROP FUNCTION IF EXISTS public.accept_invitation_by_token(text);

-- ---------------------------------------------------------------
-- 1. Read by token
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  email text,
  role text,
  status text,
  expires_at timestamptz,
  accepted_at timestamptz,
  requires_registration boolean
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.id,
    i.project_id,
    i.email,
    i.role,
    i.status,
    i.expires_at,
    i.accepted_at,
    NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.email = i.email) AS requires_registration
  FROM public.invitations i
  WHERE i.token = p_token
  LIMIT 1;
END;
$$;

-- ---------------------------------------------------------------
-- 2. Accept by token (atomic)
-- result values:
--   'accepted' | 'not_found' | 'expired' | 'already_accepted'
--   | 'cancelled' | 'requires_registration'
-- ---------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.accept_invitation_by_token(p_token text)
RETURNS TABLE (
  id uuid,
  project_id uuid,
  email text,
  role text,
  status text,
  result text,
  requires_registration boolean
)
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_inv public.invitations%ROWTYPE;
  v_requires_reg boolean;
BEGIN
  SELECT * INTO v_inv
  FROM public.invitations
  WHERE token = p_token
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT NULL::uuid, NULL::uuid, NULL::text, NULL::text, NULL::text,
           'not_found'::text, NULL::boolean;
    RETURN;
  END IF;

  IF v_inv.status = 'cancelled' THEN
    RETURN QUERY
    SELECT v_inv.id, v_inv.project_id, v_inv.email, v_inv.role, v_inv.status,
           'cancelled'::text, NULL::boolean;
    RETURN;
  END IF;

  IF v_inv.status = 'accepted' THEN
    RETURN QUERY
    SELECT v_inv.id, v_inv.project_id, v_inv.email, v_inv.role, v_inv.status,
           'already_accepted'::text, NULL::boolean;
    RETURN;
  END IF;

  IF v_inv.expires_at < now() THEN
    UPDATE public.invitations
       SET status = 'expired'
     WHERE id = v_inv.id
       AND status = 'pending';
    RETURN QUERY
    SELECT v_inv.id, v_inv.project_id, v_inv.email, v_inv.role,
           'expired'::text, 'expired'::text, NULL::boolean;
    RETURN;
  END IF;

  v_requires_reg := NOT EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.email = v_inv.email
  );

  IF v_requires_reg THEN
    RETURN QUERY
    SELECT v_inv.id, v_inv.project_id, v_inv.email, v_inv.role, v_inv.status,
           'requires_registration'::text, true;
    RETURN;
  END IF;

  UPDATE public.invitations
     SET status = 'accepted',
         accepted_at = now()
   WHERE id = v_inv.id;

  RETURN QUERY
  SELECT v_inv.id, v_inv.project_id, v_inv.email, v_inv.role,
         'accepted'::text, 'accepted'::text, false;
END;
$$;

-- ---------------------------------------------------------------
-- 3. Grants — anon + authenticated only, never PUBLIC
-- ---------------------------------------------------------------
REVOKE ALL ON FUNCTION public.get_invitation_by_token(text)    FROM PUBLIC;
REVOKE ALL ON FUNCTION public.accept_invitation_by_token(text) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_invitation_by_token(text) TO anon, authenticated;
