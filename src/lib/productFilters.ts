import type { Product } from '@/lib/shopApi';
import type { SortValue } from '@/lib/constants';

export interface FilterOptions {
  search: string;
  activeCategory: string;
  activeSubcategory: string;
  sort: SortValue;
}

export function isOtherAccountProduct(_titleLower: string): boolean {
  return false;
}



/**
 * Resolves the primary semantic category of a product,
 * guarding against any data inconsistencies in the database.
 */
export function getProductEffectiveCategory(p: Product): string {
  const titleLower = p.title.toLowerCase();

  // 1. Gift card / Wallet detection
  const isGiftCardText =
    titleLower.includes('gift card') ||
    titleLower.includes('giftcard') ||
    titleLower.includes('wallet') ||
    titleLower.includes('gift code') ||
    titleLower.includes('eshop card') ||
    titleLower.includes('eshop gift') ||
    titleLower.includes('itunes') ||
    titleLower.includes('riot access') ||
    titleLower.includes('playstation store gift');

  if (p.category === 'giftcard' || isGiftCardText) {
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

  // 2. Top-up / Coin / Social detection
  if (p.category === 'topup') {
    return 'topup';
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
    titleLower.includes('discord nitro') ||
    titleLower.includes('youtube premium') ||
    titleLower.includes('crunchyroll');

  if (p.category === 'subscription' || (isSubText && p.category !== 'software' && p.category !== 'service' && !titleLower.includes('account'))) {
    return 'subscription';
  }

  // 4. Service & Software
  const isServiceText =
    titleLower.includes('activation service') ||
    titleLower.includes('registration service') ||
    titleLower.includes('digital service') ||
    titleLower.includes('setup service') ||
    titleLower.includes('register a steam account') ||
    titleLower.includes('(registration)') ||
    titleLower.includes('new steam account') ||
    titleLower.includes('steam account kazakhstan') ||
    titleLower.includes('new account steam') ||
    titleLower.includes('new psn account') ||
    titleLower.includes('new turkish psn');

  if (p.category === 'service' || p.category === 'software' || isServiceText) {
    return 'service';
  }

  // 5. Account detection (strictly game accounts; ignore keys/codes that mention "full access")
  // Note: uses regex word boundaries so "Turkey" does not match "key"
  const isKey = /\b(key|keys|code|codes|cdkey)\b/i.test(titleLower) && !titleLower.endsWith('account');
  const isGameAccount =
    ['pc_game', 'xbox_game', 'ps_game'].includes(p.category) ||
    titleLower.includes('psn') ||
    titleLower.includes('playstation') ||
    titleLower.includes('xbox') ||
    titleLower.includes('steam') ||
    titleLower.includes('minecraft') ||
    titleLower.includes('ubisoft') ||
    titleLower.includes('nintendo');

  if (
    !isKey &&
    isGameAccount &&
    (titleLower.includes('account') || titleLower.includes('login') || (titleLower.includes('full access') && !/\b(key|keys)\b/i.test(titleLower)))
  ) {
    return 'accounts';
  }

  // 6. Games (pc_game, xbox_game, ps_game)
  if (['pc_game', 'xbox_game', 'ps_game'].includes(p.category)) {
    return 'games';
  }

  return p.category || 'games';
}

/**
 * Resolves the primary subcategory for a product within its category.
 * Every product within a category belongs to AT MOST one subcategory.
 */
export function getProductEffectiveSubcategory(p: Product, effCategory: string): string | null {
  const titleLower = p.title.toLowerCase();
  const platLower = p.platform?.toLowerCase() || '';

  if (effCategory === 'games') {
    // 1. Xbox
    if (
      p.category === 'xbox_game' ||
      platLower.includes('xbox') ||
      titleLower.includes('xbox')
    ) {
      return 'games_xbox';
    }

    // 2. PlayStation
    if (
      p.category === 'ps_game' ||
      platLower.includes('playstation') ||
      platLower.includes('psn') ||
      platLower.includes('ps4') ||
      platLower.includes('ps5') ||
      titleLower.includes('playstation') ||
      titleLower.includes('psn') ||
      titleLower.includes('ps4') ||
      titleLower.includes('ps5')
    ) {
      return 'games_ps';
    }

    // 3. Steam
    if (platLower.includes('steam') || titleLower.includes('steam')) {
      return 'games_steam';
    }

    // 4. GOG
    if (platLower.includes('gog') || titleLower.includes('gog')) {
      return 'games_gog';
    }

    // 5. Others (Epic Games, Ubisoft Connect, EA App, Battle.net, etc.)
    return 'games_others';
  }

  if (effCategory === 'giftcard') {
    if (platLower.includes('xbox') || titleLower.includes('xbox')) {
      return 'giftcard_xbox';
    }
    if (platLower.includes('steam') || titleLower.includes('steam') || titleLower.includes('wallet')) {
      return 'giftcard_steam';
    }
    if (
      platLower.includes('playstation') ||
      platLower.includes('psn') ||
      titleLower.includes('playstation') ||
      titleLower.includes('psn')
    ) {
      return 'giftcard_ps';
    }
    if (platLower.includes('nintendo') || titleLower.includes('nintendo') || titleLower.includes('eshop')) {
      return 'giftcard_nintendo';
    }
    return 'giftcard_others';
  }

  if (effCategory === 'subscription') {
    if (titleLower.includes('game pass') || titleLower.includes('gamepass')) {
      return 'sub_gamepass';
    }
    if (
      titleLower.includes('ps plus') ||
      titleLower.includes('playstation plus') ||
      titleLower.includes('psn')
    ) {
      return 'sub_psn';
    }
    if (titleLower.includes('ea play') || /\bea\b/i.test(titleLower)) {
      return 'sub_ea';
    }
    return 'sub_others';
  }

  return null;
}

export function filterAndGroupProducts(products: Product[] | undefined, options: FilterOptions): Product[] {
  if (!products) return [];

  const { search, activeCategory, activeSubcategory, sort } = options;

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

      const effCategory = getProductEffectiveCategory(p);

      let matchesCategory = false;

      if (activeCategory === 'all') {
        matchesCategory = true;
      } else if (activeCategory === 'custom_orders') {
        matchesCategory = false;
      } else {
        // STRICT 1-TO-1 PRIMARY CATEGORY MATCH
        if (effCategory !== activeCategory) {
          return false;
        }

        // STRICT 1-TO-1 SUBCATEGORY MATCH
        if (activeSubcategory) {
          const effSubcategory = getProductEffectiveSubcategory(p, effCategory);
          matchesCategory = effSubcategory === activeSubcategory;
        } else {
          matchesCategory = true;
        }
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
