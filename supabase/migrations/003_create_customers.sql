-- Create customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    referred_by UUID NOT NULL REFERENCES users(id),
    outlet_id UUID NOT NULL REFERENCES outlets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_referred_by ON customers(referred_by);
CREATE INDEX idx_customers_outlet_id ON customers(outlet_id);

-- RLS Policies
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Basic read access for anon
CREATE POLICY "Anon read access" ON customers
    FOR SELECT TO anon
    USING (true);

-- Full access for authenticated users
CREATE POLICY "Authenticated full access" ON customers
    FOR ALL TO authenticated
    USING (true);