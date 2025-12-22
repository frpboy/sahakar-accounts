# Phase 3: Transaction Management - Database Setup

## Quick Start

Run this SQL script in Supabase SQL Editor to set up the transaction management database schema.

**Location:** `database/phase3-schema.sql`

## What This Script Does

1. **Renames `daily_entries` to `daily_records`**
   - Updates the table name to match the plan

2. **Adds columns to `daily_records`:**
   - `opening_cash`, `opening_upi` - Starting balances
   - `closing_cash`, `closing_upi` - Calculated ending balances
   - `total_income`, `total_expense` - Calculated totals
   - `status` - 'draft', 'submitted', or 'locked'
   - `submitted_at`, `submitted_by` - Submission tracking
   - `locked_at`, `locked_by` - Lock tracking

3. **Creates `transactions` table:**
   - Individual income/expense entries
   - Links to daily_records
   - Tracks type, category, payment mode, amount
   - Audit trail (created_by, created_at, updated_at)

4. **Creates `categories` table:**
   - Predefined transaction categories
   - Separated by income/expense type
   - Includes 11 seeded categories

5. **Creates automatic balance calculation trigger:**
   - Updates daily_record totals whenever transactions change
   - Calculates closing balances automatically
   - No manual calculation needed!

6. **Sets up Row Level Security (RLS):**
   - Users can only see their outlet's transactions
   - Superadmin and HO can see all
   - Only draft records can be edited
   - Users can only edit their own transactions

## How to Run

1. Open Supabase SQL Editor
2. Copy the entire contents of `database/phase3-schema.sql`
3. Paste and run
4. Verify success (should show table counts and seeded categories)

## After Running

You'll be ready to:
- Create transactions
- Track daily income/expense
- Auto-calculate balances
- Enforce role-based access

**Next:** API routes and transaction forms!
