-- Assign staff.test@sahakar.com to Main Outlet
UPDATE users 
SET outlet_id = (SELECT id FROM outlets WHERE name = 'Main Outlet' LIMIT 1)
WHERE email = 'staff.test@sahakar.com';

-- Also ensure staff@example.com (used in some logs) is assigned if it exists
UPDATE users 
SET outlet_id = (SELECT id FROM outlets WHERE name = 'Main Outlet' LIMIT 1)
WHERE email = 'staff@example.com';

-- Verify the update
SELECT u.email, o.name as outlet_name 
FROM users u 
JOIN outlets o ON u.outlet_id = o.id 
WHERE u.email IN ('staff.test@sahakar.com', 'staff@example.com');
