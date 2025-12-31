-- Create customers table for customer management features
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  outlet_id uuid NOT NULL,
  name text NOT NULL,
  phone varchar(20),
  email varchar(255),
  address text,
  notes text,
  credit_limit numeric DEFAULT 0,
  outstanding_balance numeric DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  created_by uuid,
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id) ON DELETE CASCADE,
  CONSTRAINT customers_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_customers_outlet ON public.customers(outlet_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_active ON public.customers(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view customers from their assigned outlets
CREATE POLICY customers_select_policy ON public.customers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (
          u.role IN ('master_admin', 'superadmin', 'ho_accountant')
          OR (
            u.role IN ('outlet_manager', 'outlet_staff')
            AND u.outlet_id = customers.outlet_id
          )
        )
    )
  );

-- RLS Policy: Managers and staff can insert customers for their outlets
CREATE POLICY customers_insert_policy ON public.customers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (
          u.role IN ('master_admin', 'superadmin')
          OR (
            u.role IN ('outlet_manager', 'outlet_staff')
            AND u.outlet_id = customers.outlet_id
          )
        )
    )
  );

-- RLS Policy: Managers and admins can update customers
CREATE POLICY customers_update_policy ON public.customers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND (
          u.role IN ('master_admin', 'superadmin')
          OR (
            u.role = 'outlet_manager'
            AND u.outlet_id = customers.outlet_id
          )
        )
    )
  );

-- RLS Policy: Only admins can delete customers (soft delete preferred)
CREATE POLICY customers_delete_policy ON public.customers
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid()
        AND u.role IN ('master_admin', 'superadmin')
    )
  );

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_customers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER customers_updated_at_trigger
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_customers_updated_at();

-- Sample data (optional - remove if not needed)
-- INSERT INTO public.customers (outlet_id, name, phone, email, address)
-- SELECT 
--   o.id,
--   'Sample Customer',
--   '9876543210',
--   'customer@example.com',
--   'Sample Address'
-- FROM public.outlets o
-- LIMIT 1;

COMMENT ON TABLE public.customers IS 'Customer records for each outlet with credit tracking';
COMMENT ON COLUMN public.customers.credit_limit IS 'Maximum credit allowed for this customer';
COMMENT ON COLUMN public.customers.outstanding_balance IS 'Current credit balance owed by customer';
