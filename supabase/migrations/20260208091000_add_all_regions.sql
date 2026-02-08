-- Add all regions to region_tag enum
-- This migration adds comprehensive regional coverage

-- Note: PostgreSQL enum values can only be added, not removed
-- We add all major regions for global coverage

-- Add new region values to the enum
DO $$ 
BEGIN
  -- Add regions if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'UK' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'UK';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'CA'; -- Canada
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MX' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'MX'; -- Mexico
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'BR' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'BR'; -- Brazil
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'IN' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'IN'; -- India
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'CN' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'CN'; -- China
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'JP' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'JP'; -- Japan
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'KR' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'KR'; -- South Korea
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AU' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'AU'; -- Australia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'NZ' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'NZ'; -- New Zealand
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ME' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'ME'; -- Middle East
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AFRICA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'AFRICA';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'OCEANIA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'OCEANIA';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'AE' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'AE'; -- UAE
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'SA'; -- Saudi Arabia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ZA' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'ZA'; -- South Africa
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'RU' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'RU'; -- Russia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TR' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'TR'; -- Turkey
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SG' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'SG'; -- Singapore
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'MY' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'MY'; -- Malaysia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'TH' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'TH'; -- Thailand
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'ID' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'ID'; -- Indonesia
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PH' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'PH'; -- Philippines
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'VN' AND enumtypid = 'region_tag'::regtype) THEN
    ALTER TYPE public.region_tag ADD VALUE 'VN'; -- Vietnam
  END IF;
END $$;

