📘 Ledger Module – FINAL DESIGN PLAN (Accounting-Only)

Sidebar Button

📘 Ledger

This opens an accounting workspace, not reports, not transactions.

🔐 EDIT WINDOW RULES (CORE CONSTRAINT)

These rules drive UI + DB enforcement.

Role	Edit Window	Scope
Staff	Last 24 hours	Own outlet
Manager	Last 7 days	Own outlet
HO Accountant	Last 30 days	All outlets
Master Admin	Last 1 year	All outlets
Auditor	View only	All

⚠️ After window expiry → read-only + audit lock badge

🧱 LEDGER MODULE STRUCTURE (Pages & Sub-Pages)
1️⃣ Ledger Dashboard (Landing)

Route

/dashboard/ledger

Purpose

Quick accounting health snapshot.

KPI Cards

Total Debits (Period)

Total Credits (Period)

Cash Balance

Bank / UPI Balance

Customer Outstanding

Last Locked Date

Widgets

⚠️ Unbalanced Day Warning

🔒 Locked vs Editable Days Count

📤 Quick Export (CSV / Excel)

2️⃣ Chart of Accounts (Read-Mostly)

Route

/dashboard/ledger/accounts

Ledger Groups (SYSTEM CONTROLLED)
Assets

Cash

Bank

UPI

Customer Receivables

Liabilities

Supplier Payables

Customer Credits

Suspense

Income

Sales

Sales Returns

Expenses

Purchases

Operating Expenses

Staff Expenses

Table Columns

Ledger Code

Ledger Name

Group

Type (Dr / Cr)

Status

Permissions

Staff: ❌

Manager: View

HO: View

Admin: Create/Edit

3️⃣ Ledger Register (MOST IMPORTANT PAGE)

Route

/dashboard/ledger/register

Filters (Top Bar)

Date range

Ledger

Outlet (HO/Admin only)

Voucher Type

Table

| Date | Voucher | Ref No | Narration | Debit | Credit | Balance |

UX Rules

Running balance per ledger

Locked rows → greyed + lock icon

Click row → opens existing transaction drawer

Edit Rules

Inline edit only if within role time window

Outside window → disabled with tooltip:

“Edit window expired for your role”

4️⃣ Day Book

Route

/dashboard/ledger/day-book

Purpose

Chronological accounting log (auditor-friendly).

Columns

Time

Voucher Type

Reference

Debit

Credit

Mode

Outlet

Behavior

Sorted by time

No edits after lock

Export always enabled

5️⃣ Cash Book

Route

/dashboard/ledger/cash-book

Shows ONLY

Cash Sales

Cash Expenses

Cash Returns

Cash Credits

Columns

Date

Particulars

Debit (Cash In)

Credit (Cash Out)

Balance

This is pure cash accounting.

6️⃣ Bank / UPI Book

Route

/dashboard/ledger/bank-book

Tabs

UPI

Card

Bank Transfer

Columns

Date

Ref No

Mode

Debit

Credit

Balance

7️⃣ Customer Ledger

Route

/dashboard/ledger/customers

Customer Summary Table

| Customer | Phone | Debit | Credit | Balance | Status |

Status:

Dr = Customer owes

Cr = Advance

Customer Detail Drawer

Full running ledger

Sales

Returns

Credit received

Staff can edit within 24h only.

8️⃣ Supplier / Expense Ledger

Route

/dashboard/ledger/expenses

Used for

Purchases

Operating expenses

Vendor payments

Same edit-window logic applies.

9️⃣ Trial Balance

Route

/dashboard/ledger/trial-balance

Table

| Ledger | Debit | Credit |

Rules

Must balance

Red banner if mismatch

No editing here

Auditor lives here.

🔟 Profit & Loss

Route

/dashboard/ledger/pnl

Sections

Income

Sales

Returns (-)

Expenses

Purchases

Operating Expenses

Output

Gross Profit

Net Profit

1️⃣1️⃣ Balance Sheet

Route

/dashboard/ledger/balance-sheet

Structure

Assets = Liabilities + Equity

Auto-derived from ledger totals.

🧠 EDIT WINDOW ENFORCEMENT (IMPORTANT)
UI Layer

Edit button disabled beyond window

Tooltip explains why

Server Layer (Mandatory)

On update:

transaction_date >= NOW() - INTERVAL 'X days'


Role-based interval applied in policy.

No bypass. Ever.

📤 EXPORT OPTIONS (ALL LEDGER PAGES)
Role	Export
Staff	❌
Manager	CSV
HO Accountant	CSV / Excel
Admin	CSV / Excel / PDF
Auditor	PDF only
🚫 HARD SCOPE LOCK

We do NOT add:

Inventory ledger

Item-wise profit

GST

FIFO/LIFO

Stock valuation

This is accounting, not ERP bloat.

🧩 PHASE EXECUTION PLAN
Phase L-A (Must)

Ledger Register

Day Book

Cash / Bank Book

Customer Ledger

Phase L-B

Trial Balance

P&L

Balance Sheet

Phase L-C

PDF exports

Notes / narration edits (Admin only)

Audit remarks

✅ Final Reality Check

✔ Matches real-world accounting
✔ Respects your role hierarchy
✔ Staff-friendly but audit-safe
✔ Zero conflict with existing transactions
✔ No schema explosion


# 📘 Ledger Module – UI Wireframes (Accounting-Grade)

This document defines **page-level UI wireframes** for the Ledger module. These are **functional wireframes** meant for implementation — not visual mockups.

---

## 1️⃣ Ledger Dashboard (`/dashboard/ledger`)

```
┌───────────────────────────────────────────────┐
│ 📘 Ledger Dashboard        [Date Range ▾]     │
├───────────────────────────────────────────────┤
│ [ Total Debit ] [ Total Credit ] [ Cash Bal ] │
│ [ Bank/UPI ]   [ Outstanding ] [ Locked Date ]│
├───────────────────────────────────────────────┤
│ ⚠️ Unbalanced Days (if any)                    │
│ 🔒 Last Locked Date: 01 Jan 2026               │
├───────────────────────────────────────────────┤
│ 📊 Mini Trend (Debit vs Credit – 7 days)      │
├───────────────────────────────────────────────┤
│ [Go to Ledger Register] [Trial Balance]       │
└───────────────────────────────────────────────┘
```

**Notes**

* KPI cards clickable → deep links
* Lock info always visible

---

## 2️⃣ Ledger Register (`/dashboard/ledger/register`) ⭐ CORE PAGE

```
┌──────────────────────────────────────────────────────────┐
│ Ledger Register                                          │
├──────────────────────────────────────────────────────────┤
│ Date ▾ | Ledger ▾ | Outlet ▾ | Voucher ▾ | Search 🔍    │
├──────────────────────────────────────────────────────────┤
│ Date | Vch | Ref | Narration | Debit | Credit | Balance  │
│──────┼─────┼─────┼───────────┼───────┼────────┼─────────│
│ 02/01| SAL | HP- | Cash Sale | 5000  |        |  5000   │
│ 02/01| EXP | EXP | Rent      |       | 2000   |  3000   │
│ 01/01| SAL | HP- | Sale      | 3000  |        |  3000 🔒│
└──────────────────────────────────────────────────────────┘
```

**Row Behavior**

* 🔒 = outside edit window
* Editable rows → inline edit icon ✏️
* Click row → transaction drawer

---

## 3️⃣ Day Book (`/dashboard/ledger/day-book`)

```
┌───────────────────────────────────────────────┐
│ Day Book             [Date ▾] [Outlet ▾]     │
├───────────────────────────────────────────────┤
│ Time | Voucher | Ref | Debit | Credit | Mode │
│──────┼─────────┼─────┼───────┼────────┼──────│
│09:10 | Sale    | HP- | 2000  |        | Cash │
│10:45 | Expense | EX- |       | 500    | Cash │
└───────────────────────────────────────────────┘
```

Read-only except within role edit window.

---

## 4️⃣ Cash Book (`/dashboard/ledger/cash-book`)

```
┌───────────────────────────────────────────────┐
│ Cash Book            [Date ▾]                │
├───────────────────────────────────────────────┤
│ Date | Particulars | Cash In | Cash Out | Bal │
│──────┼─────────────┼─────────┼──────────┼─────│
│02/01 | Opening     |         |          |1000 │
│02/01 | Sale        | 5000    |          |6000 │
│02/01 | Expense     |         | 2000     |4000 │
└───────────────────────────────────────────────┘
```

Only cash-mode vouchers shown.

---

## 5️⃣ Bank / UPI Book (`/dashboard/ledger/bank-book`)

```
┌───────────────────────────────────────────────┐
│ Bank / UPI Book     [UPI ▾ | Card ▾ | Bank]   │
├───────────────────────────────────────────────┤
│ Date | Ref | Mode | Debit | Credit | Balance │
│──────┼─────┼──────┼───────┼────────┼─────────│
│02/01 | TXN | UPI  | 3000  |        | 3000    │
└───────────────────────────────────────────────┘
```

Tabs switch ledger source.

---

## 6️⃣ Customer Ledger (`/dashboard/ledger/customers`)

### Customer List

```
┌────────────────────────────────────────────────────┐
│ Customers Ledger     [Search 🔍]                   │
├────────────────────────────────────────────────────┤
│ Name | Phone | Debit | Credit | Balance | Status  │
│──────┼───────┼───────┼────────┼─────────┼─────────│
│ Arun | 98xxx | 8000  | 3000   | 5000 Dr | View ▶  │
└────────────────────────────────────────────────────┘
```

### Drawer – Customer Detail

```
┌──────────────── Customer: Arun ────────────────┐
│ Date | Ref | Debit | Credit | Balance          │
│──────┼─────┼───────┼────────┼──────────────────│
│02/01 | SAL | 5000  |        | 5000             │
│01/01 | CR  |       | 3000   | 2000             │
└────────────────────────────────────────────────┘
```

---

## 7️⃣ Trial Balance (`/dashboard/ledger/trial-balance`)

```
┌───────────────────────────────────────────────┐
│ Trial Balance          [Date ▾]               │
├───────────────────────────────────────────────┤
│ Ledger           | Debit     | Credit         │
│──────────────────┼───────────┼────────────────│
│ Cash             | 50,000    |                │
│ Sales            |           | 80,000         │
│ Expenses         | 30,000    |                │
│──────────────────┼───────────┼────────────────│
│ TOTAL            | 80,000    | 80,000 ✅       │
└───────────────────────────────────────────────┘
```

Mismatch → red alert banner.

---

## 8️⃣ Profit & Loss (`/dashboard/ledger/pnl`)

```
┌───────────────────────────────────────────────┐
│ Profit & Loss         [Date Range ▾]          │
├───────────────┬──────────────────────────────┤
│ Income        │ Expenses                     │
│───────────────┼──────────────────────────────│
│ Sales  80,000 │ Purchases   40,000           │
│ Returns 5,000 │ Expenses    20,000           │
├───────────────┴──────────────────────────────┤
│ Net Profit: ₹15,000                           │
└───────────────────────────────────────────────┘
```

---

## 9️⃣ Balance Sheet (`/dashboard/ledger/balance-sheet`)

```
┌───────────────────────────────────────────────┐
│ Balance Sheet         As on [Date ▾]          │
├───────────────┬──────────────────────────────┤
│ Assets        │ Liabilities                  │
│───────────────┼──────────────────────────────│
│ Cash   40,000 │ Payables      20,000         │
│ Bank   30,000 │ Capital       50,000         │
├───────────────┴──────────────────────────────┤
│ Assets = Liabilities ✅                       │
└───────────────────────────────────────────────┘
```

---

## 🔒 Visual Edit Rules (Global)

* 🔒 icon = locked
* ✏️ icon = editable
* Tooltip always explains restriction
* Audit badge shown for modified rows

---

## ✅ Ready for Implementation

These wireframes are intentionally **simple, dense, and accountant-approved**.
No decorative UI, no ERP nonsense.

Next steps:

* Component breakdown
* API + RLS rules
* Phase L-A implementation checklist



1️⃣ Core Ledger Principles (Foundation Rules)

These apply everywhere. No exceptions.

Rule 1: Ledger ≠ Transactions

Transactions = operational entries (sales, purchase, credit, returns)

Ledger = accounting truth derived from transactions

Staff never edits raw numbers blindly; they adjust ledger entries with reasons

👉 Ledger is the accounting mirror, not a free-text notebook.

Rule 2: No Deletions. Ever.

Ledger entries are append-only

Corrections are done via:

Reversal entry

Adjustment entry (with reason)

Original entry remains immutable

This is audit law, not preference.

Rule 3: Every Ledger Entry Must Balance

Debit = Credit, always

System must reject unbalanced saves

UI must show imbalance in red before save

If it doesn’t balance, it doesn’t save. Period.

2️⃣ Role-Based Edit Window Rules (Time Authority)

This is the heart of your requirement.

Role	Edit Window	Scope
Staff	24 hours	Own outlet only
Manager	7 days	Own outlet only
HO Accountant	30 days	All outlets
Master Admin	1 year	All outlets
Auditor	View only	All outlets
Enforcement Rules

Edit window is calculated from ledger_date, not created_at

UI + DB must enforce this

URL hacking must fail (RLS level)

Example:

Staff on Jan 5 cannot edit Jan 3 ledger → field disabled + save blocked

3️⃣ Ledger Posting Rules (How Entries Are Created)
Rule 4: Auto-posting from Transactions

These happen without staff choice:

Sale

Debit: Cash / Bank / Customer (Credit)

Credit: Sales Revenue

Purchase

Debit: Purchase / Expense

Credit: Cash / Bank / Supplier

Credit Received

Debit: Cash / Bank

Credit: Customer Outstanding

Returns

Reverse original accounts

Mandatory reason required

Staff sees them in ledger but doesn’t manually type debits/credits for these.

Rule 5: Manual Ledger Entries (Controlled)

Allowed only via Manual Journal Entry page.

Mandatory fields:

Date

Debit account

Credit account

Amount

Reason (text, required)

Created by (auto)

Only users within edit window can post manual entries.

4️⃣ Locking Rules (Day / Period Control)
Rule 6: Day Lock is Absolute

When a day is locked:

❌ No edits

❌ No new ledger entries

❌ No reversals

✅ Viewing allowed

Only:

Manager (own outlet)

HO Accountant

Admin
can unlock — with mandatory reason

Unlock action must write to audit_logs.

Rule 7: Ledger Lock Overrides Role Window

Even if:

Admin has 1-year edit power
If the day is locked → no edits

Lock > Role > UI

This keeps audit clean.

5️⃣ Account Structure Rules (Chart of Accounts)

Ledger pages must strictly follow a defined chart.

Mandatory Account Groups

Assets

Cash

Bank

Customer Receivable

Liabilities

Supplier Payable

Income

Sales

Other Income

Expenses

Purchase

Operational Expenses

Equity

Capital

Retained Earnings

Staff:

Cannot create accounts

Cannot rename accounts

Can only post against allowed accounts

Admin/HO:

Can manage chart of accounts

6️⃣ UX Enforcement Rules (Very Important)

UI must prevent mistakes before DB rejects them.

Visual Rules

Locked rows → grey background + 🔒 icon

Editable rows → normal

Out-of-window rows → disabled inputs + tooltip:

“Edit window expired (Staff: 24 hrs)”

Save Rules

Save button disabled if:

Debit ≠ Credit

Date outside edit window

Day locked

Reason missing

Drawer Rules

Ledger row click opens drawer:

Entry details

Source (Sale / Manual / Return)

Created by

Edit eligibility badge:

🟢 Editable

🔴 Locked by Date

🔴 Locked by Role

7️⃣ Audit & Traceability Rules

Every ledger entry must have:

Source type (sale, purchase, manual, adjustment)

Source ID (transaction id or journal id)

Created by

Created at

Outlet ID

Every unlock must log:

Who unlocked

Which date

Reason

Timestamp

Auditor:

Can export

Can view

Can drill down

Cannot touch anything

8️⃣ What NOT to Do (Hard No’s)

❌ Allow editing amounts without reason

❌ Allow deleting ledger rows

❌ Allow staff to edit beyond 24h via URL

❌ Allow ledger without debit/credit visibility

❌ Allow unlocked edits without audit trail

If any of these happen, the system is no longer accounting-grade.

Final Reality Check



Ledger UI – Component Breakdown (Authoritative)
1️⃣ LedgerTable (Core Workhorse)
Purpose

Primary interface for viewing and editing ledger entries within allowed windows.

This is not just a table — it’s an accounting control surface.

Responsibilities

Render ledger entries (read + conditional edit)

Enforce role + time window rules visually

Trigger LedgerDrawer for deep view / edit

Display lock status clearly

Support export (view-only roles)

Layout (Desktop)
┌──────────────────────────────────────────────┐
│ Date ▾ | Account | Debit | Credit | Balance │
│----------------------------------------------│
│ 02 Jan | Cash    | 5,000 |        | 25,000  │
│        | Sales   |       | 5,000  |         │
│----------------------------------------------│
│ 02 Jan | Expense | 1,200 |        | 23,800  │
│        | Cash    |       | 1,200  |         │
└──────────────────────────────────────────────┘


Mobile:

Grouped rows

Tap opens LedgerDrawer

Columns
Column	Rule
Date	Immutable once locked
Account	Read-only
Debit	Editable only if allowed
Credit	Editable only if allowed
Running Balance	View only
Status	🔒 Locked / 🟢 Editable
Behaviour Rules

Debit/Credit inline edit only if:

Day unlocked

Within role window

Editing one side auto-clears the other

Row highlights on edit (yellow)

Visual States

🔒 Locked row → greyed

🕒 Expired edit window → disabled + tooltip

🟢 Editable → normal

🔴 Unbalanced group → red border

Props (Contract)
LedgerTableProps {
  entries: LedgerEntry[]
  role: UserRole
  outletId: UUID
  editWindowDays: number
  isDayLocked: boolean
}

2️⃣ LedgerDrawer (Audit & Edit Control)
Purpose

Single source of truth for who did what, when, and why.

This is where auditors live.

Trigger

Click row / tap row

Opens from right (desktop)

Bottom sheet on mobile

Sections (Top → Bottom)
Header
Ledger Entry
🟢 Editable (Staff – 24h window)
or
🔒 Audit Locked

Entry Meta (Read Only)

Ledger Date

Outlet

Source Type (Sale / Purchase / Manual / Return)

Source Reference ID

Created By

Created At

Debit / Credit Breakdown
Debit
- Cash        ₹5,000

Credit
- Sales       ₹5,000


Editable only if allowed.

Adjustment Section (Conditional)

Visible only if:

Editable

Not auto-posted OR role allows adjustment

Fields:

Adjustment Amount

Reason (mandatory)

Preview Balance Impact

Audit Trail
History
- Created by Staff A – 10:12
- Edited by Manager – 11:45
- Unlocked by Manager (Reason) – 11:40

Footer Actions
Role	Action
Staff	Save (if within 24h)
Manager	Save + Reverse
HO	Save + Adjust
Admin	Save + Force Adjust
Auditor	Close only
Props
LedgerDrawerProps {
  entry: LedgerEntry
  role: UserRole
  canEdit: boolean
  lockReason?: string
}

3️⃣ BalanceCard (Decision Layer)
Purpose

High-level financial truth snapshot.

Used to answer:

“Where do we stand right now?”

Placement

Top of Ledger page (sticky on desktop)

Layout
┌─────────────────────────────┐
│ Closing Balance             │
│ ₹ 1,24,560                  │
│-----------------------------│
│ Cash      ₹45,200           │
│ Bank      ₹60,000           │
│ Credit    ₹19,360           │
│-----------------------------│
│ 🔒 Last Locked Day: 01 Jan  │
└─────────────────────────────┘

Behaviour Rules

Balance is calculated from ledger, not cached

Locked day shown clearly

Clicking opens “Balance Breakdown”

Visual Indicators

Green → positive

Red → negative

Amber → mismatch detected (should never happen)

Props
BalanceCardProps {
  closingBalance: number
  cash: number
  bank: number
  credit: number
  lastLockedDate: Date
}

4️⃣ How These Components Work Together
BalanceCard
   ↓
LedgerTable
   ↓ (click)
LedgerDrawer


Single source of truth:

LedgerTable = surface

LedgerDrawer = authority

BalanceCard = summary

5️⃣ Hard Rules These Components Must Enforce

No edit without reason

No delete anywhere

No save if debit ≠ credit

No edit beyond role window

No edit on locked day

Auditor never sees edit controls


What’s Missing in the Ledger (Critical Additions)
1️⃣ Ledger Period Selector (Non-Negotiable)
Why it’s missing

Right now we talked about tables and drawers, but no explicit period control.

Accountants never think in “infinite scroll”. They think:

Today

Yesterday

This Week

This Month

Locked Periods

Add:

LedgerPeriodBar

[ Today ] [ Yesterday ] [ This Week ] [ This Month ] [ Custom ]


Rules:

Staff → Today only

Manager → Last 7 days

HO → Month selector

Admin → Any period

This prevents:

Accidental edits in wrong periods

Performance issues

Audit confusion

2️⃣ Ledger Account Filter (Chart of Accounts Lite)
Missing concept

Ledger without account filtering becomes unusable fast.

You need a left-side account filter (even minimal).

Add:

AccountFilterPanel

Cash

Bank

Sales

Purchases

Expenses

Creditors

Debtors

Rules:

Filter is view-only

Editing still respects time rules

Without this, ledger review is painful.

3️⃣ Running Balance Freeze Marker
Problem

Balances change day to day, but locked days should visually freeze balances.

Add:

A visual marker:

───────────── LOCKED DAY ─────────────
Closing Balance (01 Jan): ₹1,24,560


Why this matters:

Auditors need a clear cut-off

Prevents “but balance changed” arguments

4️⃣ Ledger Source Integrity Indicator

Right now we show “Source Type”, but we need strength indicators.

Add badge:
Source	Badge
Auto (Sale/Purchase)	🔒 System
Manual Adjustment	⚠️ Manual
Reversal	🔁 Reversal

Manual entries should always:

Require reason

Be visually distinct

Be searchable

This is huge during audits.

5️⃣ Ledger Reversal Flow (NOT Edit)

Edits should be rare. Reversals should be normal.

Missing Component:

LedgerReverseModal

Flow:

Select Entry → Reverse
→ System creates opposite entry
→ Original marked “Reversed”
→ Reason mandatory


Why:

Keeps history immutable

Matches real accounting practice

Auditors love this

6️⃣ Balance Mismatch Detector (Silent Guardian)

Even with all rules, things break.

Add:

BalanceIntegrityBanner

Triggers when:

Debit ≠ Credit in a group

Ledger total ≠ Daily summary

Cash ledger ≠ Daily cash tally

UI:

⚠ Ledger imbalance detected on 02 Jan
[ View Details ]


This saves you from silent corruption.

7️⃣ Notes vs Reasons (Two Different Things)

You mentioned reasons, but clarify this split:

Field	Purpose
Note	Optional explanation
Reason	Mandatory for edits/reversals

Reason = compliance
Note = context

Do NOT merge them.

8️⃣ Export Scope Awareness

Export must clearly say:

Ledger Export
Outlet: Tirur
Period: 01 Jan – 07 Jan
Generated by: Manager A
Generated at: 02 Jan 14:12


Otherwise exports become legally weak.

9️⃣ Read-Only Ledger Preview for Staff (Past Data)

Staff shouldn’t hit “access denied” everywhere.

Add:

Past ledger → view-only

Greyed controls

Tooltip explaining restriction

This reduces frustration and support calls.

10️⃣ Performance Guardrails (Future Proofing)

You’ll need:

Server pagination

Date-based indexes

“Load next day” instead of infinite scroll

Not UI, but ledger dies without this.

Final Missing Components Summary
Add These Components

LedgerPeriodBar

AccountFilterPanel

LockedBalanceMarker

SourceIntegrityBadge

LedgerReverseModal

BalanceIntegrityBanner

Add These Rules

Edit < Reverse priority

Locked balances are visual cut-offs

Manual ≠ System entries

Reason ≠ Note


I’ll give you two things, clean and audit-grade:

1️⃣ Full Ledger Sidebar Structure (exact pages, roles, visibility)
2️⃣ Ledger ↔ Daily Close interaction rules (who can touch what, when, and how)

No theory. This is how real accounting ERPs do it.

1️⃣ FULL LEDGER SIDEBAR STRUCTURE

Add a new top-level sidebar item:

📒 Ledger


This is NOT hidden under Reports. Ledger is operational accounting.

📒 Ledger (Main Group)
1. 📘 General Ledger

Route:
/dashboard/ledger/general

Who sees it:

Staff (view + limited edit)

Manager

HO Accountant

Master Admin

Auditor (read-only)

Purpose:
Chronological debit/credit ledger across all accounts.

Sub-tabs inside page (NOT sidebar):

All Entries

Cash Ledger

Bank Ledger

Credit Ledger

Expense Ledger

2. 💵 Cash Ledger

Route:
/dashboard/ledger/cash

Purpose:
Day-wise physical cash movement.

Visible to:

Staff

Manager

HO

Admin

Auditor (view only)

Special UI:

Opening balance

Inflows

Outflows

Closing balance

Variance vs Daily Close

3. 🏦 Bank / UPI Ledger

Route:
/dashboard/ledger/bank

Purpose:
UPI, Card, Bank settlement tracking.

Includes:

Mode (UPI / Card / Bank)

Reference IDs

Settlement status (future)

4. 👥 Party Ledger

Route:
/dashboard/ledger/parties

Sub-sections:

Customer Ledger

Supplier Ledger

Used for:

Credit tracking

Aging

Statement generation

5. 🔁 Adjustments & Corrections

Route:
/dashboard/ledger/adjustments

Very important page.

Who can access:

Manager

HO Accountant

Master Admin

❌ Staff (no access)

Auditor (view only)

Contains:

Manual journal entries

Reversals

Balance corrections

Every entry here:

Requires mandatory reason

Is permanently tagged as manual

6. 📅 Daily Close (Linked but Separate)

Route:
/dashboard/ledger/daily-close

This is where ledger and operations meet.

Visible to:

Manager

HO Accountant

Admin

Staff sees:

Status only (read-only)

7. 📑 Ledger Exports

Route:
/dashboard/ledger/exports

Who:

Manager

HO

Admin

Exports:

Day

Date range

Account-wise

Party-wise

Sidebar Visibility Summary
Role	Ledger Visible	Editable
Staff	Yes	24 hrs
Manager	Yes	7 days
HO Accountant	Yes	30 days
Master Admin	Yes	1 year
Auditor	Yes	Never
2️⃣ LEDGER ↔ DAILY CLOSE INTERACTION RULES

This is where most ERPs fail. You won’t.

A. What is Daily Close?

Daily Close is a snapshot lock of:

Cash balance

Bank totals

Ledger totals

Transaction completeness

Once closed:

Ledger entries for that day are frozen

B. Ledger Editing Windows (HARD RULE)
Role	Can Edit Ledger
Staff	Same day only (T+0)
Manager	Last 7 days
HO Accountant	Last 30 days
Master Admin	Last 365 days
Auditor	Never

These are enforced:

In UI

In API

In DB (RLS / functions)

C. What Happens on Daily Close

When Manager clicks “Close Day”:

System does:

Validates:

Cash ledger = daily cash tally

Sales + returns + credits balanced

Generates:

Closing balance snapshot

Locks:

All ledger entries for that day

Writes:

daily_close_log

After this:
❌ No edits
❌ No deletions
❌ No backdated entries

D. Post-Close Corrections (VERY IMPORTANT)

Mistakes WILL happen.

❌ What is NOT allowed

Editing old ledger entries

Deleting transactions

✅ What IS allowed

Reversal + New Entry

Flow:

Locked Entry → Reverse
→ System creates opposite entry
→ Reason mandatory
→ New corrected entry added (today)


Ledger remains consistent. Audit remains clean.

E. Daily Close Unlock Rules

Unlocking is dangerous, so:

Who can unlock?

Manager → Own outlet (last 7 days)

HO Accountant → Any outlet (30 days)

Master Admin → Any time

Unlock requires:

Mandatory reason

Audit log entry

Warning banner

After unlock:

Ledger editable again

System shows “UNLOCKED” watermark

F. Ledger UI Behavior Based on Close Status
Day Status	UI Behavior
Open	Edit / Reverse allowed
Closed	Read-only
Unlocked	Warning banner + limited edit
Archived (1y+)	View only
G. Ledger vs Daily Records Sync

Ledger is source of truth.

Daily Record:

Is a snapshot

Never recalculates ledger

Ledger:

Always cumulative

Reflects reversals & corrections

H. Audit Guarantees (Non-Negotiable)

Every change → audit_log

Every unlock → audit_log

Every reversal → reason + user + timestamp

Ledger exports include lock status

Final Reality Check

What you have now = operational ERP
With this ledger system = audit-grade accounting software

This design will:

Survive audits

Scale to more outlets

Protect you legally

Reduce human error


Below are the non-negotiable logics that MUST be followed for your Ledger system.
This is not UI talk. This is accounting logic + ERP discipline.

If these are followed, your system will stand audits and scale. If not, it’ll collapse later.

🔒 CORE LEDGER LOGICS (MANDATORY)
1️⃣ Ledger is the Source of Truth

Everything else is derived.

Sales page ❌ not source of truth

Reports ❌ not source of truth

Dashboard ❌ not source of truth

✅ Ledger = single source of financial truth

Every financial action must result in:

Ledger Entry (or entries)


No exceptions.

2️⃣ Double-Entry Accounting (Even if hidden)

Every transaction must internally follow:

Debit ≠ Credit ❌
Debit = Credit ✅


Examples:

Sale (Cash)
Cash A/c        DR  ₹1,000
Sales A/c      CR  ₹1,000

Sale (Credit)
Customer A/c   DR  ₹1,000
Sales A/c      CR  ₹1,000

Credit Received
Cash/UPI A/c   DR  ₹1,000
Customer A/c   CR  ₹1,000


UI may show single row, ledger must store balanced entries.

3️⃣ Ledger Entries Are Immutable

Once created:

❌ No delete
❌ No overwrite
❌ No silent edits

Correction Rule

Wrong entry → Reverse → Create new entry

This preserves audit integrity.

4️⃣ Time-Bound Edit Authority (STRICT)

Editing means:

Reverse + re-post

Role	Editable Window
Staff	Same business day
Manager	7 days
HO Accountant	30 days
Master Admin	365 days
Auditor	Never

After window expiry → read-only.

5️⃣ Daily Close is a Ledger Lock

Daily Close is not cosmetic.

When day is closed:

Ledger entries of that date are frozen

Reports snapshot is preserved

Cash mismatch becomes visible forever

Ledger ≠ recalculated later.

6️⃣ Ledger Entries MUST Reference Origin

Every ledger row must have:

source_type (sale, return, purchase, adjustment)

source_id (transaction UUID)

outlet_id

business_date

This allows:

Drill-down

Audit tracing

Reconciliation

7️⃣ Ledger Date ≠ Created Date

Two different concepts:

business_date → accounting date

created_at → system timestamp

Backdated entries:

Allowed only within role window

Flagged visually

Logged in audit

8️⃣ Manual Ledger Entries Are Dangerous

So they must be:

Restricted to Managers / HO / Admin

Tagged as manual = true

Mandatory reason

Highlighted in UI

Manual entries must NEVER be default.

9️⃣ Daily Cash Must Reconcile

For each day & outlet:

Opening Cash
+ Cash Inflows
- Cash Outflows
= Closing Cash


If mismatch:

System flags variance

Daily Close cannot proceed without acknowledgment

🔁 RETURN & REVERSAL LOGIC (CRITICAL)
Sales Return

Does NOT delete original sale.

Instead:

Sales Return A/c  DR
Cash/UPI/Customer A/c CR


Mandatory reason is required.

10️⃣ Credit Aging is Ledger-Driven

Credit outstanding =

Sum(Customer Debits) - Sum(Customer Credits)


Not stored separately.
Never calculated from sales table.

11️⃣ Reports Read Ledger, Not Transactions

Transactions are input.
Ledger is truth.

Reports must query:

ledger_entries


Not sales / purchase tables.

12️⃣ Locked Days Stay Locked Forever (Unless Audited)

Unlocking:

Requires role permission

Mandatory reason

Audit log entry

Unlocked days show:
🚨 “UNLOCKED DAY – AUDIT RISK”

13️⃣ No Cross-Outlet Ledger Pollution

Ledger entries must always filter by:

outlet_id


No global accidental aggregation.

HO sees consolidated, DB stores isolated.

14️⃣ Ledger Balances Are Calculated, Not Stored

❌ Don’t store running balances
✅ Calculate on demand or cache safely

Stored balances get corrupted over time.

15️⃣ Ledger Must Support These Views

Without data duplication:

Day-wise ledger

Account-wise ledger

Party-wise ledger

Outlet-wise ledger

One table. Many views.

🧠 SYSTEM ENFORCEMENT LAYERS

These rules must be enforced at:

UI (disable buttons)

API (reject requests)

DB (RLS / functions)

UI checks alone are useless.

🚨 COMMON ERP MISTAKES TO AVOID

❌ Allowing delete

❌ Editing locked days

❌ Calculating reports from transactions

❌ Storing balances instead of computing

❌ Allowing staff to do adjustments

❌ Allowing silent corrections

You are already ahead by asking this now.


I’ll give you a complete, accounting-grade blueprint for all five items — UI, rules, governance, workflows, edge cases, and audit controls — written so you can actually build it without ambiguity.

I’m not pitching fluff. This is how real accounting systems survive auditors.

1️⃣ Chart of Accounts (CoA) — UI + Governance
🎯 Purpose

Create a controlled, hierarchical account structure that:

Staff can use

Managers can map

Only Admins can change

No free-for-all. No accidental corruption.

📚 Account Types (Immutable)

These are system-level enums:

Assets

Liabilities

Equity

Income

Expense

⚠️ Type can NEVER change after creation.

🧱 Account Hierarchy (3 Levels)
Assets
 └── Current Assets
     └── Cash in Hand
     └── Bank - UPI
     └── Bank - Card
Income
 └── Sales
     └── Pharmacy Sales
     └── Clinic Consultation
Expenses
 └── Operating Expenses
     └── Rent
     └── Salary
     └── Electricity

🖥️ UI Pages
📌 Sidebar
Ledger
 ├── Chart of Accounts
 ├── Ledger Register
 ├── Trial Balance
 ├── P&L
 └── Month-End Close

📄 Chart of Accounts Page

Table Columns

Account Code (Auto)

Account Name

Type

Parent Account

Status (Active / Disabled)

Locked 🔒 (System)

Actions

➕ Add Account (Admin only)

✏️ Edit Name (Admin only)

🚫 Disable (never delete)

🔐 Governance Rules
Action	Staff	Manager	HO	Admin
Create account	❌	❌	❌	✅
Rename account	❌	❌	❌	✅
Disable account	❌	❌	❌	✅
Post to account	✅	✅	✅	❌
Change type	❌	❌	❌	❌
⚠️ Hard Rules

Accounts are never deleted

Disabled accounts:

Can be viewed

Cannot be posted to

Parent account must exist

Leaf accounts only allow posting

2️⃣ Month-End Close Workflow
🎯 Purpose

Freeze accounting periods forever once reviewed.

🧭 Workflow Stages
OPEN → REVIEW → CLOSED → (LOCKED)

📄 Month-End Close Page
🧮 Summary Cards

Total Income

Total Expense

Net Profit/Loss

Cash Balance

Credit Outstanding

🧾 Mandatory Checklist

All must be ✅ before closing:

 All business days locked

 Cash reconciled (no variance OR explained)

 Credit balances reviewed

 Trial Balance matches

 No pending reversals

🔐 Close Action

Only HO Accountant / Admin

Requires:

Confirmation

Optional notes

Digital timestamp

🚫 After Close

No edits

No reversals

No unlocks

No adjustments

Month close is final.
If wrong → adjustment in next month only.

3️⃣ Trial Balance Variance Detector
🎯 Purpose

Detect broken accounting before auditors do.

📊 Trial Balance Page

Columns

Account

Debit

Credit

Net Balance

Footer

Total Debit: ₹ X
Total Credit: ₹ Y
Difference: ₹ Z

🚨 Variance Detection Logic

Triggered when:

Debit ≠ Credit

Difference > ₹0.01

Any account missing contra

🧠 Auto-Diagnostics Panel

Shows:

Orphan transactions

Unbalanced manual entries

Reversal without parent

Transactions posted on locked days

Missing ledger_date

🔔 Alerts

Banner on dashboard

Red badge on Trial Balance

Export blocked if variance exists

🔐 Permissions
Action	Staff	Manager	HO	Admin
View	✅	✅	✅	✅
Export	❌	❌	✅	✅
Fix variance	❌	❌	❌	❌

Variances are fixed via adjustments, not edits.

4️⃣ Fraud / Anomaly Signals (Ledger Behavior)
🎯 Purpose

Surface suspicious behavior, not just errors.

🚨 Anomaly Types
💰 Financial

Cash sale > ₹50,000

Sale > ₹1,00,000

Credit spike day-over-day

Refund without original sale

🧾 Behavioral

Too many manual entries

Frequent reversals by same user

Unlocks after midnight

Adjustments on old dates

⏰ Temporal

Entries outside duty window

Edits near closing time

Reversals post day-lock request

📊 Anomaly Dashboard

Widgets

🔴 Critical anomalies (Today)

🟠 Warnings (7 days)

🔵 Info signals

Table

Type

Severity

Linked Entry

User

Status

Action

🧠 Rules Engine (Configurable)

Admins can set thresholds:

Amount limits

Frequency limits

Time windows

🔐 Governance
Role	Action
Staff	View own alerts
Manager	View outlet alerts
HO	Review + resolve
Admin	Configure rules
5️⃣ External Accountant Export (Tally-Style)
🎯 Purpose

Let real accountants work without touching your system.

📦 Export Formats
1️⃣ CSV (Universal)

Ledger Entries

Trial Balance

P&L

Day-wise Cash

2️⃣ Excel (Structured)

Separate sheets:

CoA

Ledger

TB

P&L

Customers

3️⃣ Tally-Compatible Format

Columns

Voucher Date

Voucher Type

Voucher No

Debit Account

Credit Account

Amount

Narration

Reference ID

📄 Export Page

Filters

Date range

Outlet

Account

Voucher type

Options

Include reversals

Include narration

Group by voucher

🔐 Access Control
Role	Export
Staff	❌
Manager	❌
HO	✅
Admin	✅
Auditor	Read-only
🛡️ Audit Safeguards

Every export logged

File hash stored

Download expiry

Watermark: “For Audit Use Only”

🧠 FINAL SYSTEM PRINCIPLES (NON-NEGOTIABLE)

Nothing is edited — everything is corrected

Time determines authority

Ledger is the only truth

Reports never store numbers

Locks beat permissions

Exports don’t bypass governance


✅ Verdict: Ledger Transformation Status

Sahakar Accounts is now a true audit-grade accounting system.
Not “accounting-like”, not CRUD-with-reports — but ERP-correct.

What you’ve implemented matches core principles used in Tally, SAP, Oracle Financials.

I’ll break this into three parts:

✅ What is 100% DONE and correct

⚠️ What is OPTIONAL but enterprise-grade (not mandatory now)

🔒 Final non-negotiable rules to keep this audit-proof long-term

1️⃣ What Is 100% DONE (and Correct)
🔐 Immutability & Security (This is the big win)

You have fully crossed the line from CRUD to Ledger.

✔ UPDATE / DELETE blocked at DB level
✔ Append-only corrections via reversals
✔ Parent-child linkage for reversals
✔ Locked business days enforced server-side
✔ Audit logs append-only

👉 This alone makes the system auditor-defensible.

No UI trick, no API bypass can break accounting integrity now.

📘 Ledger Views (Rule-compliant)

All essential books are correctly implemented and derived:

Book	Status	Notes
Day Book	✅	Chronological, immutable
Cash Book	✅	Real-time derived
Bank / UPI Book	✅	Correct liquidity tracking
Customer Ledger	✅	Proper Dr/Cr netting
Expense Ledger	✅	Operational clarity
Manual Journal	✅	Guard-railed with reasons

✔ Single source of truth
✔ No stored balances
✔ No drift possible

This is textbook accounting.

⏱️ Business-Day Logic (Retail-Correct)

✔ 7 AM – 2 AM day boundary
✔ Applied consistently to:

Ledger

Reports

Day lock

Reconciliation

Reversals

This avoids the most common retail ERP mistake.

💰 Daily Reconciliation

✔ Physical vs Expected Cash enforced
✔ Variance acknowledgment mandatory
✔ No lock without reconciliation

This is exactly what auditors look for in pharmacy audits.

🛠️ Technical Cleanups

✔ Radix UI restored
✔ MetricCard props fixed
✔ RLS correctly applied to public.users
✔ Ledger UI components unified

Nothing blocking production here.

2️⃣ What Is OPTIONAL (Enterprise-Level Enhancements)

These are NOT required to be “audit-proof”, but are worth knowing.

🔹 A. Chart of Accounts UI (Optional, but recommended)

Right now:

Ledger works

Accounts exist implicitly

Later (optional):

Explicit CoA page

Admin-only governance

Cleaner exports

👉 Not required immediately.

🔹 B. Month-End Close (Optional unless statutory reporting begins)

You already have:

Day locking

Reconciliation

Month-end close adds:

Period-level freeze

Approval workflow

Carry-forward logic

👉 Needed only when statutory filings begin.

🔹 C. Trial Balance Variance Detector (Optional safety net)

Since your ledger is append-only:

Variances are unlikely

But detection helps catch logic bugs

👉 Nice to have, not urgent.

🔹 D. Fraud Signals (Optional intelligence layer)

You already laid groundwork earlier.

This becomes useful when:

Outlet count increases

Staff count increases

Delegation expands

👉 Phase-future feature.

🔹 E. Tally XML Export (Optional)

Right now:

CSV / Excel is enough

Tally XML needed only if:

External CA insists on native import

👉 Not mandatory for accounting correctness.

3️⃣ FINAL NON-NEGOTIABLE RULES (DO NOT BREAK)

These are laws, not features.

❌ Never Re-Enable UPDATE on transactions

Even for Admins.
Even “temporarily”.
Even “just once”.

❌ Never Allow Unlock Without Audit Log

Every unlock must record:

Who

When

Why

No exceptions.

❌ Never Store Derived Balances

No balance columns.
No cached totals without derivation logic.

Ledger = truth.

❌ Never Allow Editing Past Authority Window

Your rule is excellent and correct:

Role	Edit Window
Staff	24 hours
Manager	7 days
HO Accountant	1 month
Master Admin	1 year
Auditor	View only

And even then → reversal only, never edit.

🎯 Final Assessment

Straight talk:

This is not a small internal tool anymore

This is a real ERP ledger

You can safely:

Face auditors

Export books

Scale outlets

Lock periods

Defend numbers in writing

Most systems fail at immutability.
You didn’t.

Alright. This is the right moment to slow down, be precise, and lock this in properly.
What you’re proposing is not cosmetic — this is the step that turns Sahakar Accounts from a good ledger into a governed accounting system.

I’ll do this in five clean sections:

✅ Confirm the approach (no surprises)

🧱 Final CoA architecture (what exactly we’re building)

🔐 Governance & posting rules (hard constraints)

🖥️ UI pages & components (what staff/admin actually see)

🧪 Migration & verification (how we don’t break existing data)

No fluff. No hand-waving.

1️⃣ Confirmation: Your Direction Is Correct

Let’s be blunt:

Yes, migrating categories → ledger_accounts is unavoidable

Yes, remapping historical transactions is required

Yes, this is how real accounting systems work

If you don’t do this now, you will hit a wall later when:

Trial Balance doesn’t tie cleanly

External accountants ask for CoA codes

Month-end close needs enforcement

Tally / GST exports are requested

So: green light on the plan.

2️⃣ Final Chart of Accounts Architecture (Authoritative)
🧾 ledger_accounts (NEW – canonical)
ledger_accounts
---------------
id UUID PK
code TEXT UNIQUE          -- Auto-generated (e.g. 1001, 2103)
name TEXT                 -- Cash, Sales – Pharmacy, Rent Expense
type ENUM (
  'ASSET',
  'LIABILITY',
  'EQUITY',
  'INCOME',
  'EXPENSE'
)
parent_id UUID NULL       -- Self-reference
level INT                 -- 1, 2, 3 (derived)
is_leaf BOOLEAN           -- TRUE = posting allowed
is_locked BOOLEAN         -- Prevent posting (soft governance)
status ENUM ('ACTIVE', 'DISABLED')
created_at TIMESTAMPTZ

🎯 Hierarchy (3-level, enforced)

Example:

ASSETS
 └── Current Assets
     └── Cash


Rules:

Level 1 & 2 → never postable

Level 3 (leaf) → only valid posting targets

3️⃣ Transactions Table (Controlled Mutation)
🔁 Modify transactions
ALTER TABLE transactions
ADD COLUMN ledger_account_id UUID NOT NULL
REFERENCES ledger_accounts(id);


❌ Remove dependency on:

category

free-text accounting fields

✔ Every transaction must hit exactly one leaf ledger account

4️⃣ Hard Governance Rules (Non-Negotiable)

These are database-enforced, not UI promises.

🚫 Posting Rules (RLS + DB checks)

❌ Cannot post to non-leaf accounts

❌ Cannot post to DISABLED accounts

❌ Cannot post to LOCKED accounts

❌ Cannot post to a closed month

❌ Cannot bypass via API / script

This is how you stop accounting corruption.

🗓️ Month-End Close (NEW TABLE)
accounting_periods
------------------
id UUID PK
month DATE UNIQUE          -- 2026-01-01
status ENUM (
  'OPEN',
  'CLOSED',
  'REOPENED'
)
closed_by UUID
closed_at TIMESTAMPTZ
reopen_reason TEXT


Behavior:

CLOSED → zero inserts allowed for that period

REOPENED → allowed only with audit log

OPEN → normal operations

5️⃣ UI Pages & Responsibilities
📘 A. Chart of Accounts Manager

/dashboard/ledger/accounts

Access

Admin / Master Admin only

UI Layout

Tree view (expand/collapse)

Columns:

Code

Name

Type

Status

Leaf / Parent

Actions:

Add child

Disable account

Lock account

View usage count

Critical UX Guardrails

Disable delete if account has postings

Warning before disabling

Visual lock icon for non-postable nodes

📅 B. Month-End Close Page

/dashboard/ledger/close

Checklist UI

All days locked?

Cash reconciliation complete?

Trial balance balanced?

Variances acknowledged?

Buttons

Close Month

Reopen (Admin only, requires reason)

Visuals

Timeline of closed months

Red warning for OPEN past months

📊 C. Trial Balance (Upgraded)

Add:

Debit total

Credit total

Difference (must be zero)

Variance Panel

Highlight mismatched accounts

Drill-down to offending transactions

Export variance report

📤 D. External Export Engine

/api/export/tally

Formats:

Excel (mapped to CoA codes)

CSV (ledger-format)

Tally XML (optional but planned)

Mapping example:

Ledger Name → ledger_accounts.name
Ledger Code → ledger_accounts.code
Amount → Dr/Cr from transactions

6️⃣ Migration Strategy (Safe & Reversible)
Step 1: Create ledger_accounts

Seed standard accounts (Cash, Sales, Purchase, Expense, Creditors, Debtors)

Step 2: Map categories → accounts

One-time mapping table

Log every mapping decision

Step 3: Backfill transactions
UPDATE transactions
SET ledger_account_id = mapped_account_id

Step 4: Lock legacy fields

Remove category usage from UI

Keep column temporarily (read-only) if needed

7️⃣ Verification Checklist (Do Not Skip)
Automated

❌ Insert to parent account → rejected

❌ Insert to closed month → rejected

❌ Unbalanced journal → rejected

Manual

Tree integrity verified

Trial Balance = 0 variance

Export opens in Excel cleanly

Month close blocks posting immediately

🔚 Final Call

This plan is:

Technically sound

Auditor-aligned

Scalable

Future-proof

Once this is done, nothing fundamental is missing from the accounting c


I’ll give you a complete, accounting-grade blueprint for all five items — UI, rules, governance, workflows, edge cases, and audit controls — written so you can actually build it without ambiguity.

I’m not pitching fluff. This is how real accounting systems survive auditors.

1️⃣ Chart of Accounts (CoA) — UI + Governance
🎯 Purpose

Create a controlled, hierarchical account structure that:

Staff can use

Managers can map

Only Admins can change

No free-for-all. No accidental corruption.

📚 Account Types (Immutable)

These are system-level enums:

Assets

Liabilities

Equity

Income

Expense

⚠️ Type can NEVER change after creation.

🧱 Account Hierarchy (3 Levels)
Assets
 └── Current Assets
     └── Cash in Hand
     └── Bank - UPI
     └── Bank - Card
Income
 └── Sales
     └── Pharmacy Sales
     └── Clinic Consultation
Expenses
 └── Operating Expenses
     └── Rent
     └── Salary
     └── Electricity

🖥️ UI Pages
📌 Sidebar
Ledger
 ├── Chart of Accounts
 ├── Ledger Register
 ├── Trial Balance
 ├── P&L
 └── Month-End Close

📄 Chart of Accounts Page

Table Columns

Account Code (Auto)

Account Name

Type

Parent Account

Status (Active / Disabled)

Locked 🔒 (System)

Actions

➕ Add Account (Admin only)

✏️ Edit Name (Admin only)

🚫 Disable (never delete)

🔐 Governance Rules
Action	Staff	Manager	HO	Admin
Create account	❌	❌	❌	✅
Rename account	❌	❌	❌	✅
Disable account	❌	❌	❌	✅
Post to account	✅	✅	✅	❌
Change type	❌	❌	❌	❌
⚠️ Hard Rules

Accounts are never deleted

Disabled accounts:

Can be viewed

Cannot be posted to

Parent account must exist

Leaf accounts only allow posting

2️⃣ Month-End Close Workflow
🎯 Purpose

Freeze accounting periods forever once reviewed.

🧭 Workflow Stages
OPEN → REVIEW → CLOSED → (LOCKED)

📄 Month-End Close Page
🧮 Summary Cards

Total Income

Total Expense

Net Profit/Loss

Cash Balance

Credit Outstanding

🧾 Mandatory Checklist

All must be ✅ before closing:

 All business days locked

 Cash reconciled (no variance OR explained)

 Credit balances reviewed

 Trial Balance matches

 No pending reversals

🔐 Close Action

Only HO Accountant / Admin

Requires:

Confirmation

Optional notes

Digital timestamp

🚫 After Close

No edits

No reversals

No unlocks

No adjustments

Month close is final.
If wrong → adjustment in next month only.

3️⃣ Trial Balance Variance Detector
🎯 Purpose

Detect broken accounting before auditors do.

📊 Trial Balance Page

Columns

Account

Debit

Credit

Net Balance

Footer

Total Debit: ₹ X
Total Credit: ₹ Y
Difference: ₹ Z

🚨 Variance Detection Logic

Triggered when:

Debit ≠ Credit

Difference > ₹0.01

Any account missing contra

🧠 Auto-Diagnostics Panel

Shows:

Orphan transactions

Unbalanced manual entries

Reversal without parent

Transactions posted on locked days

Missing ledger_date

🔔 Alerts

Banner on dashboard

Red badge on Trial Balance

Export blocked if variance exists

🔐 Permissions
Action	Staff	Manager	HO	Admin
View	✅	✅	✅	✅
Export	❌	❌	✅	✅
Fix variance	❌	❌	❌	❌

Variances are fixed via adjustments, not edits.

4️⃣ Fraud / Anomaly Signals (Ledger Behavior)
🎯 Purpose

Surface suspicious behavior, not just errors.

🚨 Anomaly Types
💰 Financial

Cash sale > ₹50,000

Sale > ₹1,00,000

Credit spike day-over-day

Refund without original sale

🧾 Behavioral

Too many manual entries

Frequent reversals by same user

Unlocks after midnight

Adjustments on old dates

⏰ Temporal

Entries outside duty window

Edits near closing time

Reversals post day-lock request

📊 Anomaly Dashboard

Widgets

🔴 Critical anomalies (Today)

🟠 Warnings (7 days)

🔵 Info signals

Table

Type

Severity

Linked Entry

User

Status

Action

🧠 Rules Engine (Configurable)

Admins can set thresholds:

Amount limits

Frequency limits

Time windows

🔐 Governance
Role	Action
Staff	View own alerts
Manager	View outlet alerts
HO	Review + resolve
Admin	Configure rules
5️⃣ External Accountant Export (Tally-Style)
🎯 Purpose

Let real accountants work without touching your system.

📦 Export Formats
1️⃣ CSV (Universal)

Ledger Entries

Trial Balance

P&L

Day-wise Cash

2️⃣ Excel (Structured)

Separate sheets:

CoA

Ledger

TB

P&L

Customers

3️⃣ Tally-Compatible Format

Columns

Voucher Date

Voucher Type

Voucher No

Debit Account

Credit Account

Amount

Narration

Reference ID

📄 Export Page

Filters

Date range

Outlet

Account

Voucher type

Options

Include reversals

Include narration

Group by voucher

🔐 Access Control
Role	Export
Staff	❌
Manager	❌
HO	✅
Admin	✅
Auditor	Read-only
🛡️ Audit Safeguards

Every export logged

File hash stored

Download expiry

Watermark: “For Audit Use Only”

🧠 FINAL SYSTEM PRINCIPLES (NON-NEGOTIABLE)

Nothing is edited — everything is corrected

Time determines authority

Ledger is the only truth

Reports never store numbers

Locks beat permissions

Exports don’t bypass governance

⚠️ Things You MUST Double-Check (Non-Negotiable)

These are common places even good systems leak.

🔍 1. Trial Balance Zero-Variance Rule

Confirm this is hard-enforced, not visual only:

TB total Dr == Cr must be 0

Any variance:

Blocks month close

Shows exact offending transaction IDs

If variance can be “ignored”, that’s a future audit failure.

🔍 2. Manual Journal Governance

Make sure all manual entries enforce:

Mandatory narration

Mandatory source_type = manual

Separate permission from normal transactions

Visible “Manual Entry Risk” banner

Manual journals are where fraud hides.

🔍 3. Reversal Dating Rule

Reversals must:

Post on current open date

NOT back-date into locked periods

Reference original transaction date clearly

Back-dated reversals = silent tampering.

🔍 4. Cash Reconciliation Authority

Confirm:

Staff can declare variance

Manager must accept variance

Variance logged, never auto-adjusted

Never auto-fix cash mismatches. Ever.

🧠 What’s Still Missing (Optional but Strongly Recommended)

These aren’t required for “ledger correctness”, but they elevate the system.

🧾 1️⃣ Account Usage Heatmap

On CoA page:

Show how often an account is used

Warn before locking frequently used accounts

Prevents operational breakage.

🧾 2️⃣ Ledger Aging Views

Especially for:

Customer Ledger

Supplier Ledger

Add:

0–30

31–60

61–90

90+

This is basic accounting hygiene.

🧾 3️⃣ Month-End Close Checklist Lock

Don’t just “close” a month.
Force checklist completion:

All days locked ✔

TB balanced ✔

Cash variance acknowledged ✔

Credit aging reviewed ✔

Checkboxes + signatures = governance.

🧾 4️⃣ Hash Chain (Advanced, Optional)

If you want real audit flex:

Hash each transaction

Chain hashes by date

Detect tampering mathematically

Not required now, but it future-proofs you.