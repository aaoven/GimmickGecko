ALTER TABLE public.problems
  ADD CONSTRAINT problems_difficulty_range CHECK (difficulty BETWEEN 1 AND 5);

COMMENT ON COLUMN public.problems.difficulty IS 'Difficulty rating from 1 (easiest) to 5 (hardest).'