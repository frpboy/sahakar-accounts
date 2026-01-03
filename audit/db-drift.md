# Database Schema Drift & Architectural Debt

## Critical Type Drift Analysis
The `lib/database.types.ts` file is severely outdated compared to the production-grade schema defined in recent migrations (`20260103_accounting_hardening.sql`, etc.).

### `transactions` Table
| Column | Typed (Row) | Present in DB | Notes |
| :--- | :---: | :---: | :--- |
| `id` | ✅ | ✅ | System primary key. |
| `outlet_id` | ❌ | ✅ | Missing in Types; fundamental for RLS. |
| `ledger_account_id`| ❌ | ✅ | Missing in Types; critical for Trial Balance. |
| `ledger_date` | ❌ | ✅ | Missing in Types; used for accounting periods. |
| `daily_record_id` | ✅ | ✅ | Architectural debt; redundant with `ledger_date`. |
| `payment_mode` | ✅ | ⚠️ | DB uses `payment_mode` (text) but code often refers to multi-select. |
| `is_reversal` | ❌ | ✅ | Missing in Types; critical for audit integrity. |

## Architectural Observations
1. **Redundant Mapping**: The system maintains `daily_records` (summaries) and `transactions` (line items). Some logic relies on `daily_record_id` (old way) while newer audit logic uses `ledger_date` (new way). 
2. **Missing Relationships**: `database.types.ts` is missing the foreign key relationship between `transactions.ledger_account_id` and `ledger_accounts.id`. This prevents TypeScript from providing autocompletion for joined ledger data.
3. **Enum Mismatch**: Hardcoded enums in `database.types.ts` (e.g., `payment_mode: 'cash' | 'upi'`) do not account for 'Card', 'Bank Transfer', or 'Credit' modes used in the actual business logic.

## Recommendation
- **Regenerate Types**: Run `supabase gen types typescript` to sync the physical schema with the application layer.
- **Deprecate `daily_record_id`**: Transition all logic to `ledger_date` + `outlet_id` to reduce coupling with the `daily_records` summary table.
