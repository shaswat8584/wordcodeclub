
-- Allow anyone to update words (admin page is password-gated in the UI)
CREATE POLICY "Anyone can update words"
ON public.words
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Allow anyone to delete words
CREATE POLICY "Anyone can delete words"
ON public.words
FOR DELETE
USING (true);
