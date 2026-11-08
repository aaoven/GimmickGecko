CREATE TABLE public.custom_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  statement text NOT NULL DEFAULT '',
  topic text NOT NULL DEFAULT '',
  concepts text[] NOT NULL DEFAULT '{}',
  difficulty integer NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  answer text NOT NULL,
  hints_revealed integer NOT NULL DEFAULT 0 CHECK (hints_revealed BETWEEN 0 AND 100),
  answer_revealed boolean NOT NULL DEFAULT false,
  attempted boolean NOT NULL DEFAULT false,
  solved boolean NOT NULL DEFAULT false,
  earned_stars integer NOT NULL DEFAULT 0 CHECK (earned_stars BETWEEN 0 AND 5),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_problems TO authenticated;
GRANT ALL ON public.custom_problems TO service_role;
ALTER TABLE public.custom_problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own custom problems" ON public.custom_problems FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE INDEX custom_problems_user_idx ON public.custom_problems(user_id);