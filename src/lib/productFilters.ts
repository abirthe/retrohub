import type { Product } from '@/lib/shopApi';
import type { SortValue } from '@/lib/constants';

export interface FilterOptions {
  search: string;
  activeCategory: string;
  activeSubcategory: string;
  sort: SortValue;
}

/**
 * Resolves the primary semantic category of a product,
 * guarding against any data inconsistencies in the database.
 */
export function getProductEffectiveCategory(p: Product): string {
  const titleLower = p.title.toLowerCase();

  // 1. Account detection (Top priority so account-based products go strictly to Accounts)
  if (titleLower.includes('account')) {
    return 'accounts';
  }

  // 2. Gift card / Wallet detection
  const isGiftCardText =
    titleLower.includes('gift card') ||
    titleLower.includes('giftcard') ||
    titleLower.includes('wallet') ||
    titleLower.includes('gift code') ||
    titleLower.includes('eshop') ||
    titleLower.includes('itunes') ||
    titleLower.includes('riot access') ||
    titleLower.includes('playstation store gift');

  if (isGiftCardText || p.category === 'giftcard') {
    // Distinguish games delivered as Steam Gift from actual currency gift cards
    const isSteamGiftGame =
      titleLower.includes('steam gift') &&
      !titleLower.includes('steam gift card') &&
      !titleLower.includes('steam gift code') &&
      !titleLower.includes('wallet');

    if (!isSteamGiftGame) {
      return 'giftcard';
    }
  }

  // 3. Subscription detection
  const isSubText =
    titleLower.includes('subscription') ||
    titleLower.includes('game pass') ||
    titleLower.includes('gamepass') ||
    titleLower.includes('monthly pass') ||
    titleLower.includes('ps plus') ||
    titleLower.includes('playstation plus') ||
    titleLower.includes('ea play') ||
    titleLower.includes('netflix') ||
    titleLower.includes('spotify') ||
    titleLower.includes('discord nitro') ||
    titleLower.includes('youtube premium') ||
    titleLower.includes('crunchyroll');

  if (p.category === 'subscription' || (isSubText && p.category !== 'software')) {
    return 'subscription';
  }

  // 4. Software
  if (p.category === 'software') {
    return 'software';
  }

  // 5. Top-up
  if (p.category === 'topup') {
    return 'topup';
  }

  // 6. Games (pc_game, xbox_game, ps_game)
  if (['pc_game', 'xbox_game', 'ps_game'].includes(p.category)) {
    return 'games';
  }

  return p.category || 'games';
}

export function filterAndGroupProducts(products: Product[] | undefined, options: FilterOptions): Product[] {
  if (!products) return [];

  const { search, activeCategory, activeSubcategory, sort } = options;

  // Deduplicate products by base name (for variants like "Product | 1 Month", "Product | 3 Month")
  // Deduplicate products by base name (and pick the lowest price variant for display)
  const groupedProducts = products.reduce((acc, curr) => {
    const baseName = curr.title.split(' | ')[0];
    const existingIndex = acc.findIndex((p) => p.title.split(' | ')[0] === baseName);
    if (existingIndex === -1) {
      acc.push(curr);
    } else if (Number(curr.sale_price) < Number(acc[existingIndex].sale_price)) {
      acc[existingIndex] = curr;
    }
    return acc;
  }, [] as Product[]);

  return groupedProducts
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.platform?.toLowerCase().includes(search.toLowerCase()) ?? false);

      const titleLower = p.title.toLowerCase();
      const platLower = p.platform?.toLowerCase() || '';
      const effCategory = getProductEffectiveCategory(p);

      let matchesCategory = false;

      if (activeCategory === 'all') {
        matchesCategory = true;
      } else if (activeCategory === 'games') {
        // Must be a game (not giftcard, subscription, account, or topup)
        if (effCategory !== 'games') {
          return false;
        }

        if (activeSubcategory) {
          if (activeSubcategory === 'games_xbox') {
            matchesCategory = p.category === 'xbox_game' || titleLower.includes('xbox') || platLower.includes('xbox');
          } else if (activeSubcategory === 'games_ps') {
            matchesCategory =
              p.category === 'ps_game' ||
              titleLower.includes('playstation') ||
              titleLower.includes('ps4') ||
              titleLower.includes('ps5') ||
              platLower.includes('playstation');
          } else if (activeSubcategory === 'games_steam') {
            matchesCategory =
              (p.category === 'pc_game' && (titleLower.includes('steam') || platLower.includes('steam'))) ||
              platLower === 'steam' ||
              titleLower.includes('steam');
          } else if (activeSubcategory === 'games_gog') {
            matchesCategory = titleLower.includes('gog') || platLower.includes('gog');
          } else if (activeSubcategory === 'games_others') {
            matchesCategory =
              !titleLower.includes('xbox') &&
              !platLower.includes('xbox') &&
              !titleLower.includes('playstation') &&
              !titleLower.includes('ps4') &&
              !titleLower.includes('ps5') &&
              !platLower.includes('playstation') &&
              !titleLower.includes('steam') &&
              !platLower.includes('steam') &&
              !titleLower.includes('gog') &&
              !platLower.includes('gog');
          }
        } else {
          matchesCategory = true;
        }
      } else if (activeCategory === 'giftcard') {
        if (effCategory !== 'giftcard') {
          return false;
        }

        if (activeSubcategory) {
          if (activeSubcategory === 'giftcard_xbox') {
            matchesCategory = titleLower.includes('xbox') || platLower.includes('xbox');
          } else if (activeSubcategory === 'giftcard_steam') {
            matchesCategory = titleLower.includes('steam') || platLower.includes('steam');
          } else if (activeSubcategory === 'giftcard_ps') {
            matchesCategory =
              titleLower.includes('playstation') ||
              titleLower.includes('psn') ||
              platLower.includes('playstation');
          } else if (activeSubcategory === 'giftcard_others') {
            matchesCategory =
              !titleLower.includes('xbox') &&
              !platLower.includes('xbox') &&
              !titleLower.includes('steam') &&
              !platLower.includes('steam') &&
              !titleLower.includes('playstation') &&
              !titleLower.includes('psn') &&
              !platLower.includes('playstation');
          }
        } else {
          matchesCategory = true;
        }
      } else if (activeCategory === 'subscription') {
        if (effCategory !== 'subscription') {
          return false;
        }

        if (activeSubcategory) {
          if (activeSubcategory === 'sub_gamepass') {
            matchesCategory = titleLower.includes('game pass') || titleLower.includes('gamepass');
          } else if (activeSubcategory === 'sub_psn') {
            matchesCategory =
              titleLower.includes('psn') ||
              titleLower.includes('playstation plus') ||
              titleLower.includes('ps plus');
          } else if (activeSubcategory === 'sub_ea') {
            matchesCategory = titleLower.includes('ea play') || /\\bea\\b/.test(titleLower);
          } else if (activeSubcategory === 'sub_others') {
            matchesCategory =
              !titleLower.includes('game pass') &&
              !titleLower.includes('gamepass') &&
              !titleLower.includes('psn') &&
              !titleLower.includes('playstation plus') &&
              !titleLower.includes('ps plus') &&
              !titleLower.includes('ea play') &&
              !/\\bea\\b/.test(titleLower);
          }
        } else {
          matchesCategory = true;
        }
      } else if (activeCategory === 'accounts') {
        if (effCategory !== 'accounts' && !titleLower.includes('account')) {
          return false;
        }

        if (activeSubcategory) {
          if (activeSubcategory === 'accounts_games') {
            matchesCategory = ['pc_game', 'xbox_game', 'ps_game'].includes(p.category);
          } else if (activeSubcategory === 'accounts_app') {
            matchesCategory = p.category === 'software';
          } else if (activeSubcategory === 'accounts_others') {
            matchesCategory = !['pc_game', 'xbox_game', 'ps_game', 'software'].includes(p.category);
          }
        } else {
          matchesCategory = true;
        }
      } else if (activeCategory === 'custom_orders') {
        matchesCategory = false;
      } else {
        matchesCategory = effCategory === activeCategory || p.category === activeCategory;
      }

      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sort === 'price_asc') return a.sale_price - b.sale_price;
      if (sort === 'price_desc') return b.sale_price - a.sale_price;
      if (sort === 'name_asc') return a.title.localeCompare(b.title);
      return 0;
    });
}
