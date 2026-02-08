-- Fix permissive audit logs INSERT policy by adding user authentication check
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated users can insert audit logs" ON public.audit_logs
    FOR INSERT TO authenticated
    WITH CHECK (actor_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));