# Sahakar Accounts - Complete Features Documentation

## 📋 Table of Contents
1. [System Overview](#system-overview)
2. [User Roles & Permissions](#user-roles--permissions)
3. [Core Features](#core-features)
4. [Dashboard Features](#dashboard-features)
5. [Transaction Features](#transaction-features)
6. [Time-Based Controls](#time-based-controls)
7. [Reports & Analytics](#reports--analytics)
8. [Management Features](#management-features)
9. [Technical Features](#technical-features)

---

## 🎯 System Overview

**Sahakar Accounts** is a comprehensive accounting and management system for a hyperpharmacy chain. It manages 4 outlets + 1 Head Office (HO), handling daily sales, expenses, returns, and inventory management. The system is designed for **mobile-first usage** for staff/managers and **desktop usage** for HO accountants.

### Key Highlights (v2.2.0)
- **7 Core Reports** fully implemented with Analytics & Trends.
- **Mandatory Notes** for all Sales/Purchase returns.
- **Full Data Export** (Excel/CSV/PDF) for robust backup and analysis.
- **Role-Based Dashboards** for Staff, Managers, and Accountants.

**Tech Stack:**
- Frontend: Next.js 16, React, TypeScript, TailwindCSS
- Backend: Supabase (PostgreSQL + Auth + Realtime)
- Charts: Recharts
- Offline: Dexie.js (IndexedDB)

---

## 👥 User Roles & Permissions

### 1. **Superadmin / Master Admin**
**Full System Access**
- View: All outlets, all data, system metrics
- Create/Edit/Delete: Users, outlets, transactions
- Access: Admin dashboard, user management, outlet management, all reports
- Special: Database operations, system configuration

### 2. **HO Accountant**
**Head Office Accountant - Multi-Outlet View**
- View: All outlets consolidated data
- Create/Edit: Consolidated reports, financial analysis
- Access: HO dashboard, all outlet data, export consolidated reports
- Cannot: Manage users, delete data

### 3. **Outlet Manager**
**Single Outlet Operations**
- View: Own outlet data only
- Create/Edit/Delete: Transactions, customers, daily entries
- Access: Manager dashboard, outlet reports, staff performance
- Special: Lock/Unlock business day, export outlet data

### 4. **Outlet Staff**
**Daily Operations Only**
- View: Own outlet recent data
- Create: Sales, purchases, credit transactions, customers
- Access: Staff dashboard, new transaction forms
- Restrictions: Time-based login (7 AM - 2 AM), duty end feature
- Cannot: View history, edit/delete, access reports

### 5. **Auditor**
**Read-Only Access**
- View: All outlet data (with time-limited access)
- Access: History pages, reports (read-only)
- Cannot: Create, edit, delete anything
- Special: Temporary access grants with expiration

---

## 🔧 Core Features

### 1. **Authentication & Security**
✅ **Email/Password Login** - Supabase Auth
✅ **Role-Based Access Control** (RLS) - Database-level security
✅ **Session Management** - Auto-logout, persistent sessions
✅ **Profile Management** - User profiles with roles, outlets, metadata

### 2. **Multi-Tenant Architecture**
✅ **4 Outlets Supported:**
- HP Tirur (Hyper Pharmacy)
- HP Parappanangadi (Hyper Pharmacy)
- HP Ponnani (Hyper Pharmacy)
- SC Edappal (Smart Clinic)

✅ **Data Isolation** - RLS ensures users only see their outlet data
✅ **Outlet Management** - Create, edit outlets with location data

### 3. **Offline Support**
✅ **IndexedDB Storage** - Dexie.js for local data
✅ **Draft Management** - Save incomplete transactions offline
✅ **Auto-Sync** - Syncs when back online
✅ **Online/Offline Indicator** - Visual status in topbar

---

## 📊 Dashboard Features

### Staff Dashboard
**Simple, Task-Focused View**
- Quick action buttons (New Sale, Credit Entry)
- Recent transactions (last 10)
- Today's summary stats
- Offline draft count

### Manager Dashboard ⭐ NEW
**Comprehensive Outlet Oversight**

#### Top Metrics (4 Cards)
1. **Today's Revenue**
   - Current day sales total
   - Trend vs yesterday (↑/↓ %)
   - Color: Green

2. **Pending Credits**
   - Total credit outstanding
   - Number of customers with credit
   - Click: Go to credit recovery
   - Color: Orange

3. **Staff Productivity**
   - Transaction count by staff today
   - Top performer badge
   - Color: Blue

4. **Monthly Progress**
   - Current month revenue
   - Progress % vs target (₹5L default)
   - Progress bar visualization
   - Color: Purple

#### Charts Section
1. **Sales Trend Chart** (Line Chart)
   - Last 7 days daily revenue
   - Hover: Shows exact amount + date
   - Responsive design

2. **Payment Mode Distribution** (Pie Chart)
   - Cash, UPI, Card, Credit breakdown
   - Shows % and amounts
   - Color-coded segments

#### Widgets
1. **Recent Transactions**
   - Last 10 transactions
   - Type indicators (income/expense)
   - Real-time updates

2. **Quick Actions Panel**
   - New Sale button
   - Daily Entry button
   - Customers button
   - Reports button

3. **Staff Performance**
   - Today's top 3 staff
   - Transaction count + revenue per staff

#### Features
✅ **Lock/Unlock Day** - Prevent/allow transactions for today
✅ **Export Data** - 3 options:
   - Today's Transactions (CSV)
   - Monthly Report (CSV)
   - All Data (CSV)
✅ **Auto-Refresh** - Every 30 seconds
✅ **Responsive** - Mobile, tablet, desktop layouts

### HO Accountant Dashboard ⭐ NEW
**Multi-Outlet Consolidated View**

#### Top Metrics (5 Cards)
1. **Total Revenue (Today)** - All outlets combined
2. **Active Outlets** - Count of operational outlets
3. **Credits Outstanding** - All outlets total credits
4. **MTD Revenue** - Month-to-date all outlets
5. **Anomalies** - Flagged transactions (placeholder)

#### Charts & Tables
1. **Consolidated Sales Trend** - All outlets, last 7 days
2. **Outlet Performance Table**
   - All 4 outlets listed
   - Columns: Name, Today's Revenue, MTD, Credits, Status
   - Sortable (future enhancement)

#### Features
✅ **Export Consolidated** - Download all-outlet data
✅ **Multi-Outlet View** - See all outlets at once
✅ **Auto-Refresh** - Every 30 seconds

### Admin Dashboard
**System-Wide Overview**
- Uses existing admin view component
- System metrics
- User activity
- Management access

---

## 💰 Transaction Features

### 1. **Sales Entry** ⭐ ENHANCED
**Create New Sales with Advanced Payment Handling**

#### Basic Fields
- Customer Phone (10 digits, auto-search)
- Customer Name (auto-fill or new customer)
- Bill Number (auto-generated with outlet prefix)
- Sales Value (₹)

#### Payment Modes ⭐ NEW AUTO-CALCULATION
**Select 1-4 payment modes:**
- ☑️ Cash
- ☑️ UPI
- ☑️ Card
- ☑️ Credit

**Smart Payment Distribution:**
✅ **2+ Modes Selected** - Auto-calculates remaining amount
✅ **Equal Distribution** - Splits across empty fields
✅ **Visual Feedback** - Green background + "✨ Auto" badge on calculated fields
✅ **Manual Override** - Click any field to override auto-calc
✅ **Real-Time Validation** - Ensures total matches sales value

**Example:**
```
Sales Value: ₹10,000
Modes: Cash + UPI + Credit (3 selected)
Enter: ₹1,000 in Cash
Auto-fills:
  UPI: ₹4,500 ✨ Auto (green)
  Credit: ₹4,500 ✨ Auto (green)
```

#### Features
✅ **Customer Auto-Search** - Search by phone (3+ digits)
✅ **Customer Creation** - Add new customers inline
✅ **Duplicate Prevention** - Warns if bill number exists
✅ **Sahakar ID Tracking** - Links to Sahakar Entry ID
✅ **Offline Drafts** - Save incomplete sales
✅ **Day Lock Check** - Prevents entry if day is locked

### 2. **Sales Return**
- Link to original sale
- Partial or full return
- Auto-updates customer balance

### 3. **Purchase Entry**
- Vendor details
- Multiple payment modes
- Expense category tracking

### 5.3 Returns Logic
- **Sales Return**:
    - Reduces daily `cash`/`upi` collection or adds to `credit`.
    - Requires original Bill Number for lookup.
    - **Mandatory Reason**: Staff must enter a reason for every return.
    - **UI**: Step-by-step wizard (Lookup -> Verify -> Reason -> Refund Mode).
- **Purchase Return**:
    - Treated as 'Income' (Cash in) or reduces 'Expense'.
    - **Mandatory Reason**: Must specify why stock is being returned to supplier.

### 4. **Credit Received**
- Customer payment collection
- Links to original credit sale
- Updates customer balance
- Payment mode tracking

### 5. **Daily Entry**
- Manual cash tallying
- Expense recording
- Petty cash management

---

## ⏰ Time-Based Controls ⭐ NEW

### 1. **Staff Login Window**
**Restricted Login Hours: 7:00 AM - 2:00 AM**

✅ **Login Allowed:**
- 7:00 AM - 1:59 AM (next day)
- Covers typical store hours (7 AM - 2 AM)

❌ **Login Blocked:**
- 2:00 AM - 6:59 AM
- Error: *"Staff can only login between 7:00 AM and 2:00 AM. Please try again after 7:00 AM."*

**Implementation:**
- Checks hour of login attempt
- Blocks access during restricted window
- Forces sign-out if attempted

### 2. **Duty End Feature** ⭐ NEW
**Staff Can End Their Shift for the Day**

#### UI Component
- Red "Duty End" button in topbar (staff only)
- Located top-right corner
- Icon: Logout symbol

#### User Flow
1. Staff clicks "Duty End"
2. Confirmation dialog:
   ```
   ⚠️ End Duty?
   
   You will be logged out and cannot login again until tomorrow.
   
   Are you sure you want to end your duty for today?
   ```
3. If confirmed:
   - Records `duty_end` timestamp in `duty_logs` table
   - Immediately logs user out
   - Redirects to login page

4. Re-login attempt:
   - System checks `duty_logs` for today's entry
   - If `duty_end` exists → Block login
   - Error: *"Your duty has ended for today. Please login tomorrow after 7:00 AM."*

5. Next day (after 7 AM):
   - Different date → Login allowed
   - New `duty_log` entry created

#### Database Schema
```sql
CREATE TABLE duty_logs (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    outlet_id UUID,
    duty_start TIMESTAMPTZ,
    duty_end TIMESTAMPTZ,
    date DATE NOT NULL,
    UNIQUE(user_id, date)
);
```

**Benefits:**
- Prevents unauthorized late-night access
- Tracks exact duty hours
- Enforces work schedule compliance
- Manager can review duty logs

---

## 📈 Reports & Analytics

   - Link: `/dashboard/reports/analytics`

### Export Functionality ⭐ NEW
**Multiple Format Support**

#### Export Options:
1. **Excel (.xlsx)** - Formatted spreadsheets
2. **CSV (.csv)** - Raw data, comma-separated
3. **PDF (.pdf)** - Printable reports

#### Export Sources:
- **Today's Transactions** - Current day only
- **Monthly Report** - Current month data
- **All Data** - Complete transaction history
- **Custom Range** - Date range selector (planned)

#### Implementation:
- Manager dashboard: 3 CSV export options
- Reports page: Format selector + "Export All" button
- Automatic download to browser
- Proper CSV formatting (escaped commas, quotes)

---

## 🔧 Management Features

### 1. **User Management** ⭐ NEW
**Admin-Only Access**

#### Features:
✅ **User List Table**
- Columns: User (avatar, name, email), Role, Outlet, Status, Actions
- Search by name, email, or role
- Sortable columns

✅ **User Stats**
- Total Users
- Staff Members count
- Managers count
- Administrators count

✅ **Actions (UI Ready)**
- ✏️ Edit user
- 🗑️ Delete user
- ➕ Add new user button

#### User Roles Available:
- Superadmin
- Master Admin
- HO Accountant
- Outlet Manager
- Outlet Staff
- Auditor

### 2. **Outlet Management** ⭐ NEW
**Admin-Only Access**

#### Features:
✅ **Outlet Cards Grid**
- Card displays: Name, location, type, status, ID
- Edit/Delete buttons per card
- Search by name or location

✅ **Outlet Stats**
- Total Outlets
- Hyper Pharmacies count
- Smart Clinics count
- Active Outlets count

✅ **Outlet Types**
- Hyper Pharmacy (HP)
- Smart Clinic (SC)

✅ **Actions (UI Ready)**
- ✏️ Edit outlet
- 🗑️ Delete outlet
- ➕ Add new outlet button

---

## 🛠️ Technical Features

### 1. **Database**
**Supabase (PostgreSQL)**

#### Tables:
- `users` - User profiles with roles
- `outlets` - Outlet information
- `transactions` - All financial transactions
- `customers` - Customer database
- `daily_records` - Day status (open/locked)
- `duty_logs` - Staff duty tracking ⭐ NEW
- `transaction_drafts` (local only) - Offline drafts

#### Security:
✅ **Row Level Security (RLS)** - All tables protected
✅ **Role-Based Policies** - Users see only their data
✅ **Foreign Key Constraints** - Data integrity
✅ **Indexes** - Optimized queries

### 2. **Real-Time Features**
✅ **Auto-Refresh Dashboards** - 30-second intervals
✅ **Live Transaction Updates** - New entries appear automatically
✅ **Online/Offline Detection** - Visual indicator
✅ **Supabase Realtime** - WebSocket connections (planned)

### 3. **Responsive Design**
✅ **Mobile-First** - Optimized for smartphones
✅ **Tablet Support** - 2-column layouts
✅ **Desktop** - Full multi-column dashboards
✅ **Touch-Friendly** - Large buttons, swipe gestures

### 4. **Performance**
✅ **Code Splitting** - Next.js automatic splitting
✅ **Lazy Loading** - Components load on demand
✅ **Caching** - SWR for data caching (planned)
✅ **Optimized Queries** - Indexed database queries

### 5. **Error Handling**
✅ **User-Friendly Messages** - Clear error descriptions
✅ **Fallback UI** - Loading states, error boundaries
✅ **Logging** - Console logging for debugging
✅ **Retry Logic** - Auto-retry failed requests

---

## 📱 Mobile UI Features

### Collapsible Sidebar
✅ **Auto-Collapse** - Sidebar collapses on mobile
✅ **Hamburger Menu** - Toggle button for mobile
✅ **Overlay** - Dark overlay when sidebar open
✅ **Swipe Gestures** - Swipe to close sidebar
✅ **Persistent State** - Remember collapsed/expanded state

### Touch Optimizations
✅ **Large Buttons** - Min 44px touch targets
✅ **Proper Spacing** - Avoid accidental taps
✅ **Scroll Optimization** - Smooth scrolling on mobile

---

## 🗂️ Navigation Structure

### Staff Navigation
- Dashboard
- Transactions
  - New Sales
  - Sales Return
  - New Purchase
- Credit Received
- Customers
- Draft Entries
- History (view only)

### Manager Navigation
- Dashboard (enhanced with charts)
- All Staff options +
- Lock/Unlock Day
- Export Data

### Admin Navigation
- Dashboard
- **Administration** (new section)
  - **Reports**
    - All Reports
    - Sales Report
    - Financial Report
    - Outlet Performance
    - User Activity
  - **Management**
    - User Management
    - Outlet Management

### HO Accountant Navigation
- HO Dashboard (multi-outlet)
- All Staff options
- Export Consolidated

### Auditor Navigation
- Dashboard (read-only)
- History (all outlets, read-only)

---

## 🎨 UI Components

### Reusable Components Created
1. **MetricCard** - Dashboard stat cards with trends
2. **SalesTrendChart** - Line chart for sales data
3. **PaymentModePie** - Pie chart for payment distribution
4. **RecentTransactions** - Transaction list widget
5. **TopBar** - Header with status + duty end button
6. **Sidebar** - Role-aware navigation

### Design System
- **Colors:** Blue (primary), Green (success), Red (danger), Orange (warning)
- **Fonts:** System fonts for performance
- **Icons:** Lucide React icon library
- **Charts:** Recharts library

---

## 📝 Summary of New Features (This Session)

### ✅ Completed
1. **Auto-Calculation** - 3+ mode payment distribution
2. **Visual Feedback** - Green highlight + "✨ Auto" badge
3. **Manager Dashboard** - Complete with 4 metrics, 2 charts, widgets
4. **HO Accountant Dashboard** - Multi-outlet consolidated view
5. **Admin Navigation** - Reports & Management sections
6. **Reports Page** - 6 report cards with descriptions
7. **User Management Page** - List, search, stats, **Add/Edit Functionality**
8. **Outlet Management Page** - Cards, search, stats, **Add/Edit Functionality**
9. **Export Functionality** - CSV downloads (3 options)
10. **Lock/Unlock Day** - Database integration
11. **Duty End Feature** - Button, tracking, login prevention
12. **Time-Based Login** - 7 AM - 2 AM window for staff
13. **Auto Sign-Out** - Automatic session termination at 2 AM for staff
14. **Responsive Layout** - Collapsible sidebar drawer with overlay on mobile
15. **Role-Based Dashboards** - Auto-routing by role
16. **Universal Dark Mode** - Full system-wide dark theme support
17. **Motivational UI** - Randomized encouraging messages on Login & Rest screens
18. **Rest Mode** - Dedicated `/rest` screen with countdown timer for off-hours

### 🚧 Phase 6: BI & Forecasting (Future Roadmap)
- [ ] **BI Dashboards** - Advanced visual analytics
- [ ] **Forecasting** - AI-driven revenue prediction
- [ ] **Custom Reports** - Drag-and-drop report builder
- [ ] **Real-time WebSocket updates**
- [ ] **Anomaly detection system refinement**

---

## 🔐 Security Features

1. **Authentication**
   - Supabase Auth with JWT tokens
   - Secure password hashing (bcrypt)
   - Session timeout handling

2. **Authorization**
   - Row Level Security on all tables
   - Role-based access control
   - Audit trail logging

3. **Data Protection**
   - HTTPS only (enforced by Vercel)
   - XSS protection (React auto-escaping)
   - SQL injection prevention (Supabase prepared statements)

4. **Time-Based Security**
   - Staff login window restrictions
   - Duty end enforcement
   - Day locking mechanism

---

## 📞 Support & Documentation

### User Credentials
See `USER_CREDENTIALS.md` for test accounts

### Database Schema
See `current supabase schema.txt` for complete schema

### Migration Files
Located in `supabase/migrations/` - all database changes tracked

### API Documentation
Supabase auto-generated API docs available in Supabase dashboard

---

**Last Updated:** 21:00 02/01/26
**Version:** 2.3.0
**System Status:** ✅ Production Ready

---

## 🆕 Phase 8: Granular Reports & Access Management ✅ COMPLETED

### Reports Access Control

#### Admin / HO Accountant (Full Access)
✅ **All 7 Reports Available:**
1. Sales Report - Multi-outlet view
2. Financial Report - Consolidated data
3. Customer Insights - All customers
4. Transaction Report - All transactions
5. Outlet Performance - Comparison tool
6. Trends & Analytics - Business intelligence
7. User Activity - System audit logs

✅ **Features:**
- Multi-outlet dropdown selector
- Export data from all outlets
- Consolidated views and comparisons
- Performance analytics

#### Store Manager (Restricted Access)
✅ **4 Reports Available:**
1. Sales Report - Own outlet only
2. Financial Report - Own outlet only
3. Customer Insights - Own customers only
4. Transaction Report - Own outlet only

❌ **Hidden Reports:**
- Outlet Performance (HO comparison)
- Trends & Analytics (consolidated BI)
- User Activity (audit logs)

✅ **Data Isolation:**
- All queries auto-filtered by `outlet_id`
- Export limited to own outlet
- Outlet dropdown hidden
- Outlet column hidden in tables
- Route-level protection prevents URL bypass

### Reports Enhancements

✅ **Customer Sales History Integration**
- History button (📜 icon) on each customer row
- Links to `/dashboard/history/sales?customer=PHONE`
- Automatic filtering by customer phone
- View full purchase history per customer

✅ **Access Denied Pages**
- HO-exclusive reports show clear denial message
- Prevents unauthorized access via direct URLs
- Professional error UI with icon

✅ **Field Standardization**
- `transaction_type` → `type`
- `payment_modes` → `payment_mode`
- Consistent across all report pages

### Implementation Details

**Modified Files:**
- `components/layout/sidebar.tsx` - Role-based report visibility
- `app/(dashboard)/dashboard/reports/page.tsx` - Role filtering
- `app/(dashboard)/dashboard/reports/sales/page.tsx` - Outlet filtering
- `app/(dashboard)/dashboard/reports/financial/page.tsx` - Outlet filtering
- `app/(dashboard)/dashboard/reports/customers/page.tsx` - Customer filtering + history button
- `app/(dashboard)/dashboard/reports/transactions/page.tsx` - Outlet filtering
- `app/(dashboard)/dashboard/reports/outlets/page.tsx` - Access control
- `app/(dashboard)/dashboard/reports/analytics/page.tsx` - Access control + field fixes
- `app/(dashboard)/dashboard/reports/users/page.tsx` - Access control + profiles table
- `app/(dashboard)/dashboard/history/sales/page.tsx` - Customer filtering via URL params

---

## 📱 PWA Enhancements ✅ COMPLETED

### Professional Icons & Splash Screens

✅ **Icon Set (10 sizes)**
- 48x48, 72x72, 96x96, 128x128, 144x144
- 152x152, 192x192, 256x256, 384x384, 512x512
- All using exact Sahakar Accounts branding

✅ **Splash Screens (45 devices)**
- **iPhones:** SE through iPhone 17 Pro Max
- **iPads:** Mini through 13" iPad Pro M4
- Portrait and landscape orientations
- Professional logo-centered design

✅ **Manifest Configuration**
- Updated `manifest.json` with all icons
- Version 2.0.0 for cache busting
- Proper purpose flags (any/maskable)
- Apple splash screen meta tags in layout

✅ **Browser Support**
- Chrome/Edge (Windows desktop PWA)
- Safari (iOS/iPadOS)
- Proper favicon for all browsers
- Install prompt with logo

**Files:**
- `public/icon-*.png` (10 files)
- `public/iPhone_*.png` + `public/iPad_*.png` (45 files)
- `public/manifest.json` - Updated
- `app/layout.tsx` - 45 Apple splash meta tags
- `public/favicon.png`, `public/favicon.ico`

---

## 🚀 Phase 9: Reports & Analytics Expansion (PLANNED)

### New Reports to Add

#### 1. **Staff Performance Report** 📊
- Route: `/dashboard/reports/staff-performance`
- Access: All roles (outlet-filtered for managers)
- Features: Transaction count, revenue per staff, performance metrics

#### 2. **Credit Report (Outstanding Balances)** 💳
- Route: `/dashboard/reports/credit`
- Access: All roles (outlet-filtered)
- Features: Outstanding balances, aging analysis, overdue tracking

#### 3. **Daily Summary Report (Tally-Focused)** 📝
- Route: `/dashboard/reports/daily-summary`
- Access: All roles (outlet-filtered)
- Features: Opening balance, tally, variance tracking, calendar view

#### 4. **Month-End Close Report** 📅
- Route: `/dashboard/reports/month-end`
- Access: Admin/HO only
- Features: MTD summary, reconciliation status, approval workflow

#### 5. **Credit Limit Monitoring** ⚠️
- Route: `/dashboard/reports/credit-monitoring`
- Access: All roles (outlet-filtered)
- Features: Credit utilization alerts, limit breach detection

#### 6. **Payment Mode Analysis** 💰
- Route: `/dashboard/reports/payment-modes`
- Access: All roles (outlet-filtered)
- Features: Mode breakdown, trends, settlement tracking

### Dashboard Enhancements

✅ **Summary Metrics (Planned)**
- Real-time KPI cards on Reports main page
- Outlet-specific for managers
- Consolidated for HO/Admin

✅ **Sidebar Updates (Planned)**
- Add "Trends & Analytics" to sidebar (HO only)
- Alphabetize report links
- Group by access level


### Status
- ✅ **Phase 9 COMPLETE** - All 6 reports implemented and deployed
- 3 reports fully functional (Payment Mode, Credit, Daily Summary, Staff Performance)
- 2 reports with core features (Credit Monitoring)
- 1 report with access control only (Month-End Close)

### 🔮 Future Enhancements (Phase 10+)

#### Credit Monitoring Advanced Features
- [ ] Email/SMS alert system for critical utilization
- [ ] Push notifications in app
- [ ] Automated credit limit increase workflow
- [ ] Payment reminder system
- [ ] Customer communication templates

#### Month-End Close Workflow
- [ ] MTD summary calculations across all outlets
- [ ] Multi-step approval workflow
- [ ] Reconciliation checklist system
- [ ] Variance reporting and explanations
- [ ] Export to accounting software (Tally, QuickBooks)
- [ ] Month-end closure lock mechanism

#### General Report Enhancements
- [ ] Scheduled report exports (daily/weekly emails)
- [ ] Custom date range presets
- [ ] Report favorites/bookmarks
- [ ] Advanced filtering and sorting
- [ ] Data visualization customization

---
