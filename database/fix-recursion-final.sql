-- FINAL FIX for Infinite Recursion
-- This script explicitly drops ALL existing policies found on the users table and re-creates only the necessary safe ones.

-- 1. Create secure helper functions (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.get_auth_role()
RETURNS text LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT role FROM users WHERE id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.get_auth_outlet_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER SET search_path = public STABLE AS $$
  SELECT outlet_id FROM users WHERE id = auth.uid();
$$;

-- 2. NUCLEAR OPTION: Drop EVERY policy seen in your database
-- We use IF EXISTS to avoid errors if some were already dropped.

DROP POLICY IF EXISTS "admins_read_all" ON users;
DROP POLICY IF EXISTS "admins_view_all" ON users;
DROP POLICY IF EXISTS "allow_own_profile_read" ON users;
DROP POLICY IF EXISTS "allow_service_role_all" ON users;
DROP POLICY IF EXISTS "auditors_cannot_modify_users" ON users;
DROP POLICY IF EXISTS "auditors_read_users" ON users;
DROP POLICY IF EXISTS "outlet_users_view_same_outlet" ON users;
DROP POLICY IF EXISTS "users_admin_all" ON users;
DROP POLICY IF EXISTS "users_admin_view" ON users;
DROP POLICY IF EXISTS "users_outlet_view" ON users;
DROP POLICY IF EXISTS "users_read_own" ON users;
DROP POLICY IF EXISTS "users_read_same_outlet" ON users;
DROP POLICY IF EXISTS "users_self_update" ON users;
DROP POLICY IF EXISTS "users_self_view" ON users;
DROP POLICY IF EXISTS "users_update_self" ON users;
DROP POLICY IF EXISTS "users_view_self" ON users;
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

-- 3. Create Clean, Safe Policies

-- A. Self Access (Always allowed)
CREATE POLICY "policy_users_view_self" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "policy_users_update_self" ON users
  FOR UPDATE USING (auth.uid() = id);

-- B. Admin Access (Global View)
-- Uses get_auth_role() to avoid recursion
CREATE POLICY "policy_admins_view_all" ON users
  FOR SELECT USING (
    get_auth_role() IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor')
  );

-- C. Outlet Access (View colleagues in same outlet)
-- Uses get_auth_outlet_id() to avoid recursion
CREATE POLICY "policy_outlet_view_same_outlet" ON users
  FOR SELECT USING (
    get_auth_outlet_id() IS NOT NULL 
    AND 
    outlet_id = get_auth_outlet_id()
  );

-- D. Service Role Access (System)
CREATE POLICY "policy_service_role_all" ON users
  FOR ALL USING (auth.role() = 'service_role');

-- Verification
SELECT policyname, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'users';
