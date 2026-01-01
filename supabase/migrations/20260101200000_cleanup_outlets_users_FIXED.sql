-- Migration: 20260101200000_cleanup_outlets_users_FIXED.sql
-- Goal: Keep only 4 specific outlets and map test users to them
-- FIXED: Handles foreign key constraints properly

-- STEP 1: Unlink all users from outlets first
UPDATE public.users SET outlet_id = NULL WHERE id IS NOT NULL;

-- STEP 2: Delete dependent data from transactions (depends on daily_records)
DELETE FROM public.transactions 
WHERE daily_record_id IN (
    SELECT id FROM public.daily_records 
    WHERE outlet_id NOT IN (
        'b64f135c-5279-4f5e-9331-00392011d3da',
        '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
        '716b6d1f-a740-406c-a764-548a4de15722',
        '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
    )
);

DELETE FROM public.sheet_sync_log 
WHERE daily_record_id IN (
    SELECT id FROM public.daily_records 
    WHERE outlet_id NOT IN (
        'b64f135c-5279-4f5e-9331-00392011d3da',
        '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
        '716b6d1f-a740-406c-a764-548a4de15722',
        '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
    )
);

-- STEP 3: Delete daily_records for unwanted outlets
DELETE FROM public.daily_records 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

-- STEP 4: Delete from other outlet-referencing tables
DELETE FROM public.monthly_summaries WHERE outlet_id NOT IN ('b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca');
DELETE FROM public.outlet_counters WHERE outlet_id NOT IN ('b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca');
DELETE FROM public.auditor_access_log WHERE outlet_id NOT IN ('b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca');
DELETE FROM public.monthly_closures WHERE outlet_id NOT IN ('b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca');
DELETE FROM public.monthly_closure_snapshots WHERE outlet_id NOT IN ('b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca');
DELETE FROM public.customers WHERE outlet_id NOT IN ('b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca');
DELETE FROM public.anomalies WHERE outlet_id NOT IN ('b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca');
DELETE FROM public.auditor_outlets WHERE outlet_id NOT IN ('b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51', '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca');

-- STEP 5: Delete unwanted outlets
DELETE FROM public.outlets 
WHERE id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

-- STEP 6: Re-map users to their correct outlets
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
