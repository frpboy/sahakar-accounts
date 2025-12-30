-- Create outlets table
CREATE TABLE outlets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample outlet
INSERT INTO outlets (name, address) VALUES 
    ('Main Store', '123 Main Street, City');