# Sahakar HyperPharmacy & SmartClinic Accounts System
## EXECUTION BLUEPRINT

**System Name**: Sahakar Accounts  
**Purpose**: Replace manual spreadsheet accounting with secure, role-based web system  
**Scale**: 10 → 140+ outlets  
**Source of Truth**: Web App with in-app export logs (no external sheet mirror)

---

## 1️⃣ USER ROLES & RESPONSIBILITIES

### 1.1 Super Admin

**Purpose**: System owner & governance authority

**Daily Responsibilities**:
- System health monitoring
- User account management
- Critical issue resolution
- Configuration management

**Permissions**:
- ✅ Create/deactivate users
- ✅ Assign roles to users
- ✅ Assign stores to users (many-to-many)
- ✅ Create/deactivate stores
- ✅ Override locks (WITH mandatory reason + audit log)
- ✅ Access all data across all stores
- ✅ View complete audit logs
- ✅ Configure categories, GST rates, system rules
- ✅ Export any data (with watermark)
- ✅ Emergency unlock capability
- ✅ Edit past days data (ONLY role with this permission)

**Restrictions**:
- ❌ Should NOT perform daily data entry
- ❌ Overrides MUST always be logged with reason
- ❌ Cannot delete locked days (only soft delete with reason)
- ❌ Can only edit past data during locking window (2 AM - 6:59 AM IST)

**Accountability**:
- All Super Admin actions logged with timestamp, IP, reason
- Override actions trigger email to HO Accountant
- Access to Super Admin role requires 2FA

---

### 1.2 HO Accountant

**Purpose**: Daily financial monitoring and closure

**Daily Responsibilities**:
- Review submitted days from all stores (9 AM - 12 PM daily)
- Verify totals against expected ranges
- Flag anomalies for Manager review
- Lock verified days (before EOD)
- Generate monthly consolidated reports

**Permissions**:
- ✅ View all stores (read-only)
- ✅ View all daily entries across stores
- ✅ Lock daily accounts (during locking window: 2 AM - 6:59 AM IST)
- ✅ Unlock days (within 48 hours of lock, with reason, during locking window only)
- ✅ Flag entries for Manager review
- ✅ Generate reports (daily/monthly/custom range)
- ✅ Export data (PDF/Excel) with watermark
- ✅ Compare app data with Google Sheets
- ✅ View audit logs (read-only)

**Restrictions**:
- ❌ Cannot edit any transactions
- ❌ Cannot create/delete users
- ❌ Cannot create stores
- ❌ Cannot override locks (must request Super Admin)
- ❌ Cannot delete data
- ❌ Cannot edit past days data
- ❌ Can only lock/unlock during locking window (2 AM - 6:59 AM IST)

**Daily Workflow**:
1. Log in during locking window (2 AM - 6:59 AM IST)
2. Review "Pending Verification" queue from previous day
3. For each submitted day:
   - Verify opening balance = previous closing
   - Check totals are reasonable
   - Compare cash/UPI split
   - Flag if discrepancies found
4. Lock verified days (must complete before 6:59 AM)
5. Send daily summary email to management

**What They See**:
- Dashboard: Pending submissions count, locked count, flagged count
- Submitted days list (sortable by store, date)
- Daily entry details (all transactions, balances)
- Monthly summaries per store
- Anomaly alerts

**Accountability**:
- Must lock days within 24 hours of submission
- Delayed locks trigger automatic escalation
- Lock actions are audited

---

### 1.3 Store Manager

**Purpose**: Responsible for accuracy of a single store

**Daily Responsibilities**:
- Oversee daily data entry
- Review day before submission
- Submit day to HO by 8 PM daily
- Respond to HO flags within 24 hours
- Train store staff on system

**Permissions**:
- ✅ View only assigned store(s)
- ✅ Add/edit transactions (current day only, before submission)
- ✅ Delete transactions (current day only, before submission, with reason)
- ✅ Set opening balances (current day only, if previous day missing)
- ✅ Review daily summary (current day)
- ✅ Submit day for HO review (before 1:59 AM)
- ✅ View past locked days (read-only, last 90 days)
- ✅ Export own store data (last 90 days)
- ✅ View Store User activity logs
- ✅ Unsubmit day (within 30 minutes of submission, if not yet locked)

**Restrictions**:
- ❌ Cannot lock day (only HO Accountant during locking window)
- ❌ Cannot edit after submission (unless unlocked by HO during locking window)
- ❌ Cannot edit past days data (only current day editable)
- ❌ Cannot export bulk data (>90 days)
- ❌ Cannot access other stores
- ❌ Cannot create users (request Super Admin)
- ❌ Cannot submit after 1:59 AM (day auto-closes)

**Daily Workflow**:
1. Check opening balances at 7 AM (auto-filled from yesterday)
2. Monitor transaction entry throughout day (7 AM - 1:59 AM)
3. Review totals at 11 PM
4. Verify closing balances match physical count
5. Submit day by 1:30 AM (before 1:59 AM deadline)
6. Respond to HO flags during next locking window

**What They See**:
- Today's entry form
- Live running totals (Cash In/Out, UPI In/Out)
- Transaction list (editable, filterable)
- Submit button (enabled when ≥1 transaction)
- Past 90 days (locked, read-only)
- Monthly summary for their store

**Accountability**:
- Submission = declaration of correctness
- Manager name stamped on submission
- Late submissions flagged (>1:30 AM, critical if >1:59 AM)
- Unsubmit actions are audited
- Cannot edit past days (only Super Admin can)

---

### 1.4 Store User

**Purpose**: Operational data entry only

**Daily Responsibilities**:
- Enter transactions as they occur (7 AM - 1:59 AM)
- Tag category, payment mode correctly
- Add brief description
- Physical cash/UPI verification

**Permissions**:
- ✅ Add transactions (current day only)
- ✅ Edit own transactions (before Manager submits)
- ✅ Delete own transactions (before Manager submits, with reason)
- ✅ View current day totals
- ✅ View own transaction history (current day)

**Restrictions**:
- ❌ Cannot submit day (only Manager)
- ❌ Cannot view past days (only current day visible)
- ❌ Cannot edit past days data (only current day)
- ❌ Cannot edit opening/closing balances
- ❌ Cannot export data
- ❌ Cannot edit after Manager submission
- ❌ Cannot view other users' transactions
- ❌ Cannot access settings

**UI Requirements**:
- Mobile-first design
- Extremely simple 4-field form:
  1. Type: Income / Expense (toggle)
  2. Category: Dropdown (filtered by type)
  3. Payment Mode: Cash / UPI (toggle)
  4. Amount: Number pad
  5. Description: Optional, max 100 chars
- Quick save button
- Live balance display

**What They See**:
- Quick entry form
- Running totals (today)
- Their transaction list (today)
- Last 5 entries (read-only)

**Accountability**:
- Each transaction stamped with user ID, timestamp
- Edit/delete actions logged
- Suspicious patterns flagged (e.g., 10 deletes in 1 hour)

---

### 1.5 CA / Auditor

**Purpose**: Compliance, audit, verification

**Access Model**:
- Time-bound access (e.g., 7 days for monthly audit)
- Granted by Super Admin only
- Automatic expire after duration
- Read-only access with explicit UI indicator

**Permissions**:
- ✅ View locked data only
- ✅ Export reports (with "AUDITOR COPY" watermark)
- ✅ Filter by date range, store, category
- ✅ View audit logs (read-only)
- ✅ Generate compliance reports

**Restrictions**:
- ❌ Cannot view draft or submitted (unlocked) data
- ❌ Cannot modify anything
- ❌ Cannot see internal notes or flags
- ❌ Cannot access user management
- ❌ Cannot unlock or lock days

**UI Indicator**:
- Persistent banner: "🔒 READ-ONLY AUDITOR MODE"
- All buttons disabled except export/filter
- No forms visible

**What They See**:
- Locked days only
- Transaction details (all fields)
- Monthly summaries
- Audit trail (who locked, when)
- Compliance reports (GST, category-wise)

**Accountability**:
- All auditor actions logged
- Access grant/revoke logged
- Export actions stamped with auditor name + date

---

## 2️⃣ CORE DATA ENTITIES

### 2.1 Store

**Purpose**: Individual hyperpharmacy/clinic location

**Fields**:
| Field | Type | Required | Editable By | Notes |
|-------|------|----------|-------------|-------|
| `id` | UUID | ✅ | System | Auto-generated |
| `code` | VARCHAR(20) | ✅ | Super Admin | Unique, uppercase (e.g., "MLTR01") |
| `name` | VARCHAR(255) | ✅ | Super Admin | Display name |
| `location` | VARCHAR(255) | ❌ | Super Admin | Address |
| `phone` | VARCHAR(20) | ❌ | Super Admin | Contact |
| `google_sheet_id` | VARCHAR(255) | ❌ | Super Admin | Google Sheets file ID for sync |
| `is_active` | BOOLEAN | ✅ | Super Admin | Default: true |
| `created_at` | TIMESTAMP | ✅ | System | Auto |
| `updated_at` | TIMESTAMP | ✅ | System | Auto |

**Who Can Create**: Super Admin only  
**Who Can Edit**: Super Admin only  
**When Immutable**: Never (always editable by Super Admin)  
**Soft Delete**: `is_active = false` (retain for audit)

---

### 2.2 User

**Purpose**: System user with role-based access

**Fields**:
| Field | Type | Required | Editable By | Notes |
|-------|------|----------|-------------|-------|
| `id` | UUID | ✅ | System | Linked to auth.users |
| `email` | VARCHAR(255) | ✅ | Super Admin | Unique |
| `full_name` | VARCHAR(255) | ✅ | Super Admin | Display name |
| `role` | ENUM | ✅ | Super Admin | One of 5 roles |
| `phone` | VARCHAR(20) | ❌ | Super Admin | Optional |
| `is_active` | BOOLEAN | ✅ | Super Admin | Default: true |
| `created_at` | TIMESTAMP | ✅ | System | Auto |
| `last_login_at` | TIMESTAMP | ❌ | System | Auto-update |

**Roles ENUM**:
- `super_admin`
- `ho_accountant`
- `store_manager`
- `store_user`
- `ca_auditor`

**Who Can Create**: Super Admin only  
**Who Can Edit**: Super Admin only (role changes logged)  
**When Immutable**: Never  
**User-Store Mapping**: Many-to-many via `user_store_access` table

---

### 2.3 Daily Business Day

**Purpose**: Single day's accounting for one store

**Fields**:
| Field | Type | Required | Editable By | Notes |
|-------|------|----------|-------------|-------|
| `id` | UUID | ✅ | System | Auto |
| `store_id` | UUID | ✅ | System | FK to stores |
| `date` | DATE | ✅ | Manager | Must be <= today |
| `opening_cash` | DECIMAL(12,2) | ✅ | Manager | Auto-filled from prev day |
| `opening_upi` | DECIMAL(12,2) | ✅ | Manager | Auto-filled from prev day |
| `closing_cash` | DECIMAL(12,2) | ❌ | System | Calculated |
| `closing_upi` | DECIMAL(12,2) | ❌ | System | Calculated |
| `total_income` | DECIMAL(12,2) | ❌ | System | Sum of income txns |
| `total_expense` | DECIMAL(12,2) | ❌ | System | Sum of expense txns |
| `status` | ENUM | ✅ | Workflow | See below |
| `submitted_at` | TIMESTAMP | ❌ | System | When Manager submits |
| `submitted_by` | UUID | ❌ | System | Manager user ID |
| `locked_at` | TIMESTAMP | ❌ | System | When HO locks |
| `locked_by` | UUID | ❌ | System | HO user ID |
| `synced_to_sheet` | BOOLEAN | ✅ | System | Default: false |
| `last_synced_at` | TIMESTAMP | ❌ | System | Last sync time |

**Status ENUM**:
- `draft`: Being edited by Manager/User
- `submitted`: Awaiting HO verification
- `locked`: Verified & locked by HO (immutable)

**State Transitions**:
```
draft → submitted (Manager)
submitted → draft (Manager, within 2 hours)
submitted → locked (HO Accountant)
locked → submitted (HO Accountant, within 48 hours, with reason)
locked → locked (Super Admin override only, with reason)
```

**Unique Constraint**: `(store_id, date)` - one record per store per day

**Who Can Create**: Manager (for current/past date)  
**Who Can Edit**:
- Draft: Manager, Store User
- Submitted: No one (unless unlocked)
- Locked: No one (unless Super Admin override)

**When Immutable**: After status = `locked`

**Calculated Fields** (auto-update on transaction change):
```
closing_cash = opening_cash + SUM(income WHERE mode=cash) - SUM(expense WHERE mode=cash)
closing_upi = opening_upi + SUM(income WHERE mode=upi) - SUM(expense WHERE mode=upi)
total_income = SUM(amount WHERE type=income)
total_expense = SUM(amount WHERE type=expense)
```

---

### 2.4 Transaction

**Purpose**: Individual income/expense entry

**Fields**:
| Field | Type | Required | Editable By | Notes |
|-------|------|----------|-------------|-------|
| `id` | UUID | ✅ | System | Auto |
| `daily_record_id` | UUID | ✅ | System | FK to daily_records |
| `type` | ENUM | ✅ | User | `income` or `expense` |
| `category` | VARCHAR(100) | ✅ | User | Must match categories table |
| `payment_mode` | ENUM | ✅ | User | `cash` or `upi` |
| `amount` | DECIMAL(12,2) | ✅ | User | Must be > 0 |
| `description` | TEXT | ❌ | User | Max 500 chars |
| `created_by` | UUID | ✅ | System | User ID |
| `created_at` | TIMESTAMP | ✅ | System | Auto |
| `updated_at` | TIMESTAMP | ✅ | System | Auto on edit |

**Validation Rules**:
- `amount` > 0
- `category` must exist in categories table
- `type` must match `category.type`
- `payment_mode` in ['cash', 'upi']
- Cannot create if `daily_record.status = locked`

**Who Can Create**: Manager, Store User  
**Who Can Edit**: Creator only (if day not submitted)  
**Who Can Delete**: Creator only (if day not submitted, with reason)  
**When Immutable**: When `daily_record.status != draft`

---

### 2.5 Payment Mode

**Purpose**: Cash or UPI categorization

**Enum Values**:
- `cash`: Physical currency
- `upi`: Digital payment (UPI/QR/NEFT/IMPS)

**No separate table needed** - use ENUM in transactions

---

### 2.6 Category

**Purpose**: Transaction categorization for reporting

**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | ✅ | Auto |
| `code` | VARCHAR(50) | ✅ | Unique (e.g., "medicine_sale") |
| `name` | VARCHAR(100) | ✅ | Display (e.g., "Medicine Sale") |
| `type` | ENUM | ✅ | `income` or `expense` |
| `is_active` | BOOLEAN | ✅ | Default: true |

**Seeded Categories**:

**Income**:
- `consultation` - Consultation Fees
- `medicine_sale` - Medicine Sale
- `lab_test` - Lab Test Fees
- `other_income` - Other Income

**Expense**:
- `medicine_purchase` - Medicine Purchase
- `staff_salary` - Staff Salary
- `clinic_expenses` - Clinic Expenses
- `transport` - Transport
- `rent` - Rent
- `utilities` - Electricity/Water
- `miscellaneous` - Miscellaneous

**Who Can Create**: Super Admin  
**Who Can Edit**: Super Admin  
**When Immutable**: Never (but disable via `is_active`)

---

### 2.7 Opening Balance

**Purpose**: Day start cash/UPI balance

**Logic**: Auto-filled from previous day's closing balance  
**Editable**: Only if previous day missing OR if override by Manager with reason  
**Validation**: Must be >= 0

---

### 2.8 Closing Balance

**Purpose**: Day end calculated balance

**Formula**:
```
closing_cash = opening_cash + cash_income - cash_expense
closing_upi = opening_upi + upi_income - upi_expense
```

**Not Editable**: Fully calculated field  
**Display**: Shown in real-time as user enters transactions

---

### 2.9 Audit Log

**Purpose**: Immutable record of all system actions

**Fields**:
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `id` | UUID | ✅ | Auto |
| `user_id` | UUID | ✅ | Who performed action |
| `action` | VARCHAR(100) | ✅ | Action type (see below) |
| `entity_type` | VARCHAR(50) | ✅ | Table name |
| `entity_id` | UUID | ❌ | Record ID |
| `before_value` | JSONB | ❌ | Old value snapshot |
| `after_value` | JSONB | ❌ | New value snapshot |
| `reason` | TEXT | ❌ | Required for sensitive actions |
| `ip_address` | INET | ✅ | User IP |
| `user_agent` | TEXT | ✅ | Browser info |
| `created_at` | TIMESTAMP | ✅ | Auto |

**Action Types**:
- `user.created`, `user.updated`, `user.deactivated`
- `store.created`, `store.updated`, `store.deactivated`
- `daily_record.created`, `daily_record.submitted`, `daily_record.locked`, `daily_record.unlocked`
- `transaction.created`, `transaction.updated`, `transaction.deleted`
- `system.override` (Super Admin actions)

**Who Can Create**: System (automatic)  
**Who Can Edit**: No one (immutable)  
**Who Can View**: Super Admin, HO Accountant (read-only), CA/Auditor

---

## 3️⃣ DAILY WORKFLOW

### Store Level (7 AM - 1:59 AM)

**7:00 AM - Day Start**
1. Manager logs in
2. System checks for today's `daily_record`:
   - If NOT exists → create with status = `draft`
   - If exists → load existing
3. Auto-fill opening balances:
   - Query previous day's closing balances
   - If previous day missing → prompt Manager to enter manually
   - If previous day unlocked → show warning
4. Manager verifies opening balances match physical count
5. Store opens

**Throughout Day (7 AM - 1:59 AM)**
1. Store User logs in on mobile/desktop
2. Enters transaction as it occurs:
   - Select type (Income/Expense)
   - Select category
   - Select payment mode
   - Enter amount
   - Add description (optional)
   - Click "Save"
3. System validates and saves
4. Live totals update automatically
5. Manager can view all transactions

**11:00 PM - Pre-Close Review**
1. Manager reviews transaction list
2. Checks for errors (duplicates, wrong amounts)
3. Edits/deletes if needed (with reason)
4. Physical cash/UPI count

**1:00 AM - Final Review**
1. Manager clicks "Review Day"
2. System shows summary:
   - Opening balances
   - Total income (cash, UPI)
   - Total expense (cash, UPI)
   - Closing balances
   - Transaction count
   - Category breakdown
3. Manager verifies closing balances match physical count
4. If mismatch → investigate and fix

### System Rules
- Minimum transactions per day: 1
- Opening balance validation: Warning if ≠ previous closing
- Large transaction threshold: ₹10,000 (configurable)
- Working hours: 7 AM - 1:59 AM (19 hours)
- Submission deadline: 1:59 AM daily (hard cutoff)
- Locking window: 2 AM - 6:59 AM IST (HO Accountant only)
- Past data edits: Super Admin only (with audit trail)
- System downtime: 2 AM - 6:59 AM for store operations (locking period)
**1:30 AM - Submit**
1. Manager clicks "Submit Day"
2. System validation:
   - At least 1 transaction exists ✅
   - Opening balance = prev closing (warning if not) ⚠️
   - All transactions have category ✅
   - No negative amounts ✅
3. Confirmation dialog: "By submitting, you declare this day is accurate. Proceed?"
4. Manager confirms
5. System:
   - Sets `status = submitted`
   - Sets `submitted_at = NOW()`
   - Sets `submitted_by = current_user_id`
   - Locks form (no edits)
   - Triggers notification to HO Accountant

**1:59 AM - Day Auto-Closes**
- Late submissions flagged (after 1:30 AM)
- Critical alert if not submitted by 1:59 AM
- System locks day entry at 2:00 AM sharp
- Auto-reminder sent to Manager at 1:00 AM if not submitted

---

### HO Level (2 AM - 6:59 AM IST - Locking Window)

**2:00 AM - Review Queue Opens**
1. HO Accountant logs in
2. Dashboard shows:
   - Pending verifications (submitted, not locked)
   - Locked today
   - Flagged entries
   - Late submissions
3. Sorts by store/date

**2:15 AM - Verify Each Store**
For each submitted day:
1. Open day details
2. Check opening balance = previous closing
   - If mismatch → flag with comment
3. Review total income/expense ranges
   - Compare with historical avg
   - Flag outliers (e.g., 50% above avg)
4. Check transaction count
   - Too few? Flag
   - Too many? Review
5. Review category split
   - Income mostly medicine? ✅
   - Unusual categories? Flag
6. Review payment mode split
   - 80% cash typical? Check pattern
7. Compare with Google Sheet (if synced)
   - Verify totals match

**If Issues Found**:
1. Click "Flag for Manager"
2. Add comment (e.g., "Opening balance doesn't match. Previous day was ₹5000, you entered ₹4500.")
3. System:
   - Sends notification to Manager
   - Moves to "Flagged" queue
   - Manager must respond/fix

**If All Good**:
1. Click "Lock Day"
2. Confirmation: "Locking makes this day immutable. Proceed?"
3. HO confirms
4. System:
   - Sets `status = locked`
   - Sets `locked_at = NOW()`
   - Sets `locked_by = current_user_id`
   - Triggers sync to Google Sheets

**4:00 AM - Mid-window Check**
- Review newly submitted days
- Lock verified days
- Follow up on flagged entries

**6:30 AM - End of Locking Window**
- Lock all verified days (must complete before 6:59 AM)
- Send daily summary email to management
- Unresolved flags → escalate to Super Admin
- System auto-closes locking functions at 7:00 AM

---

### After Lock

**Data becomes**:
- ✅ Immutable (no edits)
- ✅ Reportable (included in monthly summaries)
- ✅ Syncable (Google Sheets sync triggered)

**Sheet Sync Triggered**:
- Background job picks up `status = locked AND synced_to_sheet = false`
- Writes to Google Sheet
- Marks `synced_to_sheet = true`

---

## 4️⃣ GOOGLE DRIVE / SHEETS INTEGRATION

### Folder Structure (Inferred from Reference)

**Root Folder**: `Sahakar Accounts`  
**URL**: https://drive.google.com/drive/folders/1rVL2Vz_BGUvD8HCcNxOs1hBFZPEK_kwn

**Structure**:
```
/Sahakar Accounts/
├── MELATTUR/
│   ├── 2024/
│   │   ├── November.xlsx
│   │   ├── December.xlsx
│   ├── 2025/
│   │   ├── January.xlsx
│   │   ├── February.xlsx
├── PERINTHALMANNA/
│   ├── 2024/
│   │   ├── November.xlsx
│   ├── 2025/
│   │   ├── January.xlsx
├── MANJERI/
...
└── [140 store folders]
```

**Naming Conventions**:
- **Store Folder**: Uppercase store code (e.g., `MELATTUR`)
- **Year Folder**: `YYYY` (e.g., `2024`)
- **Month File**: `MonthName.xlsx` (e.g., `November.xlsx`)

---

### Sheet Structure (Per Month File)

**Tabs**:
1. **TEMPLATE** (hidden) - Used for creating new daily sheets
2. **01** - Day 1
3. **02** - Day 2
4. ...
5. **31** - Day 31
6. **Summary** - Monthly aggregation
7. **Meta** - Sync metadata (last sync time, record IDs)

**Daily Sheet Format** (e.g., Tab "15" for Nov 15):

| A | B | C | D | E | F |
|---|---|---|---|---|---|
| **Date** | 15/11/2024 | | **Store** | MELATTUR | |
| | | | | | |
| **Opening Balances** | | | | | |
| Cash | ₹5,000.00 | | UPI | ₹2,000.00 | |
| | | | | | |
| **Transactions** | | | | | |
| **#** | **Type** | **Category** | **Mode** | **Amount** | **Description** |
| 1 | Income | Medicine Sale | Cash | ₹500.00 | Paracetamol |
| 2 | Income | Consultation | Cash | ₹200.00 | Dr. Sharma |
| 3 | Expense | Medicine Purchase | Cash | ₹1,000.00 | Supplier payment |
| ... | | | | | |
| | | | | | |
| **Summary** | | | | | |
| Total Income (Cash) | ₹3,500.00 | | Total Expense (Cash) | ₹1,200.00 | |
| Total Income (UPI) | ₹1,000.00 | | Total Expense (UPI) | ₹500.00 | |
| **Closing Cash** | ₹7,300.00 | | **Closing UPI** | ₹2,500.00 | |

**Summary Tab**:

| A | B | C | D | E |
|---|---|---|---|---|
| **November 2024 Summary** | | | | |
| | | | | |
| **Date** | **Total Income** | **Total Expense** | **Net** | **Status** |
| 01/11/2024 | ₹5,000 | ₹3,000 | ₹2,000 | ✓ Locked |
| 02/11/2024 | ₹6,000 | ₹4,000 | ₹2,000 | ✓ Locked |
| ... | | | | |
| 30/11/2024 | ₹5,500 | ₹3,500 | ₹2,000 | ⏳ Pending |
| | | | | |
| **TOTAL** | **₹1,50,000** | **₹90,000** | **₹60,000** | |

---

### Sync Strategy

#### When to Sync
- **Trigger**: `status = locked AND synced_to_sheet = false`
- **Frequency**: Every 15 minutes (Vercel Cron Job)
- **Batch Size**: Up to 20 records per run (respect API limits)

#### Sync Process (Step-by-Step)

**Step 1: Query Records**
```sql
SELECT * FROM daily_records
WHERE status = 'locked'
  AND synced_to_sheet = false
ORDER BY date ASC
LIMIT 20;
```

**Step 2: For Each Record**
1. Determine file path:
   ```
   folder = `/Sahakar Accounts/${store.code}/${year}/`
   file = `${monthName}.xlsx`
   Example: /Sahakar Accounts/MELATTUR/2024/November.xlsx
   ```

2. Check if file exists:
   - If NO → Create from TEMPLATE
   - If YES → Open file

3. Check if daily tab exists (e.g., tab "15"):
   - If NO → Duplicate TEMPLATE → rename to day
   - If YES → Open tab

4. Fetch transactions for this day:
   ```sql
   SELECT * FROM transactions
   WHERE daily_record_id = '{record_id}'
   ORDER BY created_at ASC;
   ```

5. Write data to sheet:
   - **A2**: Date (formatted: `DD/MM/YYYY`)
   - **E2**: Store code
   - **B4**: Opening cash
   - **E4**: Opening UPI
   - **Rows 8+**: Transactions (one per row)
     - Col A: Row number
     - Col B: Type
     - Col C: Category
     - Col D: Payment mode
     - Col E: Amount (formatted: ₹)
     - Col F: Description
   - **Summary section** (calculated in sheet):
     - Formulas: `=SUMIFS(E:E, B:B, "Income", D:D, "Cash")`

6. Update Summary tab:
   - Find row for this date
   - Update: Income, Expense, Net, Status = "✓ Locked"

7. Update Meta tab:
   - Last sync time
   - Record ID
   - Transaction count

8. Mark synced:
   ```sql
   UPDATE daily_records
   SET synced_to_sheet = true,
       last_synced_at = NOW()
   WHERE id = '{record_id}';
   ```

**Step 3: Error Handling**
- If API rate limit → pause, retry in next cron run
- If quota exceeded → log error, alert Super Admin
- If sheet not found → log error, skip, alert Super Admin
- If write fails → retry up to 3 times with exponential backoff
- If still fails → mark as `sync_failed`, alert Super Admin

---

### What NEVER Syncs

- ❌ Draft days (only locked days sync)
- ❌ Audit logs
- ❌ User details
- ❌ Internal flags/comments
- ❌ Deleted transactions

---

### Read-Only Enforcement

**Sheet Protection**:
1. After sync, set sheet permissions:
   - HO Accountant: Viewer
   - Super Admin: Editor (for emergencies)
   - Others: No access
2. Add header warning: "⚠️ READ-ONLY. DO NOT EDIT. Source: Sahakar Accounts App"

**Change Detection**:
- Periodically check sheet last modified timestamp
- If manual edit detected → alert Super Admin

---

## 5️⃣ AUDIT & COMPLIANCE REQUIREMENTS

### Immutable Locked Data
- Once `status = locked`, record becomes immutable
- Only Super Admin can override (with mandatory reason + audit log)
- All override attempts logged even if denied

### Full Audit Log
**What is Logged**:
- User login/logout
- Transaction create/edit/delete
- Daily record submit/lock/unlock
- User create/edit/deactivate
- Store create/edit/deactivate
- Category changes
- Super Admin overrides
- Export actions
- Failed login attempts

**For Each Log**:
- ✅ Who (user_id, email, name)
- ✅ What (action type)
- ✅ When (timestamp)
- ✅ Before (old value snapshot)
- ✅ After (new value snapshot)
- ✅ Why (reason, if required)
- ✅ Where (IP address)
- ✅ How (user agent)

**Log Retention**: 7 years (compliance requirement)

### Override Logging
**Sensitive Actions Requiring Reason**:
- Unlock locked day
- Delete transaction
- Deactivate user
- Super Admin manual edit
- Export > 1 year data

**Reason Requirements**:
- Minimum 20 characters
- Must be descriptive
- Cannot be generic (e.g., "mistake" rejected)

**Notification**:
- Override actions trigger email to HO Accountant + Management
- Email includes: Who, What, When, Why

### Auditor Access Control
**Time-Bound Access**:
- Super Admin grants access for specific duration (e.g., 7 days)
- Auto-expire after duration
- Can be revoked early
- All access periods logged

**Access Scope**:
- Locked data only
- Specific date range (optional)
- Specific stores (optional)
- Read-only always

### Export Watermarking
**All Exports Include**:
- Header: "Sahakar Accounts System - Confidential"
- Footer: "Exported by: {user_name} ({role}) on {timestamp}"
- If Auditor: "AUDITOR COPY - for {purpose}"
- Filename: `SahakarAccounts_{store}_{daterange}_{timestamp}.xlsx`

**Export Audit**:
- Who exported
- What data (date range, stores)
- When
- File hash (for tampering detection)

---

## 6️⃣ EDGE CASES

### 6.1 Missed Day

**Scenario**: Store forgot to enter Nov 10, now it's Nov 12

**Solution**:
1. Manager can create day for Nov 10 (past date allowed)
2. System checks if Nov 9 is locked:
   - If YES → auto-fill opening balance from Nov 9 closing
   - If NO → show warning: "⚠️ Previous day not locked. Verify opening balance manually."
3. Manager enters Nov 10 data
4. System shows warning before submit: "⚠️ You're submitting Nov 10, but Nov 11 is already submitted. Verify opening balance for Nov 11."
5. After Nov 10 locked → Manager must verify Nov 11 opening balance matches Nov 10 closing
   - If mismatch → unlock Nov 11, fix opening balance, resubmit

**Prevention**:
- Daily reminder email at 7 PM if today not submitted
- Dashboard shows "Missing Days" alert

---

### 6.2 Wrong Opening Balance

**Scenario**: Manager entered ₹5000 opening cash, actual was ₹4500

**If Day Not Submitted**:
1. Manager clicks "Edit Opening Balance"
2. Enters correct amount
3. System recalculates closing balance
4. Save

**If Day Submitted (Not Locked)**:
1. Manager cannot edit
2. Manager clicks "Request Unlock"
3. HO Accountant receives notification
4. HO unlocks day (with reason: "Wrong opening balance")
5. Day status → `draft`
6. Manager corrects opening balance
7. Manager resubmits

**If Day Locked**:
1. Manager contacts HO Accountant
2. HO Accountant unlocks (within 48 hours, with reason)
3. Day status → `submitted`
4. Manager edits
5. Manager resubmits
6. HO re-locks

**If 48 Hours Passed**:
1. HO Accountant cannot unlock
2. Only Super Admin can override
3. Super Admin unlocks (with detailed reason)
4. Email sent to management
5. Follow steps above

---

### 6.3 Internet Down at Store

**Offline Support**:
- PWA (Progressive Web App) with offline capability
- Draft transactions saved in browser IndexedDB
- When internet returns → auto-sync to server
- Show sync status indicator (green = synced, yellow = pending)

**Fallback**:
- If offline > 24 hours → use Excel template (emergency)
- When internet restored → manual entry into app
- Flag day as "Manually Migrated" in audit log

---

### 6.4 Duplicate Entries

**Detection**:
- System checks for duplicate transactions:
  - Same amount + category + mode + time < 1 minute apart
  - Show warning: "⚠️ Possible duplicate. Recent entry: ₹500 Medicine Sale Cash at 10:15 AM"
- User can confirm "Not duplicate" or delete

**Prevention**:
- After "Save" → disable button for 2 seconds
- Show success toast
- Clear form after save

---

### 6.5 Negative Balances

**Scenario**: Closing cash = -₹500 (more expenses than opening + income)

**Handling**:
- System allows negative closing balance (real-world scenario: shortfall)
- Show warning: "⚠️ Negative closing balance. Physical count should match."
- Manager must add comment explaining shortfall
- HO Accountant flags for investigation

**Reconciliation**:
- If actual closing is ₹0, shortfall = ₹500
- Add transaction: Expense > Miscellaneous > Cash > ₹500 > "Cash shortfall - investigation pending"

---

### 6.6 Manager on Leave

**Solution**:
1. Super Admin temporarily assigns another Manager to store
2. OR Super Admin grants "Temporary Manager" role to Store User
3. Temporary manager can submit days
4. All actions logged with "Acting Manager" flag

**Best Practice**:
- Manager trains backup user
- Backup user has Store User role normally
- Elevated only when needed

---

### 6.7 HO Delay in Locking

**Scenario**: HO Accountant sick, 100 days pending lock

**SLA (Service Level Agreement)**:
- HO must lock days within 24 hours of submission
- If 24 hours passed → system sends escalation email to Super Admin
- If 48 hours passed → system allows backup HO Accountant to lock

**Backup HO Accountant**:
- Super Admin can assign secondary HO Accountant role
- Both can lock days
- Avoid conflicts: system shows "Locked by {name}" immediately

---

### 6.8 Auditor Mid-Month Access

**Scenario**: CA needs data from Nov 1-15, but Nov 16-30 still draft

**Solution**:
1. Super Admin grants Auditor access with date range filter:
   - Start: Nov 1
   - End: Nov 15
2. Auditor sees only Nov 1-15 (locked days)
3. Nov 16-30 (draft/submitted) hidden
4. After Nov 30 locked → Super Admin extends date range

**Automated**:
- Auditor requests access via form
- Super Admin approves/rejects
- System enforces date range filter

---

### 6.9 User Resignation

**Process**:
1. Super Admin deactivates user account (`is_active = false`)
2. User cannot login
3. All historical data retained (audit requirement)
4. User's name remains in audit logs
5. Reassign store access to new user

**Data Ownership**:
- Transactions remain tagged with original creator
- Show as "Created by: {Name} (Resigned)"

---

### 6.10 Store Closure

**Process**:
1. Super Admin sets `store.is_active = false`
2. Store hidden from active lists
3. All historical data retained
4. Google Sheets folder archived (rename: "MELATTUR_CLOSED_2024")
5. Users deactivated or reassigned to other stores

**Reopening**:
- Super Admin sets `is_active = true`
- All data restored

---

## 7️⃣ PHASED IMPLEMENTATION PLAN

### Phase 1: Core System (Weeks 1-3)

**What is Built**:
- ✅ Database schema (all tables + RLS policies)
- ✅ Authentication (Supabase Auth)
- ✅ User management (CRUD, role assignment)
- ✅ Store management (CRUD)
- ✅ Daily entry form (transaction CRUD)
- ✅ Opening/closing balance calculation
- ✅ Submit day functionality
- ✅ Basic dashboard (role-based)

**What is NOT Built**:
- ❌ Google Sheets sync
- ❌ Reports/exports
- ❌ Lock/unlock by HO
- ❌ Audit logs
- ❌ Monthly summaries

**Entry Criteria**:
- Supabase project created
- Development environment set up
- Tech stack approved

**Exit Criteria**:
- Manager can create daily record
- Store User can add transactions
- Manager can submit day
- All 5 roles can login
- Basic permissions work (Manager sees only assigned store)

**Validation**:
1. Create 3 stores: MELATTUR, MANJERI, TEST
2. Create 5 users (one per role)
3. Manager adds 10 transactions for today
4. Verify totals calculate correctly
5. Submit day → verify status changes

---

### Phase 2: Pilot Store (Weeks 3-4)

**What is Built**:
- ✅ HO Accountant lock/unlock functionality
- ✅ Day status workflow (draft → submitted → locked)
- ✅ Opening balance auto-fill from previous day
- ✅ Basic validation (amount > 0, category exists)
- ✅ Mobile-responsive UI
- ✅ Audit logs (basic)

**What is NOT Built**:
- ❌ Google Sheets sync
- ❌ Reports/exports
- ❌ Monthly summaries
- ❌ Advanced validation

**Entry Criteria**:
- Phase 1 complete
- 1 pilot store selected (e.g., MELATTUR)
- Pilot users trained

**Exit Criteria**:
- Pilot store uses system for 1 week
- All days submitted and locked
- Zero data discrepancies
- User feedback collected

**Validation**:
1. Pilot store enters data for 7 days
2. HO Accountant locks each day
3. Compare manual Excel totals with app totals → 100% match
4. Collect feedback: ease of use, bugs, missing features

---

### Phase 3: Google Sheets Sync (Weeks 4-5)

**What is Built**:
- ✅ Google Sheets API integration
- ✅ Sync engine (background job)
- ✅ File/folder structure creation
- ✅ Template sheet duplication
- ✅ Transaction batch write
- ✅ Summary tab update
- ✅ Sync status tracking
- ✅ Error handling + retry logic
- ✅ Vercel Cron Job setup

**What is NOT Built**:
- ❌ Advanced reports
- ❌ Excel/PDF export
- ❌ Monthly summaries (in app)

**Entry Criteria**:
- Phase 2 complete
- Google Cloud project created
- Service account credentials obtained
- Drive folder structure created

**Exit Criteria**:
- Locked days auto-sync to Sheets within 15 minutes
- Sheets are read-only
- Totals match 100%
- HO Accountant can view Sheets

**Validation**:
1. Lock 5 days across 3 stores
2. Wait 15 minutes
3. Check Google Sheets → verify all 5 days synced
4. Compare totals → 100% match
5. Attempt manual edit in Sheets → blocked (read-only)

---

### Phase 4: Reports & Exports (Weeks 5-6)

**What is Built**:
- ✅ Monthly summary aggregation (in app)
- ✅ Monthly summary table
- ✅ Date range reports
- ✅ Category-wise reports
- ✅ Excel export (with watermark)
- ✅ PDF export (with watermark)
- ✅ Dashboard charts (income vs expense)
- ✅ Export audit logging

**What is NOT Built**:
- ❌ Advanced analytics
- ❌ Predictive reports

**Entry Criteria**:
- Phase 3 complete
- At least 1 month of data

**Exit Criteria**:
- Users can export reports
- Monthly summary auto-generates
- Charts render correctly

**Validation**:
1. Generate monthly report for November
2. Export to Excel → verify watermark
3. Export to PDF → verify watermark
4. Check audit log → export action logged

---

### Phase 5: Scale to 140+ Stores (Weeks 7-12)

**What is Built**:
- ✅ Performance optimization
- ✅ Database indexing
- ✅ Batch operations
- ✅ Parallel sync (multiple stores)
- ✅ Monitoring dashboard
- ✅ Error alerting
- ✅ User training materials
- ✅ Onboarding workflow

**What is NOT Built**:
- ❌ Advanced features (inventory, invoicing)

**Entry Criteria**:
- Phases 1-4 complete
- Pilot successful (>90% user satisfaction)
- All 140 stores ready

**Exit Criteria**:
- All 140 stores onboarded
- Daily active usage > 90%
- Zero critical bugs
- Sync success rate > 99%

**Rollout Strategy**:
1. **Week 7**: 10 stores
2. **Week 8**: 20 stores
3. **Week 9**: 30 stores
4. **Week 10**: 40 stores
5. **Week 11**: 30 stores
6. **Week 12**: 10 stores (remaining)

**Validation**:
1. Monitor daily active users
2. Track sync success rate
3. Collect feedback weekly
4. Fix bugs within 48 hours

---

## 8️⃣ NON-FUNCTIONAL REQUIREMENTS

### Security

**Authentication**:
- ✅ Email + password (Supabase Auth)
- ✅ 2FA for Super Admin (TOTP)
- ✅ Password policy: min 12 chars, uppercase, number, symbol
- ✅ Session expiry: 24 hours
- ✅ Auto-logout after 30 min inactivity

**Authorization**:
- ✅ Row-Level Security (RLS) on all tables
- ✅ Role-based permissions enforced in DB + API
- ✅ No client-side permission checks (server-only)

**Data Protection**:
- ✅ HTTPS only (enforce in production)
- ✅ Encrypted at rest (Supabase default)
- ✅ Encrypted in transit (TLS 1.3)
- ✅ No sensitive data in logs
- ✅ Input sanitization (Zod validation)
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (React auto-escaping + CSP headers)

**Compliance**:
- ✅ Audit logs retained for 7 years
- ✅ GDPR-compliant (user data deletion on request)
- ✅ No PII in Google Sheets (only aggregated data)

---

### Performance

**Page Load**:
- ✅ < 2 seconds (desktop)
- ✅ < 3 seconds (mobile)

**API Response**:
- ✅ < 500ms (95th percentile)
- ✅ < 1s (99th percentile)

**Database**:
- ✅ Indexed columns for frequent queries
- ✅ Connection pooling (Supabase manages)
- ✅ Query optimization (use EXPLAIN ANALYZE)

**Google Sheets Sync**:
- ✅ Batch writes (20 records per API call)
- ✅ Parallel processing (5 stores concurrently)
- ✅ Rate limiting (respect 100 writes/min quota)

**Scalability**:
- ✅ Support 140 stores × 30 days × 50 transactions = 210,000 txns/month
- ✅ Horizontal scaling (Vercel auto-scale)
- ✅ Database partitioning (by month) if > 1M records

---

### Backup & Recovery

**Database Backup**:
- ✅ Daily automated backups (Supabase)
- ✅ Retention: 30 days
- ✅ Point-in-time recovery

**Google Sheets Backup**:
- ✅ Weekly export to ZIP archive
- ✅ Store in separate Drive folder
- ✅ Retention: 1 year

**Disaster Recovery**:
- ✅ RTO (Recovery Time Objective): < 4 hours
- ✅ RPO (Recovery Point Objective): < 24 hours
- ✅ Super Admin can manually export all data

---

### Training Requirements

**User Roles**:

**Super Admin** (2 hours):
- System overview
- User management
- Store setup
- Emergency procedures
- Audit log review

**HO Accountant** (1.5 hours):
- Daily workflow
- Verification process
- Lock/unlock days
- Report generation
- Google Sheets access

**Store Manager** (1 hour):
- Daily entry workflow
- Transaction entry
- Day submission
- Troubleshooting

**Store User** (30 mins):
- Quick entry form
- Mobile app usage
- Common errors

**Training Materials**:
- ✅ Video tutorials (5-10 mins each)
- ✅ PDF user guides
- ✅ In-app tooltips
- ✅ FAQ section
- ✅ Live training sessions (webinar)

---

### Change Management

**Communication Plan**:
1. **Week -4**: Announce system to all stores
2. **Week -2**: Share training materials
3. **Week -1**: Live demos
4. **Week 0**: Pilot launch
5. **Week 1-12**: Gradual rollout with weekly updates

**Support During Rollout**:
- ✅ Dedicated support email
- ✅ WhatsApp group for urgent issues
- ✅ Daily check-ins with new stores (first week)
- ✅ Weekly feedback surveys

**Feedback Loop**:
- ✅ Collect feedback via in-app form
- ✅ Weekly review meeting
- ✅ Prioritize bug fixes > feature requests
- ✅ Monthly changelog email

---

### Human Misuse Prevention

**Duplicate Entry Prevention**:
- Warn if same amount + category + mode within 1 minute
- Show last 5 entries before save

**Accidental Delete Prevention**:
- Confirmation dialog: "Delete transaction ₹500 Medicine Sale? This cannot be undone."
- Soft delete with reason required

**Submit Too Early**:
- Warn if < 5 transactions for the day
- Confirm: "Only 3 transactions today. Is this correct?"

**Opening Balance Mismatch**:
- Auto-warn if opening ≠ previous closing
- Show: "⚠️ Expected: ₹5,000. You entered: ₹4,500. Verify physical count."

**Unusual Transaction Amount**:
- Warn if amount > ₹10,000 (configurable)
- Confirm: "Large amount: ₹15,000. Proceed?"

**Rapid Edits**:
- If 10+ edits in 5 minutes → show: "⚠️ Multiple edits detected. Take a break?"
- Flag for Manager review

**Role Abuse**:
- Monitor failed permission attempts
- Alert Super Admin if 3+ unauthorized access attempts

---

## 9️⃣ APPENDIX

### A. Database Indexes

```sql
-- Daily Records
CREATE INDEX idx_daily_records_store_date ON daily_records(store_id, date);
CREATE INDEX idx_daily_records_status ON daily_records(status);
CREATE INDEX idx_daily_records_sync ON daily_records(synced_to_sheet, status);

-- Transactions
CREATE INDEX idx_transactions_daily_record ON transactions(daily_record_id);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_created_by ON transactions(created_by);

-- Audit Logs
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
```

---

### B. API Endpoints

**Authentication**:
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/reset-password`

**Users**:
- `GET /api/users` (list, Super Admin only)
- `POST /api/users` (create, Super Admin only)
- `PUT /api/users/:id` (update, Super Admin only)
- `DELETE /api/users/:id` (deactivate, Super Admin only)

**Stores**:
- `GET /api/stores` (list, filtered by access)
- `POST /api/stores` (create, Super Admin only)
- `PUT /api/stores/:id` (update, Super Admin only)

**Daily Records**:
- `GET /api/daily-records` (list, filtered by store access)
- `GET /api/daily-records/:id` (details)
- `POST /api/daily-records` (create, Manager)
- `PUT /api/daily-records/:id/submit` (submit, Manager)
- `PUT /api/daily-records/:id/lock` (lock, HO Accountant)
- `PUT /api/daily-records/:id/unlock` (unlock, HO Accountant)

**Transactions**:
- `GET /api/transactions?daily_record_id=xxx`
- `POST /api/transactions` (create, Manager/User)
- `PUT /api/transactions/:id` (edit, creator only)
- `DELETE /api/transactions/:id` (delete, creator only)

**Reports**:
- `GET /api/reports/monthly?store_id=xxx&month=2024-11`
- `GET /api/reports/export?format=excel&start=xxx&end=xxx`

**Sync**:
- `POST /api/sync/trigger` (manual trigger, Super Admin)
- `GET /api/sync/status` (sync health, Super Admin)

---

### C. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Google Sheets
GOOGLE_SHEETS_CLIENT_EMAIL=xxx@xxx.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nxxx\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1rVL2Vz_BGUvD8HCcNxOs1hBFZPEK_kwn

# App
NEXT_PUBLIC_APP_URL=https://sahakar-accounts.vercel.app
CRON_SECRET=xxx_secure_random_string_xxx

# Monitoring (optional)
SENTRY_DSN=xxx
VERCEL_ANALYTICS_ID=xxx
```

---

### D. Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14 | React framework (App Router) |
| UI Components | shadcn/ui | Reusable components |
| Styling | TailwindCSS | Utility-first CSS |
| State Management | React Query + Zustand | Server state + client state |
| Forms | React Hook Form | Form handling |
| Validation | Zod | Schema validation |
| Backend | Next.js API Routes | Serverless API |
| Database | Supabase (Postgres) | Primary data store |
| Auth | Supabase Auth | User authentication |
| ORM | Drizzle ORM | Type-safe DB queries |
| Sync | Google Sheets API | Read-only reporting |
| Cron Jobs | Vercel Cron | Scheduled sync |
| Hosting | Vercel | Edge deployment |
| Monitoring | Sentry + Vercel Analytics | Error tracking + performance |

---

## END OF DOCUMENT

**Document Version**: 1.0  
**Last Updated**: 2024-12-22  
**Prepared By**: Senior Systems Architect  
**Approved By**: [Pending]  

**Next Actions**:
1. Review this blueprint
2. Approve or request changes
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews

---
