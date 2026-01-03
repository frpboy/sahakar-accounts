# Row Level Security (RLS) & Data Isolation Audit

## Core Policy Enforcement (Post-Hardening)
Following the `20260103_accounting_hardening.sql` and `20260101190000_kill_recursion.sql` migrations, the system has reached a high level of security integrity.

### `transactions` Table
| Operation | Policy | Status | Notes |
| :--- | :--- | :---: | :--- |
| `SELECT` | `transactions_view` | 🟢 | Uses `SECURITY DEFINER` helpers to avoid recursion. Scoped to outlet or Admin. |
| `INSERT` | `transactions_insert` | 🟢 | Blocks inserts if `daily_records.status = 'locked'`. |
| `UPDATE` | `update_transactions_deny_all` | 🟢 | Explicit `USING (false)` policy. Append-only enforcement. |
| `DELETE` | `delete_transactions_deny_all` | 🟢 | Explicit `USING (false)` policy. |

### `audit_logs` Table
| Operation | Policy | Status | Notes |
| :--- | :--- | :---: | :--- |
| `SELECT` | `Audit logs are read-only appendable` | 🟢 | Restricted to authenticated users. |
| `INSERT` | `Audit logs are insert only` | 🟢 | Open for all authenticated users (to allow logging from middleware). |
| `UPDATE` | `No updates to audit_logs` | 🟢 | Explicitly blocked. |
| `DELETE` | `No deletions from audit_logs` | 🟢 | Explicitly blocked. |

### `categories` Table
| Operation | Policy | Status | Notes |
| :--- | :--- | :---: | :--- |
| `SELECT` | `Anyone can view active categories` | 🟢 | Scoped to `is_active = true`. |
| `Mutation` | *None* | 🟢 | **Default Deny**: No policies exist for Insert/Update/Delete; effectively read-only. |

## Vulnerability & Risk Log
1. **User Table Recursion**: Resolved by `20260101190000_kill_recursion.sql` using Security Definer functions.
2. **Redundant Logic**: Policies still refer to `daily_records` (for locking) while some newer logic uses `day_locks`. This creates a split-brain risk if one is updated and the other isn't.
3. **Auditor Privilege**: The `auditor` role is correctly handled in `middleware.ts` but the RLS policies don't explicitly mention the `auditor` role; they rely on `outlet_id` scoping or Admin bypass.

## Recommendations
- **Consolidate Locking**: Standardize RLS to check `day_locks` table instead of `daily_records.status` for all transaction gating.
- **Explicit Auditor Role**: Add the `auditor` role to the `check_is_admin()` helper function to ensure they have global `SELECT` access without manual outlet mapping.
