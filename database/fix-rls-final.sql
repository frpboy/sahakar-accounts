-- FINAL FIX for infinite recursion in users table RLS policy
-- The previous fix still had recursion because policies were querying users table
-- This fix uses a simpler approach: allow users to read their own row directly

-- Run this in Supabase SQL Editor

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view same outlet" ON users;
DROP POLICY IF EXISTS "Superadmin can view all" ON users;
DROP POLICY IF EXISTS "HO can view all" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Superadmin can manage all users" ON users;

-- Step 2: Temporarily DISABLE RLS on users table to break the cycle
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create a SINGLE simple policy for reading your own profile
-- This doesn't query the users table, so no recursion!
CREATE POLICY "Enable read access for own profile" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Step 5: Allow superadmin full access (but we'll manage this at app level for now)
CREATE POLICY "Enable all access for service role" ON users
  FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- Step 6: Allow users to update their own profile
CREATE POLICY "Enable update for own profile" ON users
  FOR UPDATE 
  USING (auth.uid() = id);

-- Verify the new policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query (should work now without recursion)
-- SELECT * FROM users WHERE id = auth.uid();
