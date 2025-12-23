-- ============================================================================
-- SAHAKAR ACCOUNTS - PERFORMANCE INDEXES
-- ============================================================================
-- Critical indexes to improve query performance
-- Run this in Supabase SQL Editor
-- Expected impact: 10-100x faster queries on indexed columns
-- ============================================================================

-- 1. DAILY RECORDS - Most queried table
-- Used by: Staff dashboard, Manager dashboard, Balance summary
CREATE INDEX IF NOT EXISTS idx_daily_records_outlet_date 
ON daily_records(outlet_id, date DESC);

-- For finding today's record (most common query)
CREATE INDEX IF NOT EXISTS idx_daily_records_date 
ON daily_records(date DESC);

-- For status-based filtering (locked records, etc.)
CREATE INDEX IF NOT EXISTS idx_daily_records_status 
ON daily_records(status);

-- 2. TRANSACTIONS - Heavy read/write table
-- Used by: Transaction lists, totals calculation
CREATE INDEX IF NOT EXISTS idx_transactions_daily_record 
ON transactions(daily_record_id);

-- For transaction history by date
CREATE INDEX IF NOT EXISTS idx_transactions_date 
ON transactions(date DESC);

-- For filtering by payment mode
CREATE INDEX IF NOT EXISTS idx_transactions_payment_mode 
ON transactions(payment_mode);

-- 3. AUDIT LOGS - For auditor view
-- Used by: Auditor dashboard
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_date 
ON audit_logs(entity_type, created_at DESC);

-- For filtering by action
CREATE INDEX IF NOT EXISTS idx_audit_logs_action 
ON audit_logs(action);

-- 4. USERS - Authentication & lookup
-- For fast email-based login
CREATE INDEX IF NOT EXISTS idx_users_email 
ON users(email);

-- For outlet-based user filtering
CREATE INDEX IF NOT EXISTS idx_users_outlet 
ON users(outlet_id) WHERE outlet_id IS NOT NULL;

-- For role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role 
ON users(role);

-- 5. OUTLETS - Reference data
-- For fast outlet lookup by code
CREATE INDEX IF NOT EXISTS idx_outlets_code 
ON outlets(code);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify indexes are being used:

-- Check if indexes exist:
-- SELECT * FROM pg_indexes WHERE tablename = 'daily_records';

-- Check query plan (should show "Index Scan" not "Seq Scan"):
-- EXPLAIN ANALYZE SELECT * FROM daily_records WHERE outlet_id = '...' ORDER BY date DESC LIMIT 1;

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
