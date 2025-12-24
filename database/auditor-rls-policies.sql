-- =====================================================================
-- AUDITOR RLS POLICIES
-- =====================================================================
-- Purpose: Restrict auditors to read-only access of locked data only
-- Created: 2025-12-24
-- =====================================================================

-- =================================================================
-- AUDITOR READ-ONLY ACCESS (LOCKED DATA ONLY)
-- =================================================================

-- Daily Records: Auditors can ONLY read locked records
CREATE POLICY "auditors_read_locked_daily_records"
ON daily_records
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
        AND is_access_valid(users.id) = TRUE
    )
    AND status = 'locked'
);

-- Transactions: Auditors can read transactions of locked daily records only
CREATE POLICY "auditors_read_locked_transactions"
ON transactions
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
        AND is_access_valid(users.id) = TRUE
    )
    AND daily_record_id IN (
        SELECT id FROM daily_records WHERE status = 'locked'
    )
);

-- Outlets: Auditors can read outlet info for context
CREATE POLICY "auditors_read_outlets"
ON outlets
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
        AND is_access_valid(users.id) = TRUE
    )
);

-- Categories: Auditors can read categories for transaction categorization
CREATE POLICY "auditors_read_categories"
ON categories
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
        AND is_access_valid(users.id) = TRUE
    )
);

-- Users: Auditors can read basic user info (for audit trail context)
CREATE POLICY "auditors_read_users"
ON users
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'auditor'
        AND is_access_valid(u.id) = TRUE
    )
);

-- =================================================================
-- PREVENT AUDITOR MODIFICATIONS (ALL TABLES)
-- =================================================================

-- Block auditors from INSERT/UPDATE/DELETE on daily_records
CREATE POLICY "auditors_cannot_modify_daily_records"
ON daily_records
AS RESTRICTIVE
FOR ALL
USING (
    NOT EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
    )
);

-- Block auditors from INSERT/UPDATE/DELETE on transactions
CREATE POLICY "auditors_cannot_modify_transactions"
ON transactions
AS RESTRICTIVE
FOR ALL
USING (
    NOT EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
    )
);

-- Block auditors from modifying outlets
CREATE POLICY "auditors_cannot_modify_outlets"
ON outlets
AS RESTRICTIVE
FOR ALL
USING (
    NOT EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
    )
);

-- Block auditors from modifying categories
CREATE POLICY "auditors_cannot_modify_categories"
ON categories
AS RESTRICTIVE
FOR ALL
USING (
    NOT EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'auditor'
    )
);

-- Block auditors from modifying users
CREATE POLICY "auditors_cannot_modify_users"
ON users
AS RESTRICTIVE
FOR ALL
USING (
    NOT EXISTS (
        SELECT 1 FROM users u
        WHERE u.id = auth.uid()
        AND u.role = 'auditor'
    )
);

-- =================================================================
-- VERIFICATION & TESTING
-- =================================================================

-- List all policies for auditor role
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE policyname LIKE '%auditor%'
ORDER BY tablename, policyname;

-- Test query (run as auditor user):
-- Should only return locked records
/*
SELECT COUNT(*) as locked_records
FROM daily_records
WHERE status = 'locked';

SELECT COUNT(*) as all_records
FROM daily_records; -- Should fail or return only locked ones for auditors
*/

COMMENT ON POLICY "auditors_read_locked_daily_records" ON daily_records IS 'Allows auditors to read only locked daily records with valid time-bound access';
COMMENT ON POLICY "auditors_cannot_modify_daily_records" ON daily_records IS 'Prevents auditors from INSERT/UPDATE/DELETE operations';
