INSERT INTO public.user_roles (user_id, role)
SELECT '8c0828b8-ffd3-48af-b917-9c5d7a765ec6'::uuid, 'admin'::public.app_role
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.profiles (id, display_name)
VALUES ('8c0828b8-ffd3-48af-b917-9c5d7a765ec6'::uuid, 'Pharaoh Admin')
ON CONFLICT (id) DO UPDATE SET display_name = EXCLUDED.display_name;