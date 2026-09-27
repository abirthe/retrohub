-- ==============================================================================
-- Migration: 20260927000005_drop_safe_unused_indexes.sql
-- Drops unused standalone indexes that do not cover foreign keys:
-- 1. idx_profiles_email on public.profiles(email)
-- 2. idx_products_platform on public.products(platform)
-- 3. idx_audit_event_type on public.audit_logs(event_type)
-- 4. idx_support_sessions_state on public.customer_support_sessions(state)
-- 5. idx_support_sessions_order_id on public.customer_support_sessions(last_order_id)
-- 6. idx_admin_logs_created_at on public.admin_action_logs(created_at)
--
-- Indexes covering foreign keys are preserved to prevent unindexed_foreign_keys warnings:
-- - idx_orders_product_id (covers orders_product_id_fkey)
-- - idx_custom_orders_user_id (covers custom_orders_user_id_fkey)
-- - idx_deliveries_admin_id (covers deliveries_admin_id_fkey)
-- - idx_admin_logs_order_id (covers admin_action_logs_order_id_fkey)
-- - idx_admin_logs_admin_id (covers admin_action_logs_admin_id_fkey)
-- - idx_customer_support_sessions_user_id (covers customer_support_sessions_user_id_fkey)
-- ==============================================================================

DROP INDEX IF EXISTS public.idx_profiles_email;
DROP INDEX IF EXISTS public.idx_products_platform;
DROP INDEX IF EXISTS public.idx_audit_event_type;
DROP INDEX IF EXISTS public.idx_support_sessions_state;
DROP INDEX IF EXISTS public.idx_support_sessions_order_id;
DROP INDEX IF EXISTS public.idx_admin_logs_created_at;
