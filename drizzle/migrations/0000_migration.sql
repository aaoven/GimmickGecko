CREATE TABLE public.problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contest text NOT NULL,
  year int NOT NULL,
  problem_number int,
  statement text NOT NULL,
  answer text,
  concepts text[] NOT NULL DEFAULT '{}',
  difficulty int NOT NULL DEFAULT 3,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.problems TO anon, authenticated;
GRANT ALL ON public.problems TO service_role;
ALTER TABLE public.problems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Problems are public" ON public.problems FOR SELECT TO anon, authenticated USING (true);

INSERT INTO public.problems (contest, year, problem_number, statement, answer, concepts, difficulty) VALUES
('AIME', 1983, 1, 'Let x, y, and z all exceed 1 and let w be a positive number such that log_x w = 24, log_y w = 40, and log_{xyz} w = 12. Find log_z w.', '60', ARRAY['Logarithms','Change of Base','Algebra'], 2),
('AIME', 1983, 2, 'Let f(x) = |x − p| + |x − 15| + |x − p − 15|, where 0 < p < 15. Determine the minimum value taken by f(x) for x in the interval p ≤ x ≤ 15.', '15', ARRAY['Absolute Value','Algebra','Casework'], 2),
('AIME', 1983, 3, 'What is the product of the real roots of the equation x² + 18x + 30 = 2√(x² + 18x + 45)?', '20', ARRAY['Substitution','Quadratics','Vieta''s Formulas'], 2),
('AIME', 1983, 5, 'Suppose that the sum of the squares of two complex numbers x and y is 7 and the sum of their cubes is 10. What is the largest real value that x + y can have?', '4', ARRAY['Symmetric Polynomials','Substitution','Polynomials'], 3),
('AIME', 1984, 1, 'Find the value of a₂ + a₄ + a₆ + ⋯ + a₉₈ if a₁, a₂, a₃, … is an arithmetic progression with common difference 1 and a₁ + a₂ + ⋯ + a₉₈ = 137.', '93', ARRAY['Sequences','Arithmetic Progressions','Pairing'], 1),
('AIME', 1986, 1, 'What is the sum of the solutions to the equation ⁴√x = 12 / (7 − ⁴√x)?', '337', ARRAY['Substitution','Quadratics'], 1),
('AIME', 1986, 5, 'What is the largest positive integer n for which n³ + 100 is divisible by n + 10?', '890', ARRAY['Number Theory','Polynomial Remainder','Divisibility'], 2),
('AIME', 1989, 1, 'Compute √((31)(30)(29)(28) + 1).', '869', ARRAY['Factoring','Substitution','Algebra'], 1),
('AIME', 1990, 1, 'The increasing sequence 2, 3, 5, 6, 7, 10, 11, … consists of all positive integers that are neither the square nor the cube of a positive integer. Find the 500th term of this sequence.', '528', ARRAY['Counting','Inclusion-Exclusion','Number Theory'], 2),
('AIME', 1991, 1, 'Find x² + y² if x and y are positive integers such that xy + x + y = 71 and x²y + xy² = 880.', '146', ARRAY['Symmetric Polynomials','Substitution','Factoring'], 1),
('AIME', 1985, 1, 'Let x₁ = 97, and for n > 1 let xₙ = n / xₙ₋₁. Calculate the product x₁x₂x₃⋯x₈.', '384', ARRAY['Sequences','Telescoping','Pairing'], 1),
('AIME', 1987, 1, 'An ordered pair (m, n) of non-negative integers is called "simple" if the addition m + n in base 10 requires no carrying. Find the number of simple ordered pairs of non-negative integers that sum to 1492.', '300', ARRAY['Counting','Digits','Multiplication Principle'], 1);