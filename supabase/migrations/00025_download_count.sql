-- K-02: resume download counter.
-- download_count: incremented on each resume export/download (feeds K-02 analytics).
-- view_count (added in 00023) covers public share views; this covers direct exports.
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS download_count INTEGER NOT NULL DEFAULT 0;
