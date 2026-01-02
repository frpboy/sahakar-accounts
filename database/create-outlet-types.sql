-- Create table for Outlet Types/Categories metadata
CREATE TABLE IF NOT EXISTS public.outlet_types (
    code text PRIMARY KEY, -- 'hyper_pharmacy', 'smart_clinic' (matches outlets.type constraint)
    name text NOT NULL, -- 'Hyper Pharmacy', 'Smart Clinic'
    short_code text NOT NULL, -- 'HP', 'SC'
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.outlet_types ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read access" ON public.outlet_types FOR SELECT USING (true);
CREATE POLICY "Allow admin update access" ON public.outlet_types FOR ALL USING (
    get_auth_role() IN ('superadmin', 'master_admin')
);

-- Seed Initial Data
INSERT INTO public.outlet_types (code, name, short_code)
VALUES 
    ('hyper_pharmacy', 'Hyper Pharmacy', 'HP'),
    ('smart_clinic', 'Smart Clinic', 'SC')
ON CONFLICT (code) DO UPDATE 
SET 
    name = EXCLUDED.name,
    short_code = EXCLUDED.short_code;
