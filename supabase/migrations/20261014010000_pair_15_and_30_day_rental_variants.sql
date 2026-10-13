-- ============================================================================
-- Migration: Add 15-day paired duration variants for Account 3, 4, 5, 6
-- Description: Pairs 15-day and 30-day rental tiers for all 6 accounts (like top-up options)
-- Date: 2026-10-14
-- ============================================================================

INSERT INTO public.products (
  title,
  category,
  delivery_type,
  platform,
  image_url,
  description,
  sale_price,
  cost_price,
  region,
  in_stock,
  is_active
)
VALUES
-- Account 3 (15 Days)
(
  'Xbox Game Account Rent - Account 3 (3 Games Bundle) | 15 Days',
  'rent',
  'instant_code',
  'Xbox',
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=800&auto=format&fit=crop&q=80',
  E'### 🛡️ RENTAL POLICY\n*FIRST LOGIN, THEN PAYMENT.\n✅ Verify credentials on your Xbox console first.\n✅ Test games and download before completing payment.\n\n### 🎮 INCLUDED GAMES\n1. Battlefield 6\n2. WWE 2K23\n3. Just Cause 3\n\n### ⏱️ RENTAL DURATION\n- 15 Days Full Access\n\n### 📋 HOW IT WORKS\n1. Place order or request login credentials\n2. Sign in to your Xbox console\n3. Confirm everything works smoothly\n4. Complete payment to activate your 15-day rental period',
  199.00,
  80.00,
  'GLOBAL',
  10,
  true
),
-- Account 4 (15 Days)
(
  'Xbox Game Account Rent - Account 4 (14 Games Mega Pack) | 15 Days',
  'rent',
  'instant_code',
  'Xbox',
  'https://images.unsplash.com/photo-1612287233207-6c9c642643a6?w=800&auto=format&fit=crop&q=80',
  E'### 🛡️ RENTAL POLICY\n*FIRST LOGIN, THEN PAYMENT.\n✅ Verify credentials on your Xbox console first.\n✅ Test games and download before completing payment.\n\n### 🎮 INCLUDED GAMES (14 Titles)\n1. Forza Horizon 5 Premium Edition\n2. EA Sports FC 26\n3. Mortal Kombat 1 + Khaos Reigns Kollection\n4. Call of Duty: Black Ops 4\n5. Call of Duty: Black Ops Cold War\n6. Bleach Rebirth of Souls\n7. NBA 2K22\n8. Mortal Kombat 11 Ultimate + All DLCs\n9. Dragon Ball Sparking! Zero\n10. Tom Clancy''s Rainbow Six Siege X\n11. Tony Hawk''s Pro Skater 1+2\n12. Need for Speed Hot Pursuit\n13. Gas Station Simulator\n14. Barn Finders\n\n### ⏱️ RENTAL DURATION\n- 15 Days Full Access\n\n### 📋 HOW IT WORKS\n1. Place order or request login credentials\n2. Sign in to your Xbox console\n3. Confirm everything works smoothly\n4. Complete payment to activate your 15-day rental period',
  199.00,
  80.00,
  'GLOBAL',
  10,
  true
),
-- Account 5 (15 Days)
(
  'Xbox Game Account Rent - Account 5 (44 Games Ultimate Vault) | 15 Days',
  'rent',
  'instant_code',
  'Xbox',
  'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
  E'### 🛡️ RENTAL POLICY\n*FIRST LOGIN, THEN PAYMENT.\n✅ Verify credentials on your Xbox console first.\n✅ Test games and download before completing payment.\n\n### 🎮 INCLUDED GAMES (44 Titles)\n1. Assassin''s Creed Revelations\n2. Assassin''s Creed IV Black Flag\n3. Assassin''s Creed Rogue Remastered\n4. Assassin''s Creed Unity\n5. Assassin''s Creed Syndicate\n6. Assassin''s Creed Origins\n7. Assassin''s Creed Odyssey\n8. Assassin''s Creed Valhalla\n9. Assassin''s Creed Mirage\n10. Assassin''s Creed Chronicles China\n11. Assassin''s Creed Chronicles India\n12. Assassin''s Creed Chronicles Russia\n13. A Way Out\n14. Batman Arkham Knight\n15. Batman Arkham City\n16. Batman Arkham Asylum\n17. Battlefield 1\n18. Battlefield 4\n19. Call of Duty: Advanced Warfare\n20. Cities Skylines Xbox One Edition\n21. Cities Skylines Remastered\n22. The Crew 2\n23. Dead Island Definitive Edition\n24. Far Cry 3\n25. Far Cry 4\n26. Far Cry 5\n27. Far Cry 6\n28. Fallout 3\n29. Grand Theft Auto V (GTA 5)\n30. Injustice 2\n31. Metro Exodus\n32. Minecraft Legends\n33. Mortal Kombat X\n34. Need for Speed (2015)\n35. Need for Speed Heat\n36. Plants vs. Zombies Garden Warfare 2\n37. Prey\n38. Red Dead Redemption 2\n39. Sleeping Dogs Definitive Edition\n40. Tom Clancy''s Ghost Recon Wildlands\n41. Unravel\n42. The Witcher 3: Wild Hunt\n43. Mad Max\n44. Grand Theft Auto IV (GTA 4)\n\n### ⏱️ RENTAL DURATION\n- 15 Days Full Access\n\n### 📋 HOW IT WORKS\n1. Place order or request login credentials\n2. Sign in to your Xbox console\n3. Confirm everything works smoothly\n4. Complete payment to activate your 15-day rental period',
  249.00,
  100.00,
  'GLOBAL',
  10,
  true
),
-- Account 6 (15 Days)
(
  'Xbox Game Account Rent - Account 6 (Resident Evil 4 Remake) | 15 Days',
  'rent',
  'instant_code',
  'Xbox',
  '/images/games/resident-evil-4.jpg',
  E'### 🛡️ RENTAL POLICY\n*FIRST LOGIN, THEN PAYMENT.\n✅ Verify credentials on your Xbox console first.\n✅ Test games and download before completing payment.\n\n### 🎮 INCLUDED GAMES\n1. Resident Evil 4 Remake\n\n### ⏱️ RENTAL DURATION\n- 15 Days Full Access\n\n### 📋 HOW IT WORKS\n1. Place order or request login credentials\n2. Sign in to your Xbox console\n3. Confirm everything works smoothly\n4. Complete payment to activate your 15-day rental period',
  199.00,
  80.00,
  'GLOBAL',
  10,
  true
)
ON CONFLICT (title) DO UPDATE SET
  category = EXCLUDED.category,
  delivery_type = EXCLUDED.delivery_type,
  platform = EXCLUDED.platform,
  image_url = EXCLUDED.image_url,
  description = EXCLUDED.description,
  sale_price = EXCLUDED.sale_price,
  cost_price = EXCLUDED.cost_price,
  region = EXCLUDED.region,
  in_stock = EXCLUDED.in_stock,
  is_active = EXCLUDED.is_active;
