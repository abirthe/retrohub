-- =============================================================================
-- RetroHub Database Maintenance: Drop Obsolete Functions
-- =============================================================================
-- 1. validate_order_stock(uuid) references the deprecated public.inventory_keys
--    table dropped in v2 schema (20260917002_v2_schema_tables.sql).
-- 2. send_order_completion_email(uuid) was an old unused pg_net trigger, now superseded
--    by the Supabase Edge Function send-order-email.

DROP FUNCTION IF EXISTS public.validate_order_stock(uuid);
DROP FUNCTION IF EXISTS public.send_order_completion_email(uuid);
