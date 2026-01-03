# Sahakar Accounts: Final Audit Remediation Plan

This plan outlines the specific technical steps required to resolve identified gaps and reach 100% audit-defensible stability.

## 1. Eliminate Mock Data
**Goal**: Ensure all dashboards reflect live data.
- **Action**: Update `app/(dashboard)/dashboard/reports/page.tsx` to fetch dynamic statistics (total users, active outlets, total transactions) instead of the current hardcoded values (Lines 353-372).
- **Target File**: `app/(dashboard)/dashboard/reports/page.tsx`

## 2. Sync TypeScript Types
**Goal**: Resolve the severe drift between DB and Code.
- **Action**: Manually or automatically update `lib/database.types.ts` to include:
    - `ledger_account_id`, `ledger_date`, `outlet_id`, `is_reversal` in `transactions`.
    - Correct enums for `payment_mode` and `role`.
- **Target File**: `lib/database.types.ts`

## 3. Purge Redundant/Placeholder Files
**Goal**: Reduce the attack surface and developer confusion.
- **Action**: Delete `app/anomalies/page.tsx`.
- **Action**: Verify and potentially delete `app/(dashboard)/dashboard/ledger/journal/page.tsx` if it's an unsecure orphan.

## 4. Auditor Role Hardening
**Goal**: Ensure auditors have global vision but zero friction.
- **Action**: Update the `public.check_is_admin()` SQL function to include the `auditor` role. This allows auditors to view all outlets in the `transactions_view` RLS policy without needing to be members of every outlet.
- **Target Migration**: New SQL migration `20260104_auditor_global_view.sql`.

## 5. Standardize Locking Mechanism
**Goal**: Remove "Split-Brain" risk between `daily_records` and `day_locks`.
- **Action**: Transition all RLS policies to check the `day_locks` table.
- **Action**: Deprecate the `status` column in `daily_records` to ensure `day_locks` is the Single Source of Truth for system state.

## Verification Plan
1. **Login as Auditor**: Verify "Global Vision" (can see transactions from multiple outlets).
2. **Type Check**: Run `npm run build` after updating types to ensure no regressions.
3. **Immutability Test**: Attempt a manual SQL `UPDATE` on a transaction via a non-superuser role (should fail).
