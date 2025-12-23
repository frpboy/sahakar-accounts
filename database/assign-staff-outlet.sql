-- Assign outlet to staff user to fix "Loading daily record..." issue
UPDATE users SET outlet_id = '9e0c4614-53cf-40d3-abdd-a1d0183c3909' 
WHERE email = 'staff.test@sahakar.com';

-- Verify the assignment
SELECT email, name, role, outlet_id FROM users WHERE email = 'staff.test@sahakar.com';
