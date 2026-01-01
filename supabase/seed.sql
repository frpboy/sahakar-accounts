-- Seed Data for Sahakar Accounts
-- Purpose: Populate a fresh environment with 1 Outlet, 1 User mapping, and sample transactions

-- 1. Create a Test Outlet
INSERT INTO public.outlets (name, outlet_type, location_code, address, is_active)
VALUES 
('Sahakar Hyperpharmacy TVL', 'HP', 'TVL', 'Tenkasi Road, Tirunelveli', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Map Existing Auth User to the Outlet (Manual step normally, but here's the SQL)
-- REPLACE '00000000-0000-0000-0000-000000000000' with your actual auth.uid()
-- INSERT INTO public.users (id, name, role, outlet_id)
-- VALUES ('YOUR_AUTH_ID_HERE', 'Test Admin', 'superadmin', (SELECT id FROM outlets WHERE location_code = 'TVL' LIMIT 1))
-- ON CONFLICT (id) DO UPDATE SET outlet_id = EXCLUDED.outlet_id;

-- 3. Create Sample Customers
INSERT INTO public.customers (outlet_id, name, phone, customer_code, internal_customer_id, is_active)
VALUES
((SELECT id FROM outlets WHERE location_code = 'TVL' LIMIT 1), 'John Smith', '9876543210', 'HP-TVL-C000001', 'HP-TVL-C000001', true),
((SELECT id FROM outlets WHERE location_code = 'TVL' LIMIT 1), 'Alice Wong', '9123456789', 'HP-TVL-C000002', 'HP-TVL-C000002', true)
ON CONFLICT (phone) DO NOTHING;

-- 4. Create Today's Daily Record
INSERT INTO public.daily_records (outlet_id, date, opening_cash, opening_upi, status)
VALUES
((SELECT id FROM outlets WHERE location_code = 'TVL' LIMIT 1), CURRENT_DATE, 1000, 500, 'open')
ON CONFLICT (outlet_id, date) DO NOTHING;

-- 5. Create Sample Sales Transactions
INSERT INTO public.transactions (daily_record_id, outlet_id, entry_number, transaction_type, category, description, amount, payment_modes, customer_phone)
VALUES
(
  (SELECT id FROM daily_records WHERE date = CURRENT_DATE AND outlet_id = (SELECT id FROM outlets WHERE location_code = 'TVL' LIMIT 1)),
  (SELECT id FROM outlets WHERE location_code = 'TVL' LIMIT 1),
  'BILL-101', 'income', 'sales', 'Sale to John Smith', 150.00, 'Cash', '9876543210'
),
(
  (SELECT id FROM daily_records WHERE date = CURRENT_DATE AND outlet_id = (SELECT id FROM outlets WHERE location_code = 'TVL' LIMIT 1)),
  (SELECT id FROM outlets WHERE location_code = 'TVL' LIMIT 1),
  'BILL-102', 'income', 'sales', 'Sale to Alice Wong', 250.00, 'UPI', '9123456789'
);

-- Note: The generate_internal_id trigger will automatically populate internal_entry_id for these rows.
