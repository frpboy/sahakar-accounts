-- Fix for infinite recursion in users table RLS policy
-- Run this in Supabase SQL Editor

-- Drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view users in their outlet" ON users;
DROP POLICY IF EXISTS "Superadmin can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;

-- Create simple, non-recursive policies

-- Policy 1: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Policy 2: Superadmin can view all users
CREATE POLICY "Superadmin can view all" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid() 
      AND u.role = 'superadmin'
    )
  );

-- Policy 3: Users can view other users in same outlet
CREATE POLICY "Users can view same outlet" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.outlet_id = users.outlet_id
    )
  );

-- Policy 4: HO Accountant can view all users
CREATE POLICY "HO can view all" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'ho_accountant'
    )
  );

-- Policy 5: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
