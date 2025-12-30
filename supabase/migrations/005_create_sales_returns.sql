-- Create sales_returns table
CREATE TABLE sales_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    cash_amount DECIMAL(10,2) DEFAULT 0,
    upi_amount DECIMAL(10,2) DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id),
    outlet_id UUID NOT NULL REFERENCES outlets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_returns_entry_number ON sales_returns(entry_number);
CREATE INDEX idx_returns_customer_id ON sales_returns(customer_id);
CREATE INDEX idx_returns_user_id ON sales_returns(user_id);
CREATE INDEX idx_returns_outlet_id ON sales_returns(outlet_id);

-- RLS Policies
ALTER TABLE sales_returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon read returns" ON sales_returns
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Authenticated returns access" ON sales_returns
    FOR ALL TO authenticated
    USING (true);