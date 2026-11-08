ALTER TABLE public.attempts ADD COLUMN earned_stars integer NOT NULL DEFAULT 0 CHECK (earned_stars BETWEEN 0 AND 5), ADD COLUMN possible_stars integer NOT NULL DEFAULT 1 CHECK (possible_stars BETWEEN 1 AND 5);
UPDATE public.attempts a SET possible_stars = p.difficulty, earned_stars = CASE WHEN a.correct THEN p.difficulty ELSE 0 END FROM public.problems p WHERE p.id = a.problem_id;
ALTER TABLE public.attempts ADD CONSTRAINT attempts_earned_within_possible CHECK (earned_stars <= possible_stars);
CREATE TABLE public.problem_help (user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE, problem_id uuid NOT NULL REFERENCES public.problems(id) ON DELETE CASCADE, hints_revealed integer NOT NULL DEFAULT 0 CHECK (hints_revealed BETWEEN 0 AND 100), answer_revealed boolean NOT NULL DEFAULT false, PRIMARY KEY(user_id, problem_id));
GRANT SELECT ON public.problem_help TO authenticated;
GRANT ALL ON public.problem_help TO service_role;
ALTER TABLE public.problem_help ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read own problem help" ON public.problem_help FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE FUNCTION public.save_problem_help(_problem_id uuid, _hints integer, _answer_revealed boolean DEFAULT false) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ BEGIN
IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
IF _hints IS NULL OR _hints < 0 OR _hints > 100 OR _answer_revealed IS NULL THEN RAISE EXCEPTION 'Invalid help count'; END IF;
INSERT INTO public.problem_help(user_id, problem_id, hints_revealed, answer_revealed) VALUES(auth.uid(), _problem_id, _hints, _answer_revealed) ON CONFLICT (user_id, problem_id) DO UPDATE SET hints_revealed = greatest(problem_help.hints_revealed, excluded.hints_revealed), answer_revealed = problem_help.answer_revealed OR excluded.answer_revealed;
END $$;
REVOKE ALL ON FUNCTION public.save_problem_help(uuid, integer, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_problem_help(uuid, integer, boolean) TO authenticated;
CREATE FUNCTION public.set_attempt_stars() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$ DECLARE rating integer; hints integer; shown boolean; BEGIN
SELECT difficulty INTO STRICT rating FROM public.problems WHERE id = NEW.problem_id;
SELECT hints_revealed, answer_revealed INTO hints, shown FROM public.problem_help WHERE user_id = NEW.user_id AND problem_id = NEW.problem_id;
NEW.possible_stars := rating;
NEW.earned_stars := CASE WHEN NEW.correct AND NOT coalesce(shown, false) THEN greatest(0, rating - coalesce(hints, 0)) ELSE 0 END;
RETURN NEW;
END $$;
CREATE TRIGGER calculate_attempt_stars BEFORE INSERT OR UPDATE ON public.attempts FOR EACH ROW EXECUTE FUNCTION public.set_attempt_stars();