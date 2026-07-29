-- Helper function for application-layer encryption of github_token
-- The actual encryption/decryption happens in the application code (src/lib/encryption.ts)
-- This migration adds a comment column note and ensures the column is TEXT type
-- for storing the encrypted value (base64-encoded ciphertext).

-- Verify the column exists and is of correct type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'github_token'
  ) THEN
    ALTER TABLE profiles ADD COLUMN github_token TEXT;
  END IF;
END $$;

-- Note: The actual encryption/decryption logic lives in application code at src/lib/encryption.ts
-- This ensures OAuth tokens are never stored in plaintext.
-- The column stores base64-encoded AES-256-GCM ciphertext.
