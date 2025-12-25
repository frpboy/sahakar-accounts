-- =====================================================
-- Fix: Profile Not Found - Add Demo User Profiles
-- =====================================================
-- This script creates user profiles for all demo accounts

-- Insert demo user profiles (if they don't exist)
INSERT INTO users (id, email, name, role, created_at)
SELECT 
    auth.users.id,
    auth.users.email,
    CASE 
        WHEN auth.users.email = 'frpboy12@gmail.com' THEN 'Superadmin User'
        WHEN auth.users.email = 'paymentstarlexpmna@gmail.com' THEN 'HO Accountant'
        WHEN auth.users.email = 'manager.test@sahakar.com' THEN 'Manager User'
        WHEN auth.users.email = 'staff.test@sahakar.com' THEN 'Staff User'
        WHEN auth.users.email = 'auditor.test@sahakar.com' THEN 'Auditor User'
    END as name,
    CASE 
        WHEN auth.users.email = 'frpboy12@gmail.com' THEN 'superadmin'
        WHEN auth.users.email = 'paymentstarlexpmna@gmail.com' THEN 'ho_accountant'
        WHEN auth.users.email = 'manager.test@sahakar.com' THEN 'outlet_manager'
        WHEN auth.users.email = 'staff.test@sahakar.com' THEN 'outlet_staff'
        WHEN auth.users.email = 'auditor.test@sahakar.com' THEN 'auditor'
    END as role,
    NOW() as created_at
FROM auth.users
WHERE auth.users.email IN (
    'frpboy12@gmail.com',
    'paymentstarlexpmna@gmail.com',
    'manager.test@sahakar.com',
    'staff.test@sahakar.com',
    'auditor.test@sahakar.com'
)
ON CONFLICT (id) DO NOTHING;

-- Verify the insert
SELECT id, email, name, role 
FROM users 
WHERE email IN (
    'frpboy12@gmail.com',
    'paymentstarlexpmna@gmail.com',
    'manager.test@sahakar.com',
    'staff.test@sahakar.com',
    'auditor.test@sahakar.com'
);
