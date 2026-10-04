-- ================================================================
-- Migration: fix_product_search_and_pg_trgm_linter
-- Resolves Supabase Database Linter warnings:
-- 1. extension_in_public (0014_extension_in_public):
--    pg_trgm installed in public schema -> moved to extensions schema
-- 2. function_search_path_mutable (0011_function_search_path_mutable):
--    public.product_search has role mutable search_path -> set to public, extensions
-- ================================================================

-- 1. Ensure extensions schema exists and move pg_trgm extension out of public schema
CREATE SCHEMA IF NOT EXISTS extensions;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM pg_extension e 
        JOIN pg_namespace n ON e.extnamespace = n.oid 
        WHERE e.extname = 'pg_trgm' AND n.nspname = 'public'
    ) THEN
        ALTER EXTENSION pg_trgm SET SCHEMA extensions;
    ELSE
        CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;
    END IF;
END $$;

-- 2. Fix mutable search_path on public.product_search
CREATE OR REPLACE FUNCTION public.product_search(search_query TEXT, max_results INT DEFAULT 8)
RETURNS TABLE (
    id UUID,
    title VARCHAR(255),
    platform VARCHAR(100),
    in_stock INTEGER,
    sale_price DECIMAL(10,2),
    is_active BOOLEAN,
    relevance REAL
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, extensions
AS $$
DECLARE
    expanded_query TEXT := trim(lower(search_query));
    alias_rec RECORD;
BEGIN
    -- Apply alias expansion
    FOR alias_rec IN SELECT alias, expansion FROM public.search_aliases LOOP
        -- Expand if the query exactly matches the alias or if the alias is a distinct word in the query
        IF expanded_query = alias_rec.alias THEN
            expanded_query := lower(alias_rec.expansion);
        END IF;
    END LOOP;

    RETURN QUERY
    SELECT 
        p.id, 
        p.title, 
        p.platform, 
        p.in_stock, 
        p.sale_price, 
        p.is_active,
        GREATEST(
            extensions.similarity(lower(p.title), expanded_query),
            extensions.similarity(lower(p.platform), expanded_query),
            extensions.similarity(lower(p.category::text), expanded_query),
            extensions.similarity(lower(COALESCE(p.description, '')), expanded_query)
        ) AS relevance
    FROM public.products p
    WHERE p.is_active = true
      AND (
        p.title ILIKE '%' || expanded_query || '%' OR
        p.platform ILIKE '%' || expanded_query || '%' OR
        p.category::text ILIKE '%' || expanded_query || '%' OR
        p.description ILIKE '%' || expanded_query || '%' OR
        p.sale_price::text = expanded_query OR
        extensions.similarity(lower(p.title), expanded_query) > 0.15 OR
        extensions.similarity(lower(p.platform), expanded_query) > 0.15 OR
        extensions.similarity(lower(p.category::text), expanded_query) > 0.15
      )
    ORDER BY relevance DESC, p.in_stock DESC, p.title ASC
    LIMIT max_results;
END;
$$;

-- Retain execute grants
GRANT EXECUTE ON FUNCTION public.product_search(TEXT, INT) TO anon, authenticated, service_role;
