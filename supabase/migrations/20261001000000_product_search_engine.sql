-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create an alias table for expanding common abbreviations
CREATE TABLE IF NOT EXISTS public.search_aliases (
    id SERIAL PRIMARY KEY,
    alias TEXT NOT NULL UNIQUE,
    expansion TEXT NOT NULL
);

-- Insert common aliases
INSERT INTO public.search_aliases (alias, expansion) VALUES
    ('gtav', 'GTA 5'),
    ('gta v', 'GTA 5'),
    ('gta5', 'GTA 5'),
    ('vp', 'Valorant Points'),
    ('valo', 'Valorant'),
    ('fc25', 'EA FC 25'),
    ('fifa25', 'EA FC 25'),
    ('fifa 25', 'EA FC 25'),
    ('uc', 'PUBG Mobile UC'),
    ('pubg', 'PUBG Mobile'),
    ('mlbb', 'Mobile Legends'),
    ('genshin', 'Genshin Impact')
ON CONFLICT (alias) DO NOTHING;

-- Create a robust search function
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
            similarity(lower(p.title), expanded_query),
            similarity(lower(p.platform), expanded_query)
        ) AS relevance
    FROM public.products p
    WHERE p.is_active = true
      AND (
        p.title ILIKE '%' || expanded_query || '%' OR
        p.platform ILIKE '%' || expanded_query || '%' OR
        similarity(lower(p.title), expanded_query) > 0.15 OR
        similarity(lower(p.platform), expanded_query) > 0.15
      )
    ORDER BY relevance DESC, p.in_stock DESC, p.title ASC
    LIMIT max_results;
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.product_search(TEXT, INT) TO anon, authenticated, service_role;
