-- Migration: 20260101210000_cleanup_with_rls_bypass.sql
-- Goal: Clean up outlets by TEMPORARILY DISABLING RLS to bypass policy restrictions
-- This ensures all deletions work regardless of RLS policies

-- DISABLE RLS on all relevant tables temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_counters DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_access_log DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closures DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closure_snapshots DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_outlets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_sync_log DISABLE ROW LEVEL SECURITY;

-- STEP 1: Unlink all users from outlets
UPDATE public.users SET outlet_id = NULL WHERE id IS NOT NULL;

-- STEP 2: Delete dependent data in correct order
-- Delete transactions first (depends on daily_records)
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

-- Delete sheet sync logs (depends on daily_records)
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

-- Delete daily_records
DELETE FROM public.daily_records 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

-- Delete from other outlet-referencing tables
DELETE FROM public.monthly_summaries 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.outlet_counters 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.auditor_access_log 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.monthly_closures 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.monthly_closure_snapshots 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.customers 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.anomalies 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.auditor_outlets 
WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

-- STEP 3: Delete unwanted outlets (now all dependencies are gone)
DELETE FROM public.outlets 
WHERE id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da',
    '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722',
    '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

-- STEP 4: Re-map users to their correct outlets
UPDATE public.users SET outlet_id = 'b64f135c-5279-4f5e-9331-00392011d3da'
WHERE email IN ('manager.hp.tirur@sahakar.com', 'staff.hp.tirur@sahakar.com');

UPDATE public.users SET outlet_id = '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51'
WHERE email IN ('manager.hp.makkara@sahakar.com', 'staff.hp.makkara@sahakar.com');

UPDATE public.users SET outlet_id = '716b6d1f-a740-406c-a764-548a4de15722'
WHERE email IN ('manager.hp.melattur@sahakar.com', 'staff.hp.melattur@sahakar.com');

UPDATE public.users SET outlet_id = '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
WHERE email IN ('manager.hp.karinkall@sahakar.com', 'staff.hp.karinkall@sahakar.com');

-- RE-ENABLE RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomalies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlet_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_access_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_closure_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auditor_outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sheet_sync_log ENABLE ROW LEVEL SECURITY;
