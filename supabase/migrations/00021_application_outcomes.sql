-- A-12: Structured interview-outcome capture for the Job Tracker.
-- outcome_type: structured outcome (round_reached | offer | rejected) at time of capture
-- outcome_notes: free-text note from the outcome modal
-- interview_round: which round the outcome refers to (1 = screening, etc.)
ALTER TABLE applications
  ADD COLUMN IF NOT EXISTS outcome_type TEXT CHECK (outcome_type IN ('round_reached', 'offer', 'rejected')),
  ADD COLUMN IF NOT EXISTS outcome_notes TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS interview_round INTEGER;
