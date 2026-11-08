CREATE OR REPLACE FUNCTION public.create_account_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles (id, username, display_name)
 VALUES (NEW.id, COALESCE(NULLIF(lower(trim(NEW.raw_user_meta_data ->> 'username')), ''), 'gecko_' || left(replace(NEW.id::text, '-', ''), 18)), left(COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''), 80));
 RETURN NEW;
END;
$$;
INSERT INTO public.profiles (id, username, display_name)
SELECT id, 'gecko_' || left(replace(id::text, '-', ''), 18), left(COALESCE(raw_user_meta_data ->> 'display_name', ''), 80) FROM auth.users ON CONFLICT (id) DO NOTHING;