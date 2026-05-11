-- Remove projects.create permission from developer global role
-- Developers are read-only for projects they are members of; they cannot create new projects
DELETE FROM public.role_permissions
WHERE role_id = (
  SELECT id FROM public.roles WHERE scope = 'global' AND key = 'developer'
)
AND permission_id = (
  SELECT id FROM public.permissions WHERE scope = 'global' AND key = 'projects.create'
);
