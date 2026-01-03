# Sahakar Accounts: Comprehensive File Inventory

## Classification Methodology
- 🟢 **Live & Used**: Actively imported and executed in core workflows.
- 🟡 **Wired but Incomplete**: UI exists, but logic/backend wiring is partial or contains mock data.
- 🔴 **Dead / Dead End**: Not imported or redundant experiments.
- ⚠️ **High Risk**: Bypasses rules, missing lock checks, or critical for security.

| Path | Status | Risk | Notes |
| :--- | :---: | :---: | :--- |
| `app/(dashboard)/dashboard/page.tsx` | 🟢 | Low | Multi-role dashboard dispatcher. |
| `app/(dashboard)/dashboard/ledger/page.tsx` | 🟢 | Low | Financial KPI Dashboard. |
| `app/(dashboard)/dashboard/ledger/register/page.tsx` | 🟢 | ⚠️ | Core audit trail view. Relies on RLS. |
| `app/(dashboard)/dashboard/ledger/day-book/page.tsx` | 🟢 | Low | Chronological ledger log. |
| `app/(dashboard)/dashboard/ledger/anomalies/page.tsx` | 🟢 | Medium | Fraud detection and rules engine. |
| `app/(dashboard)/dashboard/reports/page.tsx` | 🟡 | Medium | Reports Hub. Contains hardcoded "Quick Statistics" (Lines 353-372). |
| `app/(dashboard)/dashboard/reports/analytics/page.tsx` | 🟢 | Low | Advanced chart-based analytics. |
| `app/(dashboard)/dashboard/management/users/page.tsx` | 🟢 | ⚠️ | Administrative user/role control boundary. |
| `app/api/audit-logs/route.ts` | 🟢 | Low | Secure audit logging API (Bypasses RLS for write-only). |
| `app/api/anomalies/route.ts` | 🟢 | Medium | Advanced fingerprinting & throttling logic. |
| `app/anomalies/page.tsx` | 🔴 | Low | Redundant placeholder; superseded by ledger/anomalies. |
| `app/rest/page.tsx` | 🟢 | Low | Business hour guard (locks access after 2 AM). |
| `lib/ledger-logic.ts` | 🟢 | ⚠️ | The "Brain": Business rules for locks & edit windows. |
| `middleware.ts` | 🟢 | ⚠️ | Critical: Auth, Rate-limiting, and UI Activity Logging. |
| `supabase/migrations/` | 🟢 | ⚠️ | Database-level hardening (Immutability & RLS). |

## Observations
1. **Hardcoded Stats**: `reports/page.tsx` has fake counts in the "Quick Statistics" section.
2. **Redundancy**: `app/anomalies/page.tsx` is still present but should be deleted to avoid confusion.
3. **Audit Readiness**: Core ledger registers (`register`, `day-book`) are correctly wired to the live transaction data and respect locking periods.
