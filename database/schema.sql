-- Sahakar Accounts Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ORGANIZATIONS TABLE
-- ============================================================================
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'Asia/Kolkata',
  locale VARCHAR(10) DEFAULT 'en-IN',
  currency VARCHAR(3) DEFAULT 'INR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. OUTLETS TABLE
-- ============================================================================
CREATE TABLE outlets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  location VARCHAR(255),
  phone VARCHAR(20),
  email VARCHAR(255),
  google_sheet_id VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

CREATE INDEX idx_outlets_organization ON outlets(organization_id);
CREATE INDEX idx_outlets_active ON outlets(is_active);

-- ============================================================================
-- 3. USERS TABLE
-- ============================================================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('master_admin', 'ho_accountant', 'outlet_manager', 'outlet_staff')),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================================
-- 4. USER_OUTLET_ACCESS TABLE
-- ============================================================================
CREATE TABLE user_outlet_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, outlet_id)
);

CREATE INDEX idx_user_outlet_user ON user_outlet_access(user_id);
CREATE INDEX idx_user_outlet_outlet ON user_outlet_access(outlet_id);

-- ============================================================================
-- 5. DAILY_RECORDS TABLE
-- ============================================================================
CREATE TABLE daily_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  opening_cash DECIMAL(12, 2) DEFAULT 0,
  opening_upi DECIMAL(12, 2) DEFAULT 0,
  closing_cash DECIMAL(12, 2) DEFAULT 0,
  closing_upi DECIMAL(12, 2) DEFAULT 0,
  total_income DECIMAL(12, 2) DEFAULT 0,
  total_expense DECIMAL(12, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'locked')),
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES users(id),
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  synced_to_sheet BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id, date)
);

CREATE INDEX idx_daily_records_outlet_date ON daily_records(outlet_id, date);
CREATE INDEX idx_daily_records_status ON daily_records(status);
CREATE INDEX idx_daily_records_sync ON daily_records(synced_to_sheet) WHERE synced_to_sheet = false;

-- ============================================================================
-- 6. TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  daily_record_id UUID NOT NULL REFERENCES daily_records(id) ON DELETE CASCADE,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  category VARCHAR(100) NOT NULL,
  payment_mode VARCHAR(20) NOT NULL CHECK (payment_mode IN ('cash', 'upi')),
  amount DECIMAL(12, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_daily_record ON transactions(daily_record_id);
CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);

-- ============================================================================
-- 7. MONTHLY_SUMMARIES TABLE
-- ============================================================================
CREATE TABLE monthly_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  total_income DECIMAL(12, 2) DEFAULT 0,
  total_expense DECIMAL(12, 2) DEFAULT 0,
  total_cash_in DECIMAL(12, 2) DEFAULT 0,
  total_cash_out DECIMAL(12, 2) DEFAULT 0,
  total_upi_in DECIMAL(12, 2) DEFAULT 0,
  total_upi_out DECIMAL(12, 2) DEFAULT 0,
  net_profit DECIMAL(12, 2) DEFAULT 0,
  opening_balance DECIMAL(12, 2) DEFAULT 0,
  closing_balance DECIMAL(12, 2) DEFAULT 0,
  days_count INTEGER DEFAULT 0,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(outlet_id, month)
);

CREATE INDEX idx_monthly_summaries_outlet_month ON monthly_summaries(outlet_id, month);

-- ============================================================================
-- 8. CATEGORIES TABLE
-- ============================================================================
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
  code VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, code)
);

CREATE INDEX idx_categories_organization ON categories(organization_id);
CREATE INDEX idx_categories_type ON categories(type);

-- ============================================================================
-- 9. AUDIT_LOGS TABLE
-- ============================================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  outlet_id UUID REFERENCES outlets(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_outlet ON audit_logs(outlet_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_outlet_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY users_view_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Outlets: Users can see outlets based on role and access
CREATE POLICY outlets_access ON outlets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (
          u.role IN ('master_admin', 'ho_accountant')
          OR
          EXISTS (
            SELECT 1 FROM user_outlet_access uoa
            WHERE uoa.user_id = u.id
              AND uoa.outlet_id = outlets.id
          )
        )
    )
  );

-- Daily Records: Based on outlet access
CREATE POLICY daily_records_access ON daily_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (
          u.role IN ('master_admin', 'ho_accountant')
          OR
          EXISTS (
            SELECT 1 FROM user_outlet_access uoa
            WHERE uoa.user_id = u.id
              AND uoa.outlet_id = daily_records.outlet_id
          )
        )
    )
  );

-- Daily Records: Users can insert/update their outlet records
CREATE POLICY daily_records_modify ON daily_records
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND (
          u.role IN ('master_admin', 'outlet_manager')
          OR
          (
            u.role = 'outlet_staff'
            AND status = 'draft'
            AND EXISTS (
              SELECT 1 FROM user_outlet_access uoa
              WHERE uoa.user_id = u.id
                AND uoa.outlet_id = daily_records.outlet_id
            )
          )
        )
    )
  );

-- Transactions: Based on daily record access
CREATE POLICY transactions_access ON transactions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM daily_records dr
      WHERE dr.id = transactions.daily_record_id
        AND EXISTS (
          SELECT 1 FROM users u
          WHERE u.id = auth.uid()
            AND (
              u.role IN ('master_admin', 'ho_accountant')
              OR
              EXISTS (
                SELECT 1 FROM user_outlet_access uoa
                WHERE uoa.user_id = u.id
                  AND uoa.outlet_id = dr.outlet_id
              )
            )
        )
    )
  );

-- Transactions: Users can add/modify transactions in draft daily records
CREATE POLICY transactions_modify ON transactions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM daily_records dr
      JOIN users u ON u.id = auth.uid()
      WHERE dr.id = transactions.daily_record_id
        AND dr.status = 'draft'
        AND (
          u.role IN ('master_admin', 'outlet_manager', 'outlet_staff')
        )
        AND (
          u.role IN ('master_admin')
          OR
          EXISTS (
            SELECT 1 FROM user_outlet_access uoa
            WHERE uoa.user_id = u.id
              AND uoa.outlet_id = dr.outlet_id
          )
        )
    )
  );

-- Categories: Users can view categories from their organization
CREATE POLICY categories_access ON categories
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
        AND u.organization_id = categories.organization_id
    )
  );

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default organization
INSERT INTO organizations (id, name, code)
VALUES ('00000000-0000-0000-0000-000000000001', 'Sahakar Hyperpharmacies', 'SAHAKAR');

-- Insert default categories
INSERT INTO categories (organization_id, name, type, code) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Consultation', 'income', 'consultation'),
  ('00000000-0000-0000-0000-000000000001', 'Medicine Sale', 'income', 'medicine_sale'),
  ('00000000-0000-0000-0000-000000000001', 'Other Income', 'income', 'other_income'),
  ('00000000-0000-0000-0000-000000000001', 'Medicine Purchase', 'expense', 'medicine_purchase'),
  ('00000000-0000-0000-0000-000000000001', 'Staff Salary', 'expense', 'staff_salary'),
  ('00000000-0000-0000-0000-000000000001', 'Clinic Expenses', 'expense', 'clinic_expenses'),
  ('00000000-0000-0000-0000-000000000001', 'Transport', 'expense', 'transport'),
  ('00000000-0000-0000-0000-000000000001', 'Rent', 'expense', 'rent'),
  ('00000000-0000-0000-0000-000000000001', 'Utilities', 'expense', 'utilities'),
  ('00000000-0000-0000-0000-000000000001', 'Miscellaneous', 'expense', 'miscellaneous');

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outlets_updated_at BEFORE UPDATE ON outlets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_records_updated_at BEFORE UPDATE ON daily_records
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
