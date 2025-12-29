-- =====================================================
-- Verify RLS Policies on Users Table
-- =====================================================
-- This script checks and fixes RLS policies to ensure
-- authenticated users can read their own profiles

-- 1. Check existing policies on users table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users';

-- 2. If no policy exists for reading own profile, create it
DO $$
BEGIN
    -- Drop existing policy if it exists
    DROP POLICY IF EXISTS "Users can read own profile" ON users;
    
    -- Create policy allowing users to read their own profile
    CREATE POLICY "Users can read own profile"
    ON users FOR SELECT
    USING (auth.uid() = id);
    
    RAISE NOTICE 'Policy created: Users can read own profile';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;

-- 3. Verify the policy was created
SELECT 
    policyname,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'users' 
  AND policyname = 'Users can read own profile';

-- 4. Test the policy by selecting own profile
-- (Run this as an authenticated user in Supabase SQL Editor)
SELECT id, email, name, role 
FROM users 
WHERE id = auth.uid();
-- 5. Allow admins to update auditor access fields for any user
DO $$
BEGIN
    DROP POLICY IF EXISTS "Admins can update auditor access" ON users;
    
    CREATE POLICY "Admins can update auditor access"
    ON users FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid()
        AND role IN ('master_admin', 'superadmin')
      )
    );
    
    RAISE NOTICE 'Policy created: Admins can update auditor access';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error creating policy: %', SQLERRM;
END $$;
