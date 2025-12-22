-- Find the superadmin auth user and create their profile
-- Run this in Supabase SQL Editor

-- First, find the superadmin user ID
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'frpboy12@gmail.com';

-- Then insert the superadmin profile (replace [UUID] with the id from above)
INSERT INTO users (id, email, name, role, outlet_id) VALUES
  ('[UUID_FROM_ABOVE]', 'frpboy12@gmail.com', 'K4NN4N', 'superadmin', NULL)
ON CONFLICT (id) DO UPDATE
SET 
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  outlet_id =EXCLUDED.outlet_id;

-- Verify all users
SELECT 
  u.id,
  u.email,
  u.name,
  u.role,
  o.name as outlet_name
FROM users u
LEFT JOIN outlets o ON u.outlet_id = o.id
ORDER BY u.role, u.name;
