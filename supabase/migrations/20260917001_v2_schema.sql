-- =============================================================================
-- RetroHub v2 Schema Migration (PART 1: ENUMS)
-- =============================================================================
-- IMPORTANT: Run this file completely FIRST, then run the second file.
-- Postgres requires new enum values to be committed before they can be used.

-- We use plain ALTER TYPE commands (no DO blocks) to avoid transaction issues.
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'payment_submitted' AFTER 'pending';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'payment_verified' AFTER 'payment_submitted';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'sourcing' AFTER 'payment_verified';
ALTER TYPE public.order_status ADD VALUE IF NOT EXISTS 'fulfilled' AFTER 'sourcing';
