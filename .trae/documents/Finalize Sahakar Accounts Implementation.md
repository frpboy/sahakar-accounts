# Complete Sahakar Accounts Project Plan

Based on the analysis, the project is largely complete with a solid architecture (Next.js 14, Supabase, Tailwind). However, there are specific areas where "mock" data or incomplete implementations exist, specifically in the reporting modules and the Google Sheets sync logic.

## 1. Implement Missing API Endpoints
### Cash Flow Report API
- **Current Status**: `CashFlowReportPage` uses mock data and has a TODO to replace it.
- **Action**: Create `app/api/reports/cash-flow/route.ts`.
- **Logic**:
  - Accept `month` and `outletId`.
  - Fetch `daily_records` for the specified month.
  - Fetch related `transactions` to calculate `cash_in`, `cash_out`, `upi_in`, `upi_out` (since `daily_records` only stores grand totals).
  - Return formatted daily data for the frontend chart/table.

## 2. Connect Frontend to Real APIs
### Audit Logs Page
- **Current Status**: `AuditLogsViewer` has a TODO and fetches from `/api/audit-logs` but doesn't pass filters.
- **Action**: Update `app/(dashboard)/dashboard/audit-logs/page.tsx` to:
  - Pass `startDate`, `endDate`, `severity`, `action` as query parameters.
  - Handle loading and error states correctly.
  - Remove the TODO comment.

### Cash Flow Page
- **Current Status**: Returns empty array `[]`.
- **Action**: Update `app/(dashboard)/dashboard/cash-flow/page.tsx` to fetch from the new `/api/reports/cash-flow` endpoint.

## 3. Fix Google Sheets Sync Logic
- **Current Status**: The cron job (`app/api/cron/sync-sheets/route.ts`) attempts to read `income_cash`, `income_upi`, etc., from `daily_records`.
- **Issue**: The `daily_records` table schema (verified via `database.types.ts`) only contains `total_income` and `total_expense`. It does **not** have the cash/UPI split columns. This means the sync is likely writing `0`s or `undefined` for these fields.
- **Action**: Update the sync logic to:
  - Fetch transactions associated with the daily record.
  - Calculate `income_cash`, `income_upi`, `expense_cash`, `expense_upi` on the fly from the transactions.
  - Use these calculated values for the Google Sheets row data.

## 4. Technical Debt Cleanup
- **Type Definitions**: Update `lib/temp-types.ts` to use or re-export the generated `lib/database.types.ts` to ensure type safety across the app.
- **Verification**: Ensure all "TODO" comments related to core functionality are resolved.

## Execution Order
1.  **Backend**: Create `cash-flow` API.
2.  **Backend Fix**: Repair `sync-sheets` logic.
3.  **Frontend**: Update Audit Logs and Cash Flow pages.
4.  **Cleanup**: Refactor types.
