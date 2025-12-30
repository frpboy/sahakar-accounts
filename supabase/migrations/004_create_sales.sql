-- Create sales table
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    sales_value DECIMAL(10,2) NOT NULL CHECK (sales_value > 0),
    payment_modes JSONB NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    outlet_id UUID NOT NULL REFERENCES outlets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_sales_entry_number ON sales(entry_number);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_user_id ON sales(user_id);
CREATE INDEX idx_sales_outlet_id ON sales(outlet_id);
CREATE INDEX idx_sales_created_at ON sales(created_at DESC);

-- RLS Policies
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- Basic read access for anon
CREATE POLICY "Anon read sales" ON sales
    FOR SELECT TO anon
    USING (true);

-- Full access for authenticated users
CREATE POLICY "Authenticated sales access" ON sales
    FOR ALL TO authenticated
    USING (true);