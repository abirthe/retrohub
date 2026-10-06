-- Migration: Telegram Support Bot Hardening and Session Message Locking
-- Creates processed updates table for update_id deduplication / idempotency
-- and atomic row-locked message append RPC.

CREATE TABLE IF NOT EXISTS public.telegram_processed_updates (
  update_id BIGINT PRIMARY KEY,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for pruning old updates periodically if desired
CREATE INDEX IF NOT EXISTS idx_telegram_processed_updates_at 
  ON public.telegram_processed_updates(processed_at);

-- Row-locking atomic message appending to customer support sessions
CREATE OR REPLACE FUNCTION public.append_session_message(
  p_chat_id BIGINT,
  p_message JSONB,
  p_max_messages INT DEFAULT 8
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_combined JSONB;
  v_len INT;
BEGIN
  SELECT COALESCE(recent_messages, '[]'::jsonb) || jsonb_build_array(p_message)
    INTO v_combined
    FROM public.customer_support_sessions
    WHERE chat_id = p_chat_id
    FOR UPDATE;

  v_len := jsonb_array_length(v_combined);

  UPDATE public.customer_support_sessions
  SET recent_messages = (
        SELECT jsonb_agg(value ORDER BY ord)
        FROM jsonb_array_elements(v_combined) WITH ORDINALITY AS t(value, ord)
        WHERE ord > GREATEST(v_len - p_max_messages, 0)
      ),
      updated_at = NOW()
  WHERE chat_id = p_chat_id;
END;
$$;
