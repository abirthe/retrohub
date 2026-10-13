-- Migration: 20261014020000_remove_first_login_from_rental_descriptions.sql
-- Description: Removes "FIRST LOGIN, THEN PAYMENT" notices and policies from rental product descriptions

UPDATE public.products
SET description = regexp_replace(
  regexp_replace(
    regexp_replace(
      description,
      E'\\*FIRST LOGIN, THEN PAYMENT\\.?\\s*\\n?',
      '',
      'gi'
    ),
    E'### 🛡️ RENTAL POLICY\\s*\\n?',
    '',
    'gi'
  ),
  E'✅ Verify credentials on your Xbox console first\\.\\s*\\n?✅ Test games and download before completing payment\\.\\s*\\n*\\n?',
  '',
  'gi'
)
WHERE (category = 'rent' OR title ILIKE 'Xbox Game Account Rent%') AND description IS NOT NULL;

-- Also update step 4 in how it works to avoid referencing payment completion after login
UPDATE public.products
SET description = replace(
  description,
  'Complete payment to activate your',
  'Enjoy full access for your'
)
WHERE (category = 'rent' OR title ILIKE 'Xbox Game Account Rent%') AND description IS NOT NULL;
