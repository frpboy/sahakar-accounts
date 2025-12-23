-- CRITICAL FIX: Drop ALL existing RLS policies on users table to prevent recursion
-- Then create a simple, non-recursive policy

-- Step 1: Drop ALL existing policies (this prevents conflicts)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'users') 
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON users';
    END LOOP;
END $$;

-- Step 2: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create simple, non-recursive policy allowing users to read their own row
CREATE POLICY "allow_own_profile_read" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Step 4: Allow service role full access (for admin operations)
CREATE POLICY "allow_service_role_all" ON users
    FOR ALL
    USING (auth.role() = 'service_role');
