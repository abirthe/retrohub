-- Migration: 20261014030000_update_clean_rental_descriptions.sql
-- Description: Sets clean, rich game lists for rental accounts with no "FIRST LOGIN" text

UPDATE public.products
SET description = E'### 🎮 INCLUDED GAMES\n1. Assassin''s Creed: Black Flag Resynced\n\n### ⏱️ RENTAL DURATION\n- Full Access During Selected Duration\n\n### 📋 HOW IT WORKS\n1. Place order for rental duration\n2. Receive Xbox console account credentials\n3. Enjoy your games'
WHERE title ILIKE 'Xbox Game Account Rent - Account 1%';

UPDATE public.products
SET description = E'### 🎮 INCLUDED GAMES\n1. 007 First Light: Deluxe Edition\n\n### ⏱️ RENTAL DURATION\n- Full Access During Selected Duration\n\n### 📋 HOW IT WORKS\n1. Place order for rental duration\n2. Receive Xbox console account credentials\n3. Enjoy your games'
WHERE title ILIKE 'Xbox Game Account Rent - Account 2%';

UPDATE public.products
SET description = E'### 🎮 INCLUDED GAMES\n1. Battlefield 6\n2. WWE 2K23\n3. Just Cause 3\n\n### ⏱️ RENTAL DURATION\n- Full Access During Selected Duration\n\n### 📋 HOW IT WORKS\n1. Place order for rental duration\n2. Receive Xbox console account credentials\n3. Enjoy your games'
WHERE title ILIKE 'Xbox Game Account Rent - Account 3%';

UPDATE public.products
SET description = E'### 🎮 INCLUDED GAMES (14 Titles)\n1. Forza Horizon 5 Premium Edition\n2. EA Sports FC 26\n3. Mortal Kombat 1 + Khaos Reigns Kollection\n4. Call of Duty: Black Ops 4\n5. Call of Duty: Black Ops Cold War\n6. Bleach Rebirth of Souls\n7. NBA 2K22\n8. Mortal Kombat 11 Ultimate + All DLCs\n9. Dragon Ball Sparking! Zero\n10. Tom Clancy''s Rainbow Six Siege X\n11. Tony Hawk''s Pro Skater 1+2\n12. Need for Speed Hot Pursuit\n13. Gas Station Simulator\n14. Barn Finders\n\n### ⏱️ RENTAL DURATION\n- Full Access During Selected Duration\n\n### 📋 HOW IT WORKS\n1. Place order for rental duration\n2. Receive Xbox console account credentials\n3. Enjoy your games'
WHERE title ILIKE 'Xbox Game Account Rent - Account 4%';

UPDATE public.products
SET description = E'### 🎮 INCLUDED GAMES (44 Titles)\n1. Assassin''s Creed Revelations\n2. Assassin''s Creed IV Black Flag\n3. Assassin''s Creed Rogue Remastered\n4. Assassin''s Creed Unity\n5. Assassin''s Creed Syndicate\n6. Assassin''s Creed Origins\n7. Assassin''s Creed Odyssey\n8. Assassin''s Creed Valhalla\n9. Assassin''s Creed Mirage\n10. Assassin''s Creed Chronicles China\n11. Assassin''s Creed Chronicles India\n12. Assassin''s Creed Chronicles Russia\n13. A Way Out\n14. Batman Arkham Knight\n15. Batman Arkham City\n16. Batman Arkham Asylum\n17. Battlefield 1\n18. Battlefield 4\n19. Call of Duty: Advanced Warfare\n20. Cities Skylines Xbox One Edition\n21. Cities Skylines Remastered\n22. The Crew 2\n23. Dead Island Definitive Edition\n24. Far Cry 3\n25. Far Cry 4\n26. Far Cry 5\n27. Far Cry 6\n28. Fallout 3\n29. Grand Theft Auto V (GTA 5)\n30. Injustice 2\n31. Metro Exodus\n32. Minecraft Legends\n33. Mortal Kombat X\n34. Need for Speed (2015)\n35. Need for Speed Heat\n36. Plants vs. Zombies Garden Warfare 2\n37. Prey\n38. Red Dead Redemption 2\n39. Sleeping Dogs Definitive Edition\n40. Tom Clancy''s Ghost Recon Wildlands\n41. Unravel\n42. The Witcher 3: Wild Hunt\n43. Mad Max\n44. Grand Theft Auto IV (GTA 4)\n\n### ⏱️ RENTAL DURATION\n- Full Access During Selected Duration\n\n### 📋 HOW IT WORKS\n1. Place order for rental duration\n2. Receive Xbox console account credentials\n3. Enjoy your games'
WHERE title ILIKE 'Xbox Game Account Rent - Account 5%';

UPDATE public.products
SET description = E'### 🎮 INCLUDED GAMES\n1. Resident Evil 4 Remake\n\n### ⏱️ RENTAL DURATION\n- Full Access During Selected Duration\n\n### 📋 HOW IT WORKS\n1. Place order for rental duration\n2. Receive Xbox console account credentials\n3. Enjoy your games'
WHERE title ILIKE 'Xbox Game Account Rent - Account 6%';
