-- Create suppliers table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.suppliers (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    outlet_id uuid NOT NULL,
    name text NOT NULL,
    phone text,
    email text,
    gstin text,
    address text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT suppliers_pkey PRIMARY KEY (id),
    CONSTRAINT suppliers_outlet_id_fkey FOREIGN KEY (outlet_id) REFERENCES public.outlets(id)
);

-- RLS Policies
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view suppliers from their outlet" ON public.suppliers
    FOR SELECT USING (
        outlet_id IN (
            SELECT outlet_id FROM user_outlets WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert suppliers for their outlet" ON public.suppliers
    FOR INSERT WITH CHECK (
        outlet_id IN (
            SELECT outlet_id FROM user_outlets WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update suppliers from their outlet" ON public.suppliers
    FOR UPDATE USING (
        outlet_id IN (
            SELECT outlet_id FROM user_outlets WHERE user_id = auth.uid()
        )
    );
