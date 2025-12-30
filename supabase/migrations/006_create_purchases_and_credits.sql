-- Create purchases table
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    particulars VARCHAR(200) NOT NULL,
    voucher_number VARCHAR(50) NOT NULL,
    invoice_number VARCHAR(50),
    cash_amount DECIMAL(10,2) DEFAULT 0,
    upi_amount DECIMAL(10,2) DEFAULT 0,
    credit_amount DECIMAL(10,2) DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id),
    outlet_id UUID NOT NULL REFERENCES outlets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for purchases
CREATE INDEX idx_purchases_voucher_number ON purchases(voucher_number);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_purchases_outlet_id ON purchases(outlet_id);

-- RLS Policies for purchases
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon read purchases" ON purchases
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Authenticated purchases access" ON purchases
    FOR ALL TO authenticated
    USING (true);

-- Create credit_received table
CREATE TABLE credit_received (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_number VARCHAR(50) NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    cash_amount DECIMAL(10,2) DEFAULT 0,
    upi_amount DECIMAL(10,2) DEFAULT 0,
    user_id UUID NOT NULL REFERENCES users(id),
    outlet_id UUID NOT NULL REFERENCES outlets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for credit_received
CREATE INDEX idx_credit_entry_number ON credit_received(entry_number);
CREATE INDEX idx_credit_customer_id ON credit_received(customer_id);
CREATE INDEX idx_credit_user_id ON credit_received(user_id);
CREATE INDEX idx_credit_outlet_id ON credit_received(outlet_id);

-- RLS Policies for credit_received
ALTER TABLE credit_received ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon read credit_received" ON credit_received
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Authenticated credit_received access" ON credit_received
    FOR ALL TO authenticated
    USING (true);