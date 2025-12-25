# Sahakar Accounts - Database Schema Changelog

## 2025-12-25: PHASE 1 - Auditor Mode

### Changes Applied
1. **Added to `users` table**:
   - `auditor_access_granted_at` (timestamptz) - When access was granted
   - `auditor_access_expires_at` (timestamptz) - When access expires
   - `auditor_access_granted_by` (uuid) - Admin who granted access (FK to users.id)

2. **RLS Policies Created**:
   - `auditors_view_locked_records` - Auditors can only view locked daily_records
   - `auditors_view_transactions` - Auditors can only view transactions for locked records
   - `auditors_view_own_actions` - Auditors can view their own access logs
   - `admins_view_all_auditor_actions` - Admins can view all auditor logs
   - `system_insert_auditor_actions` - Allow logging of auditor actions
   - Defensive policies preventing auditor INSERT/UPDATE/DELETE on daily_records and transactions

3. **Existing Tables Used**:
   - `auditor_access_log` - Already existed, now actively used for compliance logging
   - `auditor_outlets` - Already existed for outlet-scoped access

### Migration File
`database/add-auditor-mode.sql`

### Status
✅ Migration completed successfully
✅ All RLS policies active
✅ Compliance logging enabled

---

## Previous Changes
(Add previous migration notes here as needed)
