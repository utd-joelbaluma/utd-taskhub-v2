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

  INSERT INTO public.notifications (user_id, type, title, body, data)
  SELECT p.id,
         'user.signed_up',
         'New user signed up',
         NEW.email,
         jsonb_build_object('new_user_id', NEW.id, 'email', NEW.email)
  FROM public.profiles p
  WHERE p.role = 'admin' AND p.id <> NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
