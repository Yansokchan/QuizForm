-- Allow students (anon / any role) to start a quiz without logging in.
-- Run in Supabase SQL Editor if migrations are not applied automatically.

DROP POLICY IF EXISTS "Public insert submissions" ON submissions;
CREATE POLICY "Public insert submissions"
  ON submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Required for .insert().select() when starting a quiz from the client.
DROP POLICY IF EXISTS "Public read in-progress submissions" ON submissions;
CREATE POLICY "Public read in-progress submissions"
  ON submissions
  FOR SELECT
  TO anon, authenticated
  USING (submitted_at IS NULL);
