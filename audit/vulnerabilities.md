# Vulnerabilities

## 1. Hard‑coded Statistics
- `app/(dashboard)/dashboard/reports/page.tsx` displayed static counts (23 screens, 11 users). This could mislead auditors and hide real system state.

## 2. TypeScript / DB Schema Drift
- `lib/database.types.ts` is missing several columns present in the database (`ledger_account_id`, `ledger_date`, `outlet_id`, `is_reversal` on `transactions`).
- Enums for `payment_mode` and `role` are out‑of‑sync, causing type errors and potential runtime mismatches.

## 3. Auditor Role Gaps
- RLS policies do not explicitly grant the `auditor` role global `SELECT` access; they rely on outlet scoping, which can block auditors from viewing data across outlets.
- `middleware.ts` correctly blocks mutations for auditors, but the missing RLS entry is a security blind spot.

## 4. Split‑Brain Locking Mechanism
- Some policies and business‑logic check `daily_records.status` while newer code uses `day_locks`. This divergence can cause inconsistent lock enforcement and data‑integrity violations.

## 5. Redundant / Orphan Files
- `app/anomalies/page.tsx` is a placeholder that is no longer used, increasing attack surface and causing confusion.
- Potential orphan `app/(dashboard)/dashboard/ledger/journal/page.tsx` needs verification.

## 6. Environment Variable Gaps (Resolved)
- Missing `DATABASE_URL`/`POSTGRES_URL` prevented certain scripts from running. Added to `.env.local`.

---

**Impact**: These issues affect audit‑grade stability, data integrity, and security posture. Addressing them is essential before final sign‑off.
