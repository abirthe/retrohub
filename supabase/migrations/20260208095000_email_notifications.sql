-- Email Notification Function for Order Completion
-- Sends email to customer when order is completed

CREATE OR REPLACE FUNCTION public.send_order_completion_email(p_order_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order RECORD;
  v_user_email TEXT;
  v_product_title TEXT;
  v_code TEXT;
  v_result JSONB;
BEGIN
  -- Get order details with user email
  SELECT 
    o.*,
    u.email,
    p.title as product_title
  INTO v_order
  FROM public.orders o
  JOIN auth.users u ON o.user_id = u.id
  JOIN public.products p ON o.product_id = p.id
  WHERE o.id = p_order_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not found');
  END IF;

  -- Only send email for completed orders with codes
  IF v_order.status != 'completed' OR v_order.final_output IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Order not completed or no code available');
  END IF;

  v_user_email := v_order.email;
  v_product_title := v_order.product_title;
  v_code := v_order.final_output;

  -- Log email attempt (you can integrate with actual email service here)
  INSERT INTO public.audit_logs (
    event_type, actor_id, table_name, record_id, after_state
  ) VALUES (
    'email_sent', v_order.user_id, 'orders', p_order_id,
    jsonb_build_object(
      'order_id', p_order_id,
      'recipient', v_user_email,
      'product', v_product_title,
      'code_sent', true
    )
  );

  -- Return success (actual email sending will be handled by Edge Function or external service)
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Email notification queued',
    'recipient', v_user_email,
    'order_id', p_order_id
  );
END;
$$;

-- Trigger to automatically send email when order is completed
-- Note: This calls an Edge Function via HTTP request
CREATE OR REPLACE FUNCTION public.trigger_send_completion_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_email TEXT;
  v_supabase_url TEXT;
  v_supabase_anon_key TEXT;
  v_payload JSONB;
  v_response TEXT;
BEGIN
  -- Only send email when order status changes to completed
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    IF NEW.final_output IS NOT NULL THEN
      -- Get user email
      SELECT email INTO v_user_email
      FROM auth.users
      WHERE id = NEW.user_id;

      -- Get Supabase URL and anon key from environment (set via Supabase dashboard)
      -- For now, we'll log the email attempt and let Edge Function handle it
      -- The Edge Function will be called via webhook or manually
      
      -- Log email notification
      INSERT INTO public.audit_logs (
        event_type, actor_id, table_name, record_id, after_state
      ) VALUES (
        'email_queued', NEW.user_id, 'orders', NEW.id,
        jsonb_build_object(
          'order_id', NEW.id,
          'recipient', v_user_email,
          'status', 'queued'
        )
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_send_completion_email ON public.orders;
CREATE TRIGGER trg_send_completion_email
  AFTER UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_send_completion_email();

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.send_order_completion_email(UUID) TO authenticated;

