# Sahakar Accounts - Stabilization Task List

## PHASE 0 - FREEZE & SAFETY NET
- [/] Freeze schema (no new migrations except listed)
- [ ] Create verification commands
- [ ] Snapshot DB schema & RLS policies
- [ ] Tag repo: pre-audit-stabilization

## PHASE 1 - DATABASE → CODE DRIFT ELIMINATION
- [x] Update `lib/database.types.ts` with missing fields:
  - `ledger_account_id`
  - `ledger_date`
  - `outlet_id`
  - `is_reversal`
- [x] Correct enums for `payment_modes` and `role`
- [x] Run `npm run build` to verify

## PHASE 2 - DATA AUTHENTICITY
- [x] Replace hardcoded stats in `reports/page.tsx` with live data

## PHASE 3 - DEAD / ORPHAN CODE PURGE
- [x] Delete `app/anomalies/page.tsx`
- [ ] Verify/delete `app/(dashboard)/dashboard/ledger/journal/page.tsx`

## PHASE 4 - ACCESS CONTROL HARDENING
- [ ] Create migration `20260104_auditor_global_view.sql`
- [ ] Update `check_is_admin()` to include auditor role
- [ ] Verify auditor can see all outlets read-only

## PHASE 5 - LOCKING SINGLE SOURCE OF TRUTH
- [ ] Migrate all RLS policies to check `day_locks`
- [ ] Deprecate `daily_records.status`

## PHASE 6 - LEDGER FLOW VERIFICATION
- [ ] Audit all transaction entry points
- [ ] Verify no UPDATEs/DELETEs allowed
- [ ] Confirm `ledger_account_id` required

## PHASE 7 - EXPORTS & EXTERNAL TRUST
- [ ] Verify Excel/CSV/PDF exports
- [ ] Confirm debits = credits in exports

## PHASE 8 - UI/UX COMPLETENESS PASS
- [ ] Audit all buttons and actions
- [ ] Verify role-based route protection

## PHASE 9 - FINAL AUDIT DRY RUN
- [ ] Test as Staff, Manager, HO Accountant, Auditor
- [ ] Attempt forbidden operations (edit locked, mutate SQL)

## PHASE 10 - RELEASE TAG
- [ ] Tag: `audit-grade-stable`
- [x] Deploy (Ready for Vercel)
- [ ] Lock schema
