import type { Product } from '@/lib/shopApi';
import type { SortValue } from '@/lib/constants';

export interface FilterOptions {
  search: string;
  activeCategory: string;
  activeSubcategory: string;
  sort: SortValue;
}

export function filterAndGroupProducts(products: Product[] | undefined, options: FilterOptions): Product[] {
  if (!products) return [];

  const { search, activeCategory, activeSubcategory, sort } = options;

  // Filter base products
  const filteredBaseProducts = products.filter((p) => {
    if (p.title.includes(' | ')) {
      return true;
    }
    return true;
  });

  // Deduplicate products by base name
  const groupedProducts = filteredBaseProducts.reduce((acc, curr) => {
    const baseName = curr.title.split(' | ')[0];
    if (!acc.find((p) => p.title.split(' | ')[0] === baseName)) {
      acc.push(curr);
    }
    return acc;
  }, [] as Product[]);

  return groupedProducts
    .filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        (p.platform?.toLowerCase().includes(search.toLowerCase()) ?? false);

      let matchesCategory = false;
      const titleLower = p.title.toLowerCase();
      const platLower = p.platform?.toLowerCase() || '';

      if (activeCategory === 'all') {
        matchesCategory = true;
      } else if (activeCategory === 'games') {
        if (activeSubcategory) {
          if (activeSubcategory === 'games_xbox')
            matchesCategory = p.category === 'xbox_game' || titleLower.includes('xbox') || platLower.includes('xbox');
          else if (activeSubcategory === 'games_ps')
            matchesCategory =
              p.category === 'ps_game' ||
              titleLower.includes('playstation') ||
              titleLower.includes('ps4') ||
              titleLower.includes('ps5') ||
              platLower.includes('playstation');
          else if (activeSubcategory === 'games_steam')
            matchesCategory =
              (p.category === 'pc_game' && (titleLower.includes('steam') || platLower.includes('steam'))) ||
              platLower === 'steam';
          else if (activeSubcategory === 'games_gog')
            matchesCategory =
              (p.category === 'pc_game' && (titleLower.includes('gog') || platLower.includes('gog'))) ||
              platLower === 'gog';
          else if (activeSubcategory === 'games_others')
            matchesCategory =
              ['pc_game', 'xbox_game', 'ps_game'].includes(p.category) &&
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
        } else {
          matchesCategory = ['pc_game', 'xbox_game', 'ps_game'].includes(p.category);
        }
      } else if (activeCategory === 'accounts') {
        if (activeSubcategory) {
          if (activeSubcategory === 'accounts_games')
            matchesCategory = titleLower.includes('account') && ['pc_game', 'xbox_game', 'ps_game'].includes(p.category);
          else if (activeSubcategory === 'accounts_app')
            matchesCategory = titleLower.includes('account') && p.category === 'software';
          else if (activeSubcategory === 'accounts_others')
            matchesCategory =
              titleLower.includes('account') && !['pc_game', 'xbox_game', 'ps_game', 'software'].includes(p.category);
        } else {
          matchesCategory = titleLower.includes('account');
        }
      } else if (activeCategory === 'giftcard') {
        if (activeSubcategory) {
          if (activeSubcategory === 'giftcard_xbox')
            matchesCategory = p.category === 'giftcard' && (titleLower.includes('xbox') || platLower.includes('xbox'));
          else if (activeSubcategory === 'giftcard_steam')
            matchesCategory = p.category === 'giftcard' && (titleLower.includes('steam') || platLower.includes('steam'));
          else if (activeSubcategory === 'giftcard_ps')
            matchesCategory =
              p.category === 'giftcard' &&
              (titleLower.includes('playstation') || titleLower.includes('psn') || platLower.includes('playstation'));
          else if (activeSubcategory === 'giftcard_others')
            matchesCategory =
              p.category === 'giftcard' &&
              !titleLower.includes('xbox') &&
              !titleLower.includes('steam') &&
              !titleLower.includes('playstation') &&
              !titleLower.includes('psn');
        } else {
          matchesCategory = p.category === 'giftcard';
        }
      } else if (activeCategory === 'subscription') {
        if (activeSubcategory) {
          if (activeSubcategory === 'sub_gamepass')
            matchesCategory = p.category === 'subscription' && (titleLower.includes('game pass') || titleLower.includes('gamepass'));
          else if (activeSubcategory === 'sub_psn')
            matchesCategory =
              p.category === 'subscription' &&
              (titleLower.includes('psn') || titleLower.includes('playstation plus') || titleLower.includes('ps plus'));
          else if (activeSubcategory === 'sub_ea')
            matchesCategory = p.category === 'subscription' && (titleLower.includes('ea play') || titleLower.includes('ea'));
          else if (activeSubcategory === 'sub_others')
            matchesCategory =
              p.category === 'subscription' &&
              !titleLower.includes('game pass') &&
              !titleLower.includes('gamepass') &&
              !titleLower.includes('psn') &&
              !titleLower.includes('playstation plus') &&
              !titleLower.includes('ps plus') &&
              !titleLower.includes('ea play') &&
              !titleLower.includes('ea');
        } else {
          matchesCategory = p.category === 'subscription';
        }
      } else if (activeCategory === 'custom_orders') {
        matchesCategory = false;
      } else {
        matchesCategory = p.category === activeCategory;
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
