-- Migration: 20260101200000_cleanup_outlets_users.sql
-- Goal: Keep only 4 specific outlets and map test users to them

BEGIN;

-- 1. Identify the outlets to keep
-- b64f135c-5279-4f5e-9331-00392011d3da (Tirur HP)
-- 1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51 (Makkaraparamba HP)
-- 716b6d1f-a740-406c-a764-548a4de15722 (Melattur HP)
-- 11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca (Karinkallathani HP)

-- 2. Delete all other outlets
-- (Note: Foreign keys like customers.outlet_id and transactions.outlet_id will need attention if they point to deleted outlets)
-- If there are orphaned records, they might cause issues. 
-- However, we assume this is a cleanup of a fresh or test environment.

DELETE FROM public.outlets 
WHERE id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

-- 3. Connect Store Users and Managers to their respective outlets

-- TIRUR
UPDATE public.users 
SET outlet_id = 'b64f135c-5279-4f5e-9331-00392011d3da'
WHERE email IN ('manager.hp.tirur@sahakar.com', 'staff.hp.tirur@sahakar.com');

-- MAKKARAPARAMBA
UPDATE public.users 
SET outlet_id = '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51'
WHERE email IN ('manager.hp.makkara@sahakar.com', 'staff.hp.makkara@sahakar.com');

-- MELATTUR
UPDATE public.users 
SET outlet_id = '716b6d1f-a740-406c-a764-548a4de15722'
WHERE email IN ('manager.hp.melattur@sahakar.com', 'staff.hp.melattur@sahakar.com');

-- KARINKALLATHANI
UPDATE public.users 
SET outlet_id = '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
WHERE email IN ('manager.hp.karinkall@sahakar.com', 'staff.hp.karinkall@sahakar.com');

-- 4. Connect Global Roles to "All" (Null outlet_id + RLS policies handles this)
UPDATE public.users 
SET outlet_id = NULL 
WHERE role IN ('superadmin', 'master_admin', 'ho_accountant', 'auditor');

COMMIT;
