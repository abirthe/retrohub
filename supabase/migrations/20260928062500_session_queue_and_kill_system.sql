-- Migration: Session Queue Lock & Kill Session System
-- Purpose: Prevent bot struggling on multiple queued messages, provide atomic chat locks, and allow instant session termination.

-- 1. Atomic Chat Queue Lock
CREATE OR REPLACE FUNCTION public.acquire_chat_queue_lock(
    p_chat_id BIGINT,
    p_lock_duration_ms INT DEFAULT 4000
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_locked_until TIMESTAMPTZ;
    v_now TIMESTAMPTZ := clock_timestamp();
    v_new_lock TIMESTAMPTZ := v_now + (p_lock_duration_ms || ' milliseconds')::INTERVAL;
BEGIN
    -- Check current lock with row locking
    SELECT (metadata->>'locked_until')::TIMESTAMPTZ INTO v_locked_until
    FROM customer_support_sessions
    WHERE chat_id = p_chat_id
    FOR UPDATE;

    -- If a lock is active and hasn't expired yet, reject concurrent execution
    IF FOUND AND v_locked_until IS NOT NULL AND v_locked_until > v_now THEN
        RETURN FALSE;
    END IF;

    -- Either row doesn't exist, has no lock, or lock expired: update lock
    IF FOUND THEN
        UPDATE customer_support_sessions
        SET metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{locked_until}',
            to_jsonb(v_new_lock)
        ),
        updated_at = v_now
        WHERE chat_id = p_chat_id;
    END IF;

    RETURN TRUE;
END;
$$;

-- 2. Release Chat Queue Lock
CREATE OR REPLACE FUNCTION public.release_chat_queue_lock(p_chat_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE customer_support_sessions
    SET metadata = COALESCE(metadata, '{}'::jsonb) - 'locked_until',
        updated_at = clock_timestamp()
    WHERE chat_id = p_chat_id;
END;
$$;

-- 3. Kill / Terminate Customer Session
CREATE OR REPLACE FUNCTION public.kill_customer_session(p_chat_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE customer_support_sessions
    SET state = 'bot_active',
        recent_messages = '[]'::jsonb,
        last_order_id = NULL,
        sentiment_score = 0,
        escalated_at = NULL,
        resolved_at = clock_timestamp(),
        metadata = '{}'::jsonb,
        updated_at = clock_timestamp()
    WHERE chat_id = p_chat_id;
END;
$$;
