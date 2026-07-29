-- Add skills column to profiles table for student onboarding
ALTER TABLE profiles ADD COLUMN skills JSONB DEFAULT '[]'::jsonb;
