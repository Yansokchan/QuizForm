CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  public_token VARCHAR(64) NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  is_paused BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE quiz_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  class_name VARCHAR(50) NOT NULL
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  time_limit INT NOT NULL DEFAULT 30,
  order_index INT NOT NULL DEFAULT 0
);

CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id),
  quiz_class_id UUID NOT NULL REFERENCES quiz_classes(id),
  student_name VARCHAR(100) NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  submitted_at TIMESTAMPTZ,
  total_score DECIMAL(10,2) DEFAULT 0
);

CREATE UNIQUE INDEX submissions_quiz_class_student_once
  ON submissions (quiz_id, quiz_class_id, lower(student_name))
  WHERE submitted_at IS NOT NULL;

CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id),
  selected_option_id UUID REFERENCES options(id),
  selected_option_ids jsonb,
  time_taken INT NOT NULL DEFAULT 0,
  score DECIMAL(10,2) DEFAULT 0
);

ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers manage own quizzes"
  ON quizzes FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers manage quiz_classes"
  ON quiz_classes FOR ALL
  USING (quiz_id IN (SELECT id FROM quizzes WHERE teacher_id = auth.uid()));

CREATE POLICY "Teachers manage questions"
  ON questions FOR ALL
  USING (quiz_id IN (SELECT id FROM quizzes WHERE teacher_id = auth.uid()));

CREATE POLICY "Teachers manage options"
  ON options FOR ALL
  USING (question_id IN (SELECT id FROM questions WHERE quiz_id IN
    (SELECT id FROM quizzes WHERE teacher_id = auth.uid())));

CREATE POLICY "Anon read quizzes for students"
  ON quizzes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read quiz_classes for students"
  ON quiz_classes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read questions for students"
  ON questions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon read options for students"
  ON options FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon insert submissions"
  ON submissions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon read in-progress submissions"
  ON submissions FOR SELECT
  TO anon
  USING (submitted_at IS NULL);

CREATE POLICY "Anon insert answers"
  ON answers FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Teachers read own submissions"
  ON submissions FOR SELECT
  USING (quiz_id IN (SELECT id FROM quizzes WHERE teacher_id = auth.uid()));

CREATE POLICY "Teachers read own answers"
  ON answers FOR SELECT
  USING (submission_id IN (
    SELECT s.id FROM submissions s
    JOIN quizzes q ON s.quiz_id = q.id
    WHERE q.teacher_id = auth.uid()
  ));
