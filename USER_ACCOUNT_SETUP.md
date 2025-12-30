# User Account Creation Guide



## Step 1: Create Auth Users in Supabase

1. Go to: https://supabase.com/dashboard/project/pvdqotuhuwzooysrmtrd
2. Click **Authentication** → **Users**
3. Create these 4 users:

### User 1: Superadmin
- Email: `frpboy12@gmail.com`
- Password: Zabnix@2025
- ✅ Check "Auto Confirm User"

### User 2: HO Accountant
- Email: `paymentstarlexpmna@gmail.com`
- Password: Zabnix@2025
- ✅ Check "Auto Confirm User"

### User 3: Outlet Manager (Test)
- Email: `manager.test@sahakar.com`
- Password: Zabnix@2025
- ✅ Check "Auto Confirm User"

### User 4: Outlet Staff (Test)
- Email: `staff.test@sahakar.com`
- Password: Zabnix@2025
- ✅ Check "Auto Confirm User"

### User 5: Auditor (Test)
- Email: `auditor.test@sahakar.com`
- Password: Zabnix@2025
- ✅ Check "Auto Confirm User"

## Step 2: Get Outlet ID

After creating the users, you need to get the Main Outlet ID to assign to the manager and staff.

Run this query in SQL Editor:

```sql
SELECT id, name, location FROM outlets;
```

Copy the UUID for "Main Outlet".

## Step 3: Insert User Profiles

After creating all 4 auth users AND getting the Main Outlet ID, run this SQL script in the SQL Editor:

```sql
-- Insert user profiles
-- IMPORTANT: Replace the UUIDs with the actual auth.users IDs from Step 1
-- Replace [main_outlet_id] with the outlet ID from Step 2

INSERT INTO users (id, email, name, role, outlet_id) VALUES
  -- Superadmin (replace with actual UUID from auth.users)
  ('[REPLACE_WITH_SUPERADMIN_UUID]', 'frpboy12@gmail.com', 'K4NN4N', 'superadmin', NULL),
  
  -- HO Accountant (replace with actual UUID from auth.users)
  ('[REPLACE_WITH_ACCOUNTANT_UUID]', 'paymentstarlexpmna@gmail.com', 'HO Accountant', 'ho_accountant', NULL),
  
  -- Outlet Manager (replace with actual UUID from auth.users AND outlet_id)
  ('[REPLACE_WITH_MANAGER_UUID]', 'manager.test@sahakar.com', 'Test Manager', 'outlet_manager', '[REPLACE_WITH_MAIN_OUTLET_ID]'),
  
  -- Outlet Staff (replace with actual UUID from auth.users AND outlet_id)
  ('[REPLACE_WITH_STAFF_UUID]', 'staff.test@sahakar.com', 'Test Staff', 'outlet_staff', '[REPLACE_WITH_MAIN_OUTLET_ID]');
```

## Step 4: Verify Users

Run this query to verify all users are correctly set up:

```sql
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  o.name as outlet_name
FROM users u
LEFT JOIN outlets o ON u.outlet_id = o.id
ORDER BY u.role, u.name;
```

You should see all 4 users with their correct roles and outlet assignments.

## Quick Copy Guide

**To get each user's UUID:**
1. Go to Authentication → Users
2. Click on each user
3. Copy their **User UID** (this is the auth.users ID)
4. Use these UUIDs in the INSERT statement above

**To get the Main Outlet ID:**
1. Go to Table Editor → outlets
2. Find "Main Outlet"
3. Copy its **id** value
4. Use this in the INSERT statement for manager and staff

---

## Alternative: Auto-Populate Script

If you prefer, here's a script that automatically finds the UUIDs for you:

```sql
-- This script will automatically insert user profiles
-- by finding the auth.users IDs from their emails

WITH auth_users AS (
  SELECT id, email FROM auth.users
),
main_outlet AS (
  SELECT id FROM outlets WHERE name = 'Main Outlet' LIMIT 1
)
INSERT INTO users (id, email, name, role, outlet_id)
SELECT 
  au.id,
  au.email,
  CASE au.email
    WHEN 'frpboy12@gmail.com' THEN 'K4NN4N'
    WHEN 'paymentstarlexpmna@gmail.com' THEN 'HO Accountant'
    WHEN 'manager.test@sahakar.com' THEN 'Test Manager'
    WHEN 'staff.test@sahakar.com' THEN 'Test Staff'
    WHEN 'auditor.test@sahakar.com' THEN 'Test Auditor'
  END as name,
  CASE au.email
    WHEN 'frpboy12@gmail.com' THEN 'superadmin'
    WHEN 'paymentstarlexpmna@gmail.com' THEN 'ho_accountant'
    WHEN 'manager.test@sahakar.com' THEN 'outlet_manager'
    WHEN 'staff.test@sahakar.com' THEN 'outlet_staff'
    WHEN 'auditor.test@sahakar.com' THEN 'auditor'
  END as role,
  CASE au.email
    WHEN 'manager.test@sahakar.com' THEN (SELECT id FROM main_outlet)
    WHEN 'staff.test@sahakar.com' THEN (SELECT id FROM main_outlet)
    WHEN 'auditor.test@sahakar.com' THEN NULL -- Auditors don't belong to a specific outlet
    ELSE NULL
  END as outlet_id
FROM auth_users au
WHERE au.email IN (
  'frpboy12@gmail.com',
  'paymentstarlexpmna@gmail.com',
  'manager.test@sahakar.com',
  'staff.test@sahakar.com',
  'auditor.test@sahakar.com'
)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  outlet_id = EXCLUDED.outlet_id;
```

**Note:** This auto-populate script can ONLY be run AFTER you've created all 4 users in Authentication → Users!
