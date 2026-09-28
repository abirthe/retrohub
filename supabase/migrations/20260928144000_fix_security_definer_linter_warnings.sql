-- Revoke execute from public/anon/authenticated for internal security definer functions

-- 1. acquire_chat_queue_lock
REVOKE EXECUTE ON FUNCTION public.acquire_chat_queue_lock(bigint, integer) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.acquire_chat_queue_lock(bigint, integer) FROM anon;
REVOKE EXECUTE ON FUNCTION public.acquire_chat_queue_lock(bigint, integer) FROM authenticated;

-- 2. kill_customer_session
REVOKE EXECUTE ON FUNCTION public.kill_customer_session(bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.kill_customer_session(bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.kill_customer_session(bigint) FROM authenticated;

-- 3. release_chat_queue_lock
REVOKE EXECUTE ON FUNCTION public.release_chat_queue_lock(bigint) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.release_chat_queue_lock(bigint) FROM anon;
REVOKE EXECUTE ON FUNCTION public.release_chat_queue_lock(bigint) FROM authenticated;