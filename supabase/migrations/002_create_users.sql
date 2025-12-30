-- Create users table (extends Supabase auth.users)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'store_manager', 'store_user')),
    outlet_id UUID REFERENCES outlets(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_outlet_id ON users(outlet_id);
CREATE INDEX idx_users_role ON users(role);

-- RLS Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Admin can see all users
CREATE POLICY "Admin full access" ON users
    FOR ALL TO authenticated
    USING (auth.uid() IN (SELECT id FROM users WHERE role = 'admin'));

-- Store managers can see their outlet users
CREATE POLICY "Store manager outlet access" ON users
    FOR SELECT TO authenticated
    USING (outlet_id = (SELECT outlet_id FROM users WHERE id = auth.uid()));