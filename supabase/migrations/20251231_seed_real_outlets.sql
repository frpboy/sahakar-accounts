-- Add real outlets for testing
INSERT INTO outlets (name, code, location, type, is_active)
VALUES 
    ('Sahakar Hyper Pharmacy - Tirur', 'HP-TIRUR', 'Tirur', 'hyper_pharmacy', true),
    ('Sahakar Hyper Pharmacy - Makkaraparamba', 'HP-MAKKARA', 'Makkaraparamba', 'hyper_pharmacy', true),
    ('Sahakar Hyper Pharmacy - Melattur', 'HP-MELATTUR', 'Melattur', 'hyper_pharmacy', true),
    ('Sahakar Hyper Pharmacy - Karinkallathani', 'HP-KARINKALL', 'Karinkallathani', 'hyper_pharmacy', true),
    ('Sahakar Smart Clinic - Tirur', 'SC-TIRUR', 'Tirur', 'smart_clinic', true),
    ('Sahakar Smart Clinic - Makkaraparamba', 'SC-MAKKARA', 'Makkaraparamba', 'smart_clinic', true),
    ('Sahakar Smart Clinic - Melattur', 'SC-MELATTUR', 'Melattur', 'smart_clinic', true),
    ('Sahakar Smart Clinic - Karinkallathani', 'SC-KARINKALL', 'Karinkallathani', 'smart_clinic', true);

-- Create users for these outlets (Staff, Manager)
-- Note: Supabase Auth users cannot be created directly via SQL easily for passwords.
-- We will insert into public.users, but the actual Auth users need to be created via API or Dashboard.
-- However, for "mocking" purposes in public.users, we can insert rows.
-- But wait, the user said "everyones password should be Zabnix@2025".
-- This implies creating actual Auth users.
-- Since I cannot access the Supabase Auth Admin API directly from SQL, I will create a script to do this.
