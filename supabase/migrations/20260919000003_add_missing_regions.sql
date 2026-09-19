-- Add missing regions to region_tag ENUM

ALTER TYPE public.region_tag ADD VALUE IF NOT EXISTS 'AR'; -- Argentina
ALTER TYPE public.region_tag ADD VALUE IF NOT EXISTS 'CO'; -- Colombia
ALTER TYPE public.region_tag ADD VALUE IF NOT EXISTS 'CL'; -- Chile
ALTER TYPE public.region_tag ADD VALUE IF NOT EXISTS 'PE'; -- Peru
ALTER TYPE public.region_tag ADD VALUE IF NOT EXISTS 'EG'; -- Egypt
ALTER TYPE public.region_tag ADD VALUE IF NOT EXISTS 'NG'; -- Nigeria
ALTER TYPE public.region_tag ADD VALUE IF NOT EXISTS 'PK'; -- Pakistan
ALTER TYPE public.region_tag ADD VALUE IF NOT EXISTS 'BD'; -- Bangladesh
