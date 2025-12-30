-- Seed a demo outlet if it doesn't already exist
INSERT INTO public.outlets (name, code, location, is_active)
SELECT 'Main Outlet', 'OUT-001', 'HQ', true
WHERE NOT EXISTS (
    SELECT 1 FROM public.outlets WHERE code = 'OUT-001'
);
