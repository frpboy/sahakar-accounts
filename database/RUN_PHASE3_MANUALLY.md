# Phase 3 Database Setup - Manual Instructions

Since the Supabase CLI has issues with the .env.local file format, here's how to run the SQL manually:

## Option 1: Via Supabase Web UI (Recommended)

1. **Open Supabase SQL Editor:**
   - Go to: https://supabase.com/dashboard/project/pvdqotuhuwzooysrmtrd/sql/new

2. **Copy the SQL:**
   - Open file: `database/phase3-schema.sql`
   - Select all (Ctrl+A) and copy (Ctrl+C)

3. **Run the SQL:**
   - Paste into the SQL Editor
   - Click "Run" button
   - Wait for completion (~10 seconds)

4. **Verify Success:**
   You should see output showing:
   ```
   table_name     | columns
   ---------------------
   daily_records  | 18
   transactions   | 9
   categories     | 6

   status                | count
   ----------------------|-------
   Categories seeded     | 11
   ```

## Option 2: Fix Supabase CLI (Advanced)

The issue is in `.env.local` - the GOOGLE_SHEETS_PRIVATE_KEY contains commas which confuses the parser.

**Quick fix:**
1. Temporarily rename `.env.local` to `.env.local.backup`
2. Run: `supabase link --project-ref pvdqotuhuwzooysrmtrd`
3. Run: `supabase db push`
4. Rename back: `.env.local.backup` to `.env.local`

## What Happens After Running

All these tables/features will be created:
- ✅ `daily_records` table (renamed from daily_entries, 11 new columns added)
- ✅ `transactions` table (for income/expense entries)
- ✅ `categories` table (with 11 pre-seeded categories)
- ✅ Automatic balance calculation trigger
- ✅ Row Level Security policies

**Then I can continue building the transaction forms and API!**
