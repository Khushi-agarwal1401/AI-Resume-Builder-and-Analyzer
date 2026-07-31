-- Rename profiles.current_role to profiles.current_position.
--
-- `current_role` is a PostgreSQL reserved keyword and makes the base schema
-- (00001) fail on fresh databases. 00001 now creates `current_position`
-- directly; this migration repairs databases that were provisioned with the
-- old column name. The guard keeps the migration safe on both fresh and
-- upgraded databases.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND column_name = 'current_role'
  ) THEN
    ALTER TABLE profiles RENAME COLUMN "current_role" TO current_position;
  END IF;
END $$;
