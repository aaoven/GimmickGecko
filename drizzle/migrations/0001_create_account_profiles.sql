CREATE TABLE public.profiles (
 id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
 username text NOT NULL CHECK (username ~ '^[a-z0-9_]{3,24}$'),
 display_name text NOT NULL DEFAULT '' CHECK (char_length(display_name) <= 80),
 bio text NOT NULL DEFAULT '' CHECK (char_length(bio) <= 500),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (username)
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE FUNCTION public.create_account_profile() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
 INSERT INTO public.profiles (id, username, display_name)
 VALUES (NEW.id, COALESCE(NULLIF(lower(trim(NEW.raw_user_meta_data ->> 'username')), ''), 'gecko_' || replace(NEW.id::text, '-', '')), left(COALESCE(NEW.raw_user_meta_data ->> 'display_name', ''), 80));
 RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.create_account_profile() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER on_account_signup AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_account_profile();