-- Migration: 20260101190000_kill_recursion.sql
-- Goal: Eliminate all RLS recursion by using SECURITY DEFINER helper functions

-- 1. DROP EVERYTHING problematic first
DROP POLICY IF EXISTS "Users browse outlet" ON users;
DROP POLICY IF EXISTS "Staff select outlet" ON users;
DROP POLICY IF EXISTS "Admins select all" ON users;
DROP POLICY IF EXISTS "Admins update all" ON users;
DROP POLICY IF EXISTS "Users update self" ON users;
DROP POLICY IF EXISTS "Admins insert users" ON users;
DROP POLICY IF EXISTS "Admins delete users" ON users;
DROP POLICY IF EXISTS "Users can select self" ON users;
DROP POLICY IF EXISTS "Admin full access" ON users;
DROP POLICY IF EXISTS "Store manager outlet access" ON users;

-- 2. Create robust helper functions (SECURITY DEFINER)
-- These functions bypass RLS because they are owned by the creator (postgres)
-- and don't involve the RLS manager in their internal queries.

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('superadmin', 'master_admin', 'ho_accountant')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.check_is_staff_or_manager()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('outlet_staff', 'outlet_manager', 'ho_accountant', 'master_admin', 'superadmin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.get_auth_outlet()
RETURNS uuid AS $$
BEGIN
  RETURN (SELECT outlet_id FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Redefine USERS table policies (The core of the recursion)
-- We use a very simple policy: Everyone can see their own row, 
-- and admins can see everyone.
-- Crucially, we avoid calling functions that query 'users' INSIDE these policies if possible,
-- or ensure the functions are stable.

-- Everyone can see themselves
CREATE POLICY "users_self_view" ON users 
    FOR SELECT TO authenticated 
    USING (id = auth.uid());

-- Colleagues in same outlet can see each other (for referrals/dropdowns)
-- We use the function here, which is SECURITY DEFINER and thus non-recursive
CREATE POLICY "users_outlet_view" ON users 
    FOR SELECT TO authenticated 
    USING (outlet_id = get_auth_outlet());

-- Admins can see everyone
CREATE POLICY "users_admin_view" ON users 
    FOR SELECT TO authenticated 
    USING (check_is_admin());

-- Update/Delete/Insert restricted to self or admin
CREATE POLICY "users_self_update" ON users 
    FOR UPDATE TO authenticated 
    USING (id = auth.uid());

CREATE POLICY "users_admin_all" ON users 
    FOR ALL TO authenticated 
    USING (check_is_admin());

-- 4. Update CUSTOMERS policies to use these functions
DROP POLICY IF EXISTS "Global Read Customers" ON customers;
DROP POLICY IF EXISTS "Staff Create Customers" ON customers;
DROP POLICY IF EXISTS "Staff Update Customers" ON customers;
DROP POLICY IF EXISTS "Manager Edit Customers" ON customers;
DROP POLICY IF EXISTS "Manager Update Customers" ON customers;

CREATE POLICY "customers_read" ON customers 
    FOR SELECT TO authenticated 
    USING (true);

CREATE POLICY "customers_insert" ON customers 
    FOR INSERT TO authenticated 
    WITH CHECK (check_is_staff_or_manager());

CREATE POLICY "customers_update" ON customers 
    FOR UPDATE TO authenticated 
    USING (check_is_staff_or_manager());

-- 5. Update ANOMALIES policies to use these functions
DROP POLICY IF EXISTS "Anomalies viewable by outlet members" ON anomalies;
DROP POLICY IF EXISTS "Anomalies insertable by system" ON anomalies;
DROP POLICY IF EXISTS "Anomalies updatable by authorized roles" ON anomalies;

CREATE POLICY "anomalies_view" ON anomalies 
    FOR SELECT TO authenticated 
    USING (
        outlet_id = get_auth_outlet() OR check_is_admin()
    );

CREATE POLICY "anomalies_manage" ON anomalies 
    FOR ALL TO authenticated 
    USING (check_is_admin());

-- 6. Update TRANSACTIONS & DAILY_RECORDS policies
DROP POLICY IF EXISTS "Users can view transactions from their outlet" ON transactions;
DROP POLICY IF EXISTS "Staff can create transactions for their outlet" ON transactions;
DROP POLICY IF EXISTS "Users can update their own transactions in draft" ON transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions in draft" ON transactions;
DROP POLICY IF EXISTS "select_transactions_same_outlet" ON transactions;
DROP POLICY IF EXISTS "insert_transactions_staff_manager" ON transactions;
DROP POLICY IF EXISTS "update_transactions_staff_manager" ON transactions;
DROP POLICY IF EXISTS "delete_transactions_staff_manager" ON transactions;

CREATE POLICY "transactions_view" ON transactions 
    FOR SELECT TO authenticated 
    USING (
        EXISTS (
          SELECT 1 FROM daily_records dr
          WHERE dr.id = transactions.daily_record_id
          AND (check_is_admin() OR dr.outlet_id = get_auth_outlet())
        )
    );

CREATE POLICY "transactions_insert" ON transactions 
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
          SELECT 1 FROM daily_records dr
          WHERE dr.id = transactions.daily_record_id
          AND dr.status = 'draft'
          AND (check_is_admin() OR dr.outlet_id = get_auth_outlet())
        )
    );

-- DAILY RECORDS
DROP POLICY IF EXISTS "Managers can manage daily records" ON daily_records;
DROP POLICY IF EXISTS "Anyone in outlet can view daily records" ON daily_records;

CREATE POLICY "daily_records_view" ON daily_records 
    FOR SELECT TO authenticated 
    USING (check_is_admin() OR outlet_id = get_auth_outlet());

CREATE POLICY "daily_records_manage" ON daily_records 
    FOR INSERT TO authenticated 
    WITH CHECK (check_is_staff_or_manager());

CREATE POLICY "daily_records_update" ON daily_records 
    FOR UPDATE TO authenticated 
    USING (check_is_staff_or_manager());
