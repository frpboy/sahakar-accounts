
-- Fix for "column users.full_name does not exist" error
-- This error occurs because some part of the system (likely a trigger or query) expects 'full_name'
-- but the table uses 'name'. We add 'full_name' as a generated column or just a regular column to support both.

DO $$
BEGIN
    -- Check if column exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'full_name') THEN
        -- Add the column
        ALTER TABLE public.users ADD COLUMN full_name text;
        
        -- Sync existing data
        UPDATE public.users SET full_name = name WHERE full_name IS NULL;
        
        RAISE NOTICE 'Added full_name column to users table';
    ELSE
        RAISE NOTICE 'full_name column already exists';
    END IF;
END $$;
