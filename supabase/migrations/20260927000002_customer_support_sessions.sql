-- Migration to support Customer Support Bot Sessions and Triage State Machine
CREATE TABLE IF NOT EXISTS public.customer_support_sessions (
    chat_id BIGINT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT,
    first_name TEXT,
    last_name TEXT,
    state TEXT NOT NULL DEFAULT 'bot_active', -- 'bot_active' | 'escalated' | 'agent_active'
    last_order_id TEXT,
    sentiment_score NUMERIC DEFAULT 0,
    recent_messages JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    escalated_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quickly fetching escalated sessions
CREATE INDEX IF NOT EXISTS idx_support_sessions_state ON public.customer_support_sessions(state);
CREATE INDEX IF NOT EXISTS idx_support_sessions_order_id ON public.customer_support_sessions(last_order_id);

-- Enable RLS
ALTER TABLE public.customer_support_sessions ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
DROP POLICY IF EXISTS "Service role has full access to support sessions" ON public.customer_support_sessions;
CREATE POLICY "Service role has full access to support sessions" ON public.customer_support_sessions
    FOR ALL USING (true) WITH CHECK (true);
