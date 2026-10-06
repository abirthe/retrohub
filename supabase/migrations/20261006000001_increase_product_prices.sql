-- Migration: Increase all product sale prices by 50 BDT (~0.50 USD)
-- Date: 2026-10-06

UPDATE public.products
SET sale_price = ROUND(sale_price + 50.00, 2),
    updated_at = NOW();
