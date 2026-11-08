ALTER TABLE public.custom_problems ADD COLUMN incorrect_answers integer NOT NULL DEFAULT 0 CHECK (incorrect_answers >= 0);
CREATE OR REPLACE FUNCTION public.set_attempt_stars() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE rating integer; hints integer; shown boolean; misses integer; already_solved boolean;
BEGIN
SELECT difficulty INTO STRICT rating FROM public.problems WHERE id = NEW.problem_id;
INSERT INTO public.problem_help(user_id, problem_id, hints_revealed, answer_revealed) VALUES(NEW.user_id, NEW.problem_id, 0, false) ON CONFLICT (user_id, problem_id) DO NOTHING;
SELECT hints_revealed, answer_revealed INTO hints, shown FROM public.problem_help WHERE user_id=NEW.user_id AND problem_id=NEW.problem_id FOR UPDATE;
SELECT count(*) FILTER (WHERE NOT correct), coalesce(bool_or(correct), false) INTO misses, already_solved FROM public.attempts WHERE user_id=NEW.user_id AND problem_id=NEW.problem_id AND id IS DISTINCT FROM NEW.id;
NEW.possible_stars := rating;
NEW.earned_stars := CASE WHEN NEW.correct AND NOT shown AND NOT already_solved THEN greatest(0, rating-hints-misses) ELSE 0 END;
RETURN NEW;
END $$;
CREATE OR REPLACE FUNCTION public.grade_custom_answer(_id uuid, _user_id uuid, _correct boolean) RETURNS TABLE(correct boolean, earned_stars integer, possible_stars integer) LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE row public.custom_problems; award integer;
BEGIN
SELECT * INTO row FROM public.custom_problems WHERE id=_id AND user_id=_user_id FOR UPDATE;
IF NOT FOUND THEN RAISE EXCEPTION 'Problem not found'; END IF;
award := CASE WHEN _correct AND NOT row.solved AND NOT row.answer_revealed THEN greatest(0,row.difficulty-row.hints_revealed-row.incorrect_answers) ELSE 0 END;
UPDATE public.custom_problems SET attempted=true, solved=row.solved OR _correct, earned_stars=greatest(row.earned_stars,award), incorrect_answers=row.incorrect_answers + CASE WHEN NOT _correct AND NOT row.solved THEN 1 ELSE 0 END WHERE id=_id;
RETURN QUERY SELECT _correct, award, row.difficulty;
END $$;
REVOKE ALL ON FUNCTION public.grade_custom_answer(uuid,uuid,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.grade_custom_answer(uuid,uuid,boolean) TO service_role;