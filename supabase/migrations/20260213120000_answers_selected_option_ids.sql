-- Multi-select answers: store all chosen option UUIDs (JSON array).
-- Single-answer rows continue to use selected_option_id only.
ALTER TABLE answers
  ADD COLUMN IF NOT EXISTS selected_option_ids jsonb;
