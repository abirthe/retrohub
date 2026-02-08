-- Helper function to get user email (for email service)
CREATE OR REPLACE FUNCTION public.get_user_email(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  -- Get email from auth.users
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = p_user_id;
  
  RETURN v_email;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.get_user_email(UUID) TO authenticated;

-- Update trigger to actually call Edge Function via HTTP
-- Note: PostgreSQL can't make HTTP requests directly, so we'll use pg_net extension if available
-- Otherwise, the frontend will handle email sending

CREATE OR REPLACE FUNCTION public.trigger_send_completion_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
BEGIN
  -- Only send email when order status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NEW.final_output IS NOT NULL THEN
      -- Get user email
      SELECT email INTO v_user_email
      FROM auth.users
      WHERE id = NEW.user_id;

      -- Log email notification (actual sending handled by frontend/Edge Function)
      INSERT INTO public.audit_logs (
        event_type, actor_id, table_name, record_id, after_state
      ) VALUES (
        'email_queued', NEW.user_id, 'orders', NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'recipient', v_user_email,
          'status', 'queued',
          'note', 'Email will be sent via Edge Function'
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

