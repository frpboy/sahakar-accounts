-- FIX For Infinite Recursion in 'users' table policies
-- This script replaces recursive policies with safe, function-based policies using SECURITY DEFINER.

-- 1. Create a secure function to fetch the current user's role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

-- 2. Create a secure function to fetch the current user's outlet_id
CREATE OR REPLACE FUNCTION public.get_auth_outlet_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT outlet_id FROM users WHERE id = auth.uid();
$$;

-- 3. Drop ALL existing policies on the users table to ensure a clean slate
-- We attempt to drop known policy names from previous schema definitions
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view users in their outlet" ON users;
DROP POLICY IF EXISTS "Superadmin can view all users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Superadmin can view all" ON users;
DROP POLICY IF EXISTS "Users can view same outlet" ON users;
DROP POLICY IF EXISTS "HO can view all" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_view_own" ON users;

-- 4. Create New, Safe Policies

-- A. Users can ALWAYS view their own profile (Self)
CREATE POLICY "users_view_self" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- B. Global Admins can view ALL users
-- We use the function get_auth_role() which bypasses RLS, avoiding recursion
CREATE POLICY "admins_view_all" ON users
  FOR SELECT
  USING (
    get_auth_role() IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor')
  );

-- C. Outlet Staff/Managers can view users in THEIR OWN outlet only
-- We use get_auth_outlet_id() which bypasses RLS
CREATE POLICY "outlet_users_view_same_outlet" ON users
  FOR SELECT
  USING (
    get_auth_outlet_id() IS NOT NULL 
    AND 
    outlet_id = get_auth_outlet_id()
  );

-- D. Update Policy: Users can update their own profile
CREATE POLICY "users_update_self" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- E. Insert Policy: Only admins or system (via triggers) usually insert, but for now:
-- (Assuming standard signup flow handles inserts via trigger or service_role, but if needed:)
-- CREATE POLICY "admins_insert" ON users FOR INSERT WITH CHECK (get_auth_role() = 'superadmin');

-- Verification
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
