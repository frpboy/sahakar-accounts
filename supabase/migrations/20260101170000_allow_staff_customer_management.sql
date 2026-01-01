-- Migration: 20260101170000_allow_staff_customer_management.sql
-- Goal: Allow outlet_staff to create and update customer records

-- 1. Drop old policies
DROP POLICY IF EXISTS "Manager Edit Customers" ON customers;
DROP POLICY IF EXISTS "Manager Update Customers" ON customers;

-- 2. Staff & Manager can create customers
CREATE POLICY "Staff Create Customers" ON customers 
    FOR INSERT TO authenticated 
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('outlet_staff', 'outlet_manager', 'ho_accountant', 'master_admin', 'superadmin')
        )
    );

-- 3. Staff & Manager can update customers
CREATE POLICY "Staff Update Customers" ON customers 
    FOR UPDATE TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role IN ('outlet_staff', 'outlet_manager', 'ho_accountant', 'master_admin', 'superadmin')
        )
    );
