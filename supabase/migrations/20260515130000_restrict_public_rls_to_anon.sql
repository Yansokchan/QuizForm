-- Public read policies applied to all roles (including authenticated teachers),
-- which OR'd with teacher policies and exposed every user's data.
-- Restrict student/guest access to the anon role only.

DROP POLICY IF EXISTS "Public read quizzes by token" ON quizzes;
DROP POLICY IF EXISTS "Anon read quizzes for students" ON quizzes;
CREATE POLICY "Anon read quizzes for students"
  ON quizzes FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Public read quiz_classes" ON quiz_classes;
DROP POLICY IF EXISTS "Anon read quiz_classes for students" ON quiz_classes;
CREATE POLICY "Anon read quiz_classes for students"
  ON quiz_classes FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Public read questions" ON questions;
DROP POLICY IF EXISTS "Anon read questions for students" ON questions;
CREATE POLICY "Anon read questions for students"
  ON questions FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Public read options" ON options;
DROP POLICY IF EXISTS "Anon read options for students" ON options;
CREATE POLICY "Anon read options for students"
  ON options FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS "Public read in-progress submissions" ON submissions;
DROP POLICY IF EXISTS "Anon read in-progress submissions" ON submissions;
CREATE POLICY "Anon read in-progress submissions"
  ON submissions FOR SELECT
  TO anon
  USING (submitted_at IS NULL);

DROP POLICY IF EXISTS "Public insert submissions" ON submissions;
DROP POLICY IF EXISTS "Anon insert submissions" ON submissions;
CREATE POLICY "Anon insert submissions"
  ON submissions FOR INSERT
  TO anon
  WITH CHECK (true);

DROP POLICY IF EXISTS "Public insert answers" ON answers;
DROP POLICY IF EXISTS "Anon insert answers" ON answers;
CREATE POLICY "Anon insert answers"
  ON answers FOR INSERT
  TO anon
  WITH CHECK (true);
