-- FIX: RLS Policy for Users to Read Their Own Profile
-- This policy is CRITICAL for authentication to work properly

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Users can read own profile" ON users;
DROP POLICY IF EXISTS "allow_own_profile_read" ON users;

-- Create policy: Allow authenticated users to read ONLY their own profile row
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Optional: Also allow service role full access (for admin operations)
DROP POLICY IF EXISTS "Service role full access" ON users;
CREATE POLICY "Service role full access" ON users
    FOR ALL
    USING (auth.role() = 'service_role');

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
