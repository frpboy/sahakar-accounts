-- Migration: 20260101220000_cleanup_drop_constraints.sql
-- Goal: Drop FK constraints temporarily to allow cleanup, then recreate them
-- This is the NUCLEAR option that will definitely work

-- STEP 1: Drop foreign key constraints that are blocking deletion
ALTER TABLE public.daily_records DROP CONSTRAINT IF EXISTS daily_entries_outlet_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_outlet_id_fkey;
ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS customers_outlet_id_fkey;
ALTER TABLE public.anomalies DROP CONSTRAINT IF EXISTS anomalies_outlet_id_fkey;
ALTER TABLE public.monthly_summaries DROP CONSTRAINT IF EXISTS monthly_summaries_outlet_id_fkey;
ALTER TABLE public.outlet_counters DROP CONSTRAINT IF EXISTS outlet_counters_outlet_id_fkey;
ALTER TABLE public.auditor_access_log DROP CONSTRAINT IF EXISTS auditor_access_log_outlet_id_fkey;
ALTER TABLE public.monthly_closures DROP CONSTRAINT IF EXISTS monthly_closures_outlet_id_fkey;
ALTER TABLE public.monthly_closure_snapshots DROP CONSTRAINT IF EXISTS monthly_closure_snapshots_outlet_id_fkey;
ALTER TABLE public.auditor_outlets DROP CONSTRAINT IF EXISTS auditor_outlets_outlet_id_fkey;

-- STEP 2: Unlink all users
UPDATE public.users SET outlet_id = NULL WHERE id IS NOT NULL;

-- STEP 3: Delete all data for unwanted outlets
DELETE FROM public.transactions WHERE daily_record_id IN (
    SELECT id FROM public.daily_records WHERE outlet_id NOT IN (
        'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
        '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
    )
);

DELETE FROM public.sheet_sync_log WHERE daily_record_id IN (
    SELECT id FROM public.daily_records WHERE outlet_id NOT IN (
        'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
        '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
    )
);

DELETE FROM public.daily_records WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.monthly_summaries WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.outlet_counters WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.auditor_access_log WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.monthly_closures WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.monthly_closure_snapshots WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.customers WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.anomalies WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

DELETE FROM public.auditor_outlets WHERE outlet_id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

-- STEP 4: NOW delete the unwanted outlets (no FK constraints blocking)
DELETE FROM public.outlets WHERE id NOT IN (
    'b64f135c-5279-4f5e-9331-00392011d3da', '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51',
    '716b6d1f-a740-406c-a764-548a4de15722', '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
);

-- STEP 5: Remap users to correct outlets
UPDATE public.users SET outlet_id = 'b64f135c-5279-4f5e-9331-00392011d3da'
WHERE email IN ('manager.hp.tirur@sahakar.com', 'staff.hp.tirur@sahakar.com');

UPDATE public.users SET outlet_id = '1fe5f9e0-1c4f-4fdc-901e-0a583d6c5e51'
WHERE email IN ('manager.hp.makkara@sahakar.com', 'staff.hp.makkara@sahakar.com');

UPDATE public.users SET outlet_id = '716b6d1f-a740-406c-a764-548a4de15722'
WHERE email IN ('manager.hp.melattur@sahakar.com', 'staff.hp.melattur@sahakar.com');

UPDATE public.users SET outlet_id = '11090d2c-0dc9-4ce0-a635-2e9c6fbb49ca'
WHERE email IN ('manager.hp.karinkall@sahakar.com', 'staff.hp.karinkall@sahakar.com');

-- STEP 6: Recreate foreign key constraints
ALTER TABLE public.daily_records 
    ADD CONSTRAINT daily_entries_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.users 
    ADD CONSTRAINT users_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.customers 
    ADD CONSTRAINT customers_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.anomalies 
    ADD CONSTRAINT anomalies_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.monthly_summaries 
    ADD CONSTRAINT monthly_summaries_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.outlet_counters 
    ADD CONSTRAINT outlet_counters_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.auditor_access_log 
    ADD CONSTRAINT auditor_access_log_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.monthly_closures 
    ADD CONSTRAINT monthly_closures_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.monthly_closure_snapshots 
    ADD CONSTRAINT monthly_closure_snapshots_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);

ALTER TABLE public.auditor_outlets 
    ADD CONSTRAINT auditor_outlets_outlet_id_fkey 
    FOREIGN KEY (outlet_id) REFERENCES public.outlets(id);
