-- ============================================================================
-- SAHAKAR ACCOUNTS - PERFORMANCE INDEXES (CORRECTED)
-- ============================================================================
-- Critical indexes to improve query performance
-- Run this in Supabase SQL Editor
-- Expected impact: 10-100x faster queries on indexed columns
-- ============================================================================
-- Note: Some indexes may already exist from schema.sql
-- Using IF NOT EXISTS to prevent errors
-- ============================================================================

-- 1. DAILY RECORDS - Most queried table
-- Used by: Staff dashboard, Manager dashboard, Balance summary

-- Check if index exists before creating
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_daily_records_outlet_date'
    ) THEN
        CREATE INDEX idx_daily_records_outlet_date 
        ON daily_records(outlet_id, date DESC);
    END IF;
END $$;

-- For finding today's record (most common query)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_daily_records_date'
    ) THEN
        CREATE INDEX idx_daily_records_date 
        ON daily_records(date DESC);
    END IF;
END $$;

-- Note: idx_daily_records_status already exists in schema.sql

-- 2. TRANSACTIONS - Heavy read/write table
-- Note: idx_transactions_daily_record already exists in schema.sql

-- For transaction history by date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_transactions_date'
    ) THEN
        CREATE INDEX idx_transactions_date 
        ON transactions(date DESC);
    END IF;
END $$;

-- For filtering by payment mode
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_transactions_payment_mode'
    ) THEN
        CREATE INDEX idx_transactions_payment_mode 
        ON transactions(payment_mode);
    END IF;
END $$;

-- 3. AUDIT LOGS - For auditor view
-- Note: Some indexes already exist in schema.sql

-- For filtering by entity type and date
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_audit_logs_entity_date'
    ) THEN
        CREATE INDEX idx_audit_logs_entity_date 
        ON audit_logs(entity_type, created_at DESC);
    END IF;
END $$;

-- For filtering by action
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_audit_logs_action'
    ) THEN
        CREATE INDEX idx_audit_logs_action 
        ON audit_logs(action);
    END IF;
END $$;

-- 4. USERS - Authentication & lookup
-- For fast email-based login
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_email'
    ) THEN
        CREATE INDEX idx_users_email 
        ON users(email);
    END IF;
END $$;

-- For outlet-based user filtering
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_users_outlet'
    ) THEN
        CREATE INDEX idx_users_outlet 
        ON users(outlet_id) WHERE outlet_id IS NOT NULL;
    END IF;
END $$;

-- Note: idx_users_role already exists in schema.sql

-- 5. OUTLETS - Reference data
-- For fast outlet lookup by code
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_outlets_code'
    ) THEN
        CREATE INDEX idx_outlets_code 
        ON outlets(code);
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify indexes are being used:

-- Check if indexes exist:
-- SELECT tablename, indexname FROM pg_indexes 
-- WHERE tablename IN ('daily_records', 'transactions', 'users', 'outlets', 'audit_logs')
-- ORDER BY tablename, indexname;

-- Check query plan (should show "Index Scan" not "Seq Scan"):
-- EXPLAIN ANALYZE SELECT * FROM daily_records 
-- WHERE outlet_id = '9e0c4614-53cf-40d3-abdd-a1d0183c3909' 
-- ORDER BY date DESC LIMIT 1;

-- ============================================================================
-- EXPECTED IMPROVEMENTS
-- ============================================================================
-- Before: Daily record query: ~500-2000ms (sequential scan)
-- After:  Daily record query: ~5-50ms (index scan)
--
-- Before: Transaction list: ~1000-3000ms
-- After:  Transaction list: ~10-100ms
--
-- Before: User lookup: ~200-500ms
-- After:  User lookup: ~5-20ms
-- ============================================================================
