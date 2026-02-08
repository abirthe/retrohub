-- Add 'cancelled' status to order_status enum
-- This migration adds the 'cancelled' status value to the order_status enum
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'order_status')
    ) THEN
        ALTER TYPE public.order_status ADD VALUE 'cancelled';
    END IF;
END $$;

