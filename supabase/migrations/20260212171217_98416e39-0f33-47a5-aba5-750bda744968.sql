
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Words are readable by everyone" ON public.words;
DROP POLICY IF EXISTS "Authenticated users can insert words" ON public.words;
DROP POLICY IF EXISTS "Users can view own scores" ON public.quiz_scores;
DROP POLICY IF EXISTS "Users can insert own scores" ON public.quiz_scores;

-- Make words fully public (read and write)
CREATE POLICY "Anyone can read words" ON public.words FOR SELECT USING (true);
CREATE POLICY "Anyone can insert words" ON public.words FOR INSERT WITH CHECK (true);

-- Make user_id nullable on words since no auth
ALTER TABLE public.words ALTER COLUMN user_id DROP NOT NULL;

-- Make quiz_scores public and user_id nullable
ALTER TABLE public.quiz_scores ALTER COLUMN user_id DROP NOT NULL;
CREATE POLICY "Anyone can read scores" ON public.quiz_scores FOR SELECT USING (true);
CREATE POLICY "Anyone can insert scores" ON public.quiz_scores FOR INSERT WITH CHECK (true);
