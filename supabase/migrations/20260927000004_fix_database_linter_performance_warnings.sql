-- ==============================================================================
-- Migration: 20260927000004_fix_database_linter_performance_warnings.sql
-- Resolves all Supabase database linter performance and security warnings:
-- 1. duplicate_index: Drop redundant duplicate indexes on orders and products
-- 2. unindexed_foreign_keys: Add covering index for customer_support_sessions(user_id)
-- 3. multiple_permissive_policies: Consolidate overlapping policies for same action/role
-- 4. auth_rls_initplan: Replace auth.uid() with (select auth.uid()) across all RLS policies
-- ==============================================================================

-- ==============================================================================
-- 1. DUPLICATE INDEXES
-- ==============================================================================
-- orders has identical indexes {idx_orders_user, idx_orders_user_id} on (user_id).
-- Keep idx_orders_user_id, drop idx_orders_user.
DROP INDEX IF EXISTS public.idx_orders_user;

-- products has identical indexes {idx_products_title_unique, products_title_unique} on (title).
-- Keep products_title_unique constraint/index, drop idx_products_title_unique.
DROP INDEX IF EXISTS public.idx_products_title_unique;

-- ==============================================================================
-- 2. UNINDEXED FOREIGN KEYS
-- ==============================================================================
-- customer_support_sessions has foreign key customer_support_sessions_user_id_fkey without covering index.
CREATE INDEX IF NOT EXISTS idx_customer_support_sessions_user_id
  ON public.customer_support_sessions(user_id);

-- ==============================================================================
-- 3. PRODUCTS: Consolidate Policies & Fix InitPlan
-- - Drop "Admins can manage products" (was FOR ALL, creating duplicate SELECT with "Products are viewable by everyone")
-- - Re-create admin-only write policies (INSERT, UPDATE, DELETE) with (select auth.uid())
-- - Keep single SELECT policy "Products are viewable by everyone"
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

CREATE POLICY "Admins can insert products" ON public.products
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can update products" ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete products" ON public.products
  FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ==============================================================================
-- 4. PROFILES: Consolidate Policies & Fix InitPlan
-- - Merge "Users can view own profile" and "Admins can view all profiles" into single SELECT policy
-- - Update INSERT and UPDATE policies to use (select auth.uid())
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users and admins can view profiles" ON public.profiles;

CREATE POLICY "Users and admins can view profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    id = (select auth.uid())
    OR public.has_role((select auth.uid()), 'admin')
  );

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (select auth.uid()))
  WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (id = (select auth.uid()));

-- ==============================================================================
-- 5. USER_ROLES: Consolidate Policies & Fix InitPlan
-- - Merge "Users can view own roles" and "Admins can manage roles" SELECT into single SELECT policy
-- - Separate admin write operations (INSERT, UPDATE, DELETE)
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users and admins can view roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Users and admins can view roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.has_role((select auth.uid()), 'admin')
  );

CREATE POLICY "Admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ==============================================================================
-- 6. DELIVERIES: Consolidate Policies & Fix InitPlan
-- - Merge "Users can view own order deliveries" and "Admins can manage deliveries" SELECT into single SELECT policy
-- - Separate admin write operations (INSERT, UPDATE, DELETE)
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can manage deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users can view own order deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Users and admins can view deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Admins can insert deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Admins can update deliveries" ON public.deliveries;
DROP POLICY IF EXISTS "Admins can delete deliveries" ON public.deliveries;

CREATE POLICY "Users and admins can view deliveries" ON public.deliveries
  FOR SELECT TO authenticated
  USING (
    public.has_role((select auth.uid()), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = deliveries.order_id AND o.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can insert deliveries" ON public.deliveries
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can update deliveries" ON public.deliveries
  FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete deliveries" ON public.deliveries
  FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ==============================================================================
-- 7. CUSTOM_ORDERS: Consolidate Policies & Fix InitPlan
-- - Merge SELECT into single policy for users & admins
-- - Merge INSERT into single policy for guests & authenticated users
-- - Separate admin UPDATE & DELETE
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can manage custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Users can view own custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Anyone can insert custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Users and admins can view custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Users and guests can insert custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Admins can update custom orders" ON public.custom_orders;
DROP POLICY IF EXISTS "Admins can delete custom orders" ON public.custom_orders;

CREATE POLICY "Users and admins can view custom orders" ON public.custom_orders
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.has_role((select auth.uid()), 'admin')
  );

CREATE POLICY "Users and guests can insert custom orders" ON public.custom_orders
  FOR INSERT
  WITH CHECK (
    user_id IS NOT DISTINCT FROM (select auth.uid())
    OR public.has_role((select auth.uid()), 'admin')
  );

CREATE POLICY "Admins can update custom orders" ON public.custom_orders
  FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

CREATE POLICY "Admins can delete custom orders" ON public.custom_orders
  FOR DELETE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

-- ==============================================================================
-- 8. ORDERS: Fix InitPlan
-- - Replace auth.uid() with (select auth.uid()) in SELECT, INSERT, UPDATE
-- ==============================================================================
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (
    user_id = (select auth.uid())
    OR public.has_role((select auth.uid()), 'admin')
  );

DROP POLICY IF EXISTS "Users can create orders" ON public.orders;
CREATE POLICY "Users can create orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can update orders" ON public.orders;
CREATE POLICY "Admins can update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

-- ==============================================================================
-- 9. AUDIT_LOGS: Fix InitPlan
-- - Replace auth.uid() with (select auth.uid()) in SELECT, INSERT
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    actor_id = (select auth.uid())
    OR public.has_role((select auth.uid()), 'admin')
  );

-- ==============================================================================
-- 10. ADMIN_ACTION_LOGS: Fix InitPlan
-- - Replace auth.uid() with (select auth.uid()) in SELECT, INSERT
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can view action logs" ON public.admin_action_logs;
CREATE POLICY "Admins can view action logs" ON public.admin_action_logs
  FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins can insert action logs" ON public.admin_action_logs;
CREATE POLICY "Admins can insert action logs" ON public.admin_action_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));

-- ==============================================================================
-- 11. CUSTOMER_SUPPORT_SESSIONS: Fix InitPlan
-- - Replace auth.uid() with (select auth.uid()) in SELECT, UPDATE
-- ==============================================================================
DROP POLICY IF EXISTS "Admins can view support sessions" ON public.customer_support_sessions;
CREATE POLICY "Admins can view support sessions" ON public.customer_support_sessions
  FOR SELECT TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'));

DROP POLICY IF EXISTS "Admins can update support sessions" ON public.customer_support_sessions;
CREATE POLICY "Admins can update support sessions" ON public.customer_support_sessions
  FOR UPDATE TO authenticated
  USING (public.has_role((select auth.uid()), 'admin'))
  WITH CHECK (public.has_role((select auth.uid()), 'admin'));


