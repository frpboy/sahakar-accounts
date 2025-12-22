# Infrastructure Setup - Final Steps# Remaining Setup Tasks

## 1. ✅ Vercel Environment Variables (COMPLETED)

All 7 environment variables have been successfully configured in Vercel:
- ✅ `NEXT_PUBLIC_SUPABASE_URL`
- ✅ `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
- ✅ `SUPABASE_SERVICE_ROLE_KEY`
- ✅ `GOOGLE_SHEETS_CLIENT_EMAIL`
- ✅ `GOOGLE_SHEETS_PRIVATE_KEY` (full RSA private key)
- ✅ `GOOGLE_DRIVE_FOLDER_ID`
- ✅ `CRON_SECRET`

**NEXT STEP:** You must **REDEPLOY** the application in Vercel for these environment variables to take effect!

## 2. ✅ Google Drive Folder Sharing (COMPLETED)

The Google Drive folder "Sahakar Accounts (READ ONLY - Auto-Synced)" has been shared with:
- Email: **paymentstarlexpmna@gmail.com**
- Access: **Viewer** (read-only)
- Status: ✅ Confirmed

## 3. Supabase Database Setup

### Enable Row Level Security (RLS)
First, enable RLS on all tables and create policies.

### Create Database Tables

#### `outlets` table (create first - referenced by other tables)
```sql
CREATE TABLE outlets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample outlets
INSERT INTO outlets (name, location) VALUES
  ('Main Outlet', 'Mumbai'),
  ('Branch A', 'Pune'),
  ('Branch B', 'Bangalore');
```

#### `users` table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('superadmin', 'ho_accountant', 'outlet_manager', 'outlet_staff')),
  outlet_id UUID REFERENCES outlets(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

#### `daily_entries` table
```sql
CREATE TABLE daily_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID REFERENCES outlets(id) NOT NULL,
  date DATE NOT NULL,
  particulars TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  category TEXT NOT NULL,
  payment_mode TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  synced_to_sheets BOOLEAN DEFAULT FALSE,
  UNIQUE(outlet_id, date, particulars, amount)
);

-- Create indexes for faster queries
CREATE INDEX idx_daily_entries_outlet ON daily_entries(outlet_id);
CREATE INDEX idx_daily_entries_date ON daily_entries(date);
CREATE INDEX idx_daily_entries_synced ON daily_entries(synced_to_sheets);
```

## 4. User Accounts Setup

### Required User Accounts
Create these accounts in Supabase Auth, then add corresponding entries in the `users` table:

1.  **Superadmin**
    -   Email: **frpboy12@gmail.com**
    -   Name: **K4NN4N**
    -   Role: `superadmin`
    -   Outlet: NULL (has access to all outlets)

2.  **HO Accountant**
    -   Email: **paymentstarlexpmna@gmail.com**
    -   Name: **[Your accountant's name]**
    -   Role: `ho_accountant`
    -   Outlet: NULL (has read-only access to all outlets)

3.  **Outlet Manager** (Test Account)
    -   Email: **manager.test@sahakar.com** (create this)
    -   Name: **Test Manager**
    -   Role: `outlet_manager`
    -   Outlet: [Assign to Main Outlet]

4.  **Outlet Staff** (Test Account)
    -   Email: **staff.test@sahakar.com** (create this)
    -   Name: **Test Staff**
    -   Role: `outlet_staff`
    -   Outlet: [Assign to Main Outlet]

### SQL to Insert Users (after creating in Auth)
```sql
-- After creating users in Supabase Auth, insert their profiles:
INSERT INTO users (id, email, name, role, outlet_id) VALUES
  ('[auth_user_id]', 'frpboy12@gmail.com', 'K4NN4N', 'superadmin', NULL),
  ('[auth_user_id]', 'paymentstarlexpmna@gmail.com', '[Accountant Name]', 'ho_accountant', NULL),
  ('[auth_user_id]', 'manager.test@sahakar.com', 'Test Manager', 'outlet_manager', '[main_outlet_id]'),
  ('[auth_user_id]', 'staff.test@sahakar.com', 'Test Staff', 'outlet_staff', '[main_outlet_id]');
```

## 5. Row Level Security Policies

```sql
-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_entries ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can read own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Superadmin can manage all users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Outlets table policies
CREATE POLICY "Users can read outlets" ON outlets
  FOR SELECT USING (true);

CREATE POLICY "Superadmin can manage outlets" ON outlets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'superadmin'
    )
  );

-- Daily entries policies
CREATE POLICY "Users can read entries from their outlet" ON daily_entries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        role IN ('superadmin', 'ho_accountant')
        OR outlet_id = daily_entries.outlet_id
      )
    )
  );

CREATE POLICY "Staff can insert entries for their outlet" ON daily_entries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND (
        role = 'superadmin'
        OR (role IN ('outlet_manager', 'outlet_staff') AND outlet_id = daily_entries.outlet_id)
      )
    )
  );
```

## 6. Deploy and Test

### Deployment Checklist
- [ ] **Redeploy** the Vercel application (environment variables are configured)
- [ ] **Verify** deployment succeeded
- [ ] **Test** authentication flow with all 4 user roles
- [ ] **Test** daily entry creation
- [ ] **Test** Google Sheets sync
- [ ] **Verify** role-based access control
- [ ] **Check** Google Drive folder updates

### Testing Steps
1.  Login as Superadmin (frpboy12@gmail.com)
2.  Create a test daily entry
3.  Trigger manual sync to Google Sheets
4.  Verify data appears in Google Drive folder
5.  Login as HO Accountant (paymentstarlexpmna@gmail.com)
6.  Verify read-only access to Google Drive folder
7.  Test outlet manager and staff accounts

## 7. Documentation

- [ ] Update README with deployment instructions
- [ ] Document the Google Sheets sync process
- [ ] Create user guide for each role
- [ ] Document troubleshooting steps
- [ ] Add API documentation for cron jobs

## 🔧 What's in .env.local

Your `.env.local` file currently needs:

```env
# Supabase - From: https://supabase.com/dashboard/project/pvdqotuhuwzooysrmtrd/settings/api
NEXT_PUBLIC_SUPABASE_URL=https://pvdqotuhuwzooysrmtrd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here  # ⚠️ NEEDS UPDATE
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here  # ⚠️ NEEDS UPDATE

# Google (Already configured ✅)
GOOGLE_SHEETS_CLIENT_EMAIL=sahakar-sheets-sync@sahakar-accounts-production.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1rVL2Vz_BGUvD8HCcNxOs1hBFZPEK_kwn

# App (Already configured ✅)
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=qh+/yfc950RaUh7ZdCx5q/fHYz30pHxagA4ykVx0ndU=
NODE_ENV=development
```

**You need to update** the Supabase keys from your project dashboard.

---

## 📋 Next Steps

1. **Provide HO Accountant email** → I'll share the Drive folder
2. **Decide on Supabase plan** → Free or Pro?
3. **Update Supabase keys in .env.local** → Get from Supabase dashboard
