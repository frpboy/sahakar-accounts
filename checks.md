🔧 Sahakar Accounts — Project Rescue & Completion Order

Objective:
Identify broken, unfinished, partially wired, dead, or unsafe code across the entire repo and rectify immediately without introducing regressions — until the system reaches closure-grade stability.

PHASE 0 — SAFETY FIRST (Non-Negotiable)

Before touching anything

Freeze features

❌ No new features

❌ No refactors “because it looks ugly”

✅ Only fix what is broken, missing, or unsafe

Create safety net

Tag current production commit

git tag prod-stable-YYYYMMDD


Enable Supabase point-in-time recovery

Disable automatic migrations

Define “do not break” contracts

Ledger immutability

RLS rules

Day / Month locks

ID generation

Existing reports

PHASE 1 — INVENTORY & TRUTH FINDING (READ-ONLY)

Goal: Know exactly what exists, what’s wired, and what’s fake.

1️⃣ Folder-Level Audit (Top to Bottom)

Audit every folder, classify files into:

Status	Meaning
🟢 Live & Used	Actively imported and executed
🟡 Wired but Incomplete	UI exists, logic missing
🔴 Dead Code	Not imported anywhere
⚠️ Dangerous	Bypasses rules / missing checks

Mandatory folders to audit

/app
/components
/lib
/hooks
/api
/supabase
/utils


📌 Output:

audit/inventory.md

One row per file:

path | used_by | risk | notes

2️⃣ Route Wiring Audit

For every route under /dashboard:

Sidebar link exists?

Route exists?

Page loads without console errors?

Correct role gate?

Correct outlet scoping?

Correct lock enforcement?

📌 Output:

audit/routes.md

3️⃣ Component Usage Map

For every reusable component:

Where is it imported?

Is every prop used?

Are there unused props?

Any any typing?

Any silent fallbacks?

📌 Red flags:

Components that look finished but are never used

Buttons with onClick={() => {}}

UI without backend calls

📌 Output:

audit/components.md

PHASE 2 — DATABASE & LOGIC CONSISTENCY CHECK

This is where ERPs usually rot.

4️⃣ Database vs Code Drift

For each table:

Does UI rely on fields that don’t exist?

Are nullable fields incorrectly assumed?

Are enums mirrored correctly in TS?

Are triggers relied on but undocumented?

Tables to scrutinize deeply:

transactions

ledger_accounts

daily_records

accounting_periods

customers

audit_logs

duty_logs

📌 Output:

audit/db-drift.md

5️⃣ RLS Reality Check

For every table:

SELECT policy?

INSERT policy?

UPDATE policy (should it exist?)

DELETE policy (should it exist?)

🚨 Immediate fail conditions:

UI-only permission checks

Missing WITH CHECK

Role comparisons done in frontend

📌 Output:

audit/rls.md

PHASE 3 — BROKEN & HALF-FINISHED FIXES (SURGICAL)

Fix only what is provably broken.

6️⃣ Broken UX Fix Order (Strict Priority)

Buttons that do nothing

Forms that submit but don’t persist

Pages that load but show empty state incorrectly

Reports that lie (wrong totals / filters)

Silent failures (no toast, no error)

Each fix must:

Be minimal

Have a before/after explanation

Not change behavior elsewhere

📌 Output:

audit/fixes.md

7️⃣ Ledger & Financial Guardrail Re-Verification

Re-run these tests after every fix:

Can a locked day be modified? → NO

Can a month-closed period accept entries? → NO

Can a transaction be edited? → NO

Are reversals append-only? → YES

Does Trial Balance net to zero? → YES

📌 Output:

audit/ledger-verification.md

PHASE 4 — CLEANUP (ONLY AFTER STABILITY)

No cleanup before this phase.

8️⃣ Dead Code Removal

Delete only code that satisfies all 3:

Not imported

Not referenced

Not planned in roadmap

Every deletion:

Separate commit

Mention in cleanup log

📌 Output:

audit/cleanup.md

9️⃣ Naming & Convention Fixes (Last)

Only now:

Rename misleading components

Align file names with behavior

Remove legacy naming (category, oldTxn, etc.)

PHASE 5 — FINAL CLOSURE CHECK

This is how you know you’re done.

10️⃣ Closure Checklist

No TODOs in prod code

No commented-out logic

No unused environment variables

No console.logs

No silent catch blocks

No “temporary” UI labels

📌 Output:

audit/closure.md

🔐 RULES THAT MUST NEVER BE BROKEN

Print this mentally:

❌ Never UPDATE a transaction

❌ Never bypass RLS

❌ Never trust frontend role checks

❌ Never auto-adjust balances

✅ Always append

✅ Always log

✅ Always lock