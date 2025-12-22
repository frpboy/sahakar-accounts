-- AGGRESSIVE FIX: Remove ALL recursive RLS policies on users table
-- The old policies are still there causing infinite recursion
-- This will drop EVERYTHING and start fresh

-- Run this in Supabase SQL Editor

-- Step 1: Drop EVERY policy on users table (including the recursive ones)
DROP POLICY IF EXISTS "HO can view all" ON users;
DROP POLICY IF EXISTS "Superadmin can manage all users" ON users;
DROP POLICY IF EXISTS "Superadmin can view all" ON users;
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view same outlet" ON users;
DROP POLICY IF EXISTS "Enable read access for own profile" ON users;
DROP POLICY IF EXISTS "Enable all access for service role" ON users;
DROP POLICY IF EXISTS "Enable update for own profile" ON users;

-- Step 2: Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Step 3: Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create ONLY ONE simple policy - users can read their own profile
-- This is the ONLY policy we need for login to work
CREATE POLICY "allow_own_profile_read" ON users
  FOR SELECT 
  USING (auth.uid() = id);

-- Step 5: Allow service role full access (for server-side operations)
CREATE POLICY "allow_service_role" ON users
  FOR ALL 
  USING (auth.jwt()->>'role' = 'service_role');

-- Verify - should only see 2 policies now
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
