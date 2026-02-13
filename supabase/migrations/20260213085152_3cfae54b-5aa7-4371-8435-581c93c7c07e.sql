
-- Update words RLS: users can only update/delete their own words
DROP POLICY IF EXISTS "Anyone can update words" ON public.words;
DROP POLICY IF EXISTS "Anyone can delete words" ON public.words;

CREATE POLICY "Users can update own words"
  ON public.words FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own words"
  ON public.words FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update insert policy to require auth and set user_id
DROP POLICY IF EXISTS "Anyone can insert words" ON public.words;
CREATE POLICY "Authenticated users can insert words"
  ON public.words FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
