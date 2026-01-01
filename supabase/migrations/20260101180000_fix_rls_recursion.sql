-- Migration: 20260101180000_fix_rls_recursion.sql
-- Goal: Fix infinite recursion in users table policies

-- 1. Create helper functions with SECURITY DEFINER to break recursion
-- These functions run with the privileges of the creator (postgres), bypassing RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_my_outlet()
RETURNS uuid AS $$
  SELECT outlet_id FROM public.users WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Drop existing problematic policies on users
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Store manager outlet access" ON users;

-- 3. Create new non-recursive policies for users
-- Everyone can see their own profile
CREATE POLICY "Users can select self" ON users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- Admins can see everyone
CREATE POLICY "Admins select all" ON users
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('superadmin', 'master_admin', 'ho_accountant'));

-- Managers and Staff can see their own outlet's users
CREATE POLICY "Staff select outlet" ON users
  FOR SELECT TO authenticated
  USING (
    outlet_id = get_my_outlet()
  );

-- Admins can update everyone
CREATE POLICY "Admins update all" ON users
  FOR UPDATE TO authenticated
  USING (get_my_role() IN ('superadmin', 'master_admin'));

-- Users can update some of their own info
CREATE POLICY "Users update self" ON users
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- Admins can insert users
CREATE POLICY "Admins insert users" ON users
  FOR INSERT TO authenticated
  WITH CHECK (get_my_role() IN ('superadmin', 'master_admin'));

-- Admins can delete users
CREATE POLICY "Admins delete users" ON users
  FOR DELETE TO authenticated
  USING (get_my_role() IN ('superadmin', 'master_admin'));

-- 4. Re-verify customers policy (it should now work as users select is fixed)
-- The 'EXISTS (SELECT 1 FROM users ...)' in customers policy will now 
-- use the 'Users can select self' policy for the current user, which is non-recursive.
