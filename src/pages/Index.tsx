import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import ShopHeader from '@/components/layout/ShopHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryFilter } from '@/components/home/CategoryFilter';
import { useProducts } from '@/hooks/useProducts';
import { CATEGORIES } from '@/lib/constants';
import type { SortValue } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const Index = () => {
  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [sort, setSort]                   = useState<SortValue>('newest');
  const [sortOpen, setSortOpen]           = useState(false);

  const [animatedPlaceholder, setAnimatedPlaceholder] = useState('');

  useEffect(() => {
    const text = "Search games, platforms, subscriptions...";
    let i = 0;
    let isDeleting = false;
    
    const interval = setInterval(() => {
      const currentText = text.substring(0, i);
      const showCursor = isDeleting ? true : (i % 2 === 0);
      
      setAnimatedPlaceholder(currentText + (showCursor ? "_" : ""));
      
      if (!isDeleting) {
        i++;
        if (i > text.length + 20) {
          isDeleting = true;
          i = text.length;
        }
      } else {
        i--;
        if (i < 0) {
          isDeleting = false;
          i = 0;
        }
      }
    }, 100);
    
    return () => clearInterval(interval);
  }, []);

  const { data: products, isLoading } = useProducts();

  const filteredBaseProducts = (products || [])
    .filter((p) => {
      // For Top-Ups, Subscriptions, Gift Cards, and Software, ONLY show the first variant as the "card"
      if (p.title.includes(' | ')) {
        return true;
      }
      return true;
    });

  // Deduplicate products by base name
  const groupedProducts = filteredBaseProducts.reduce((acc, curr) => {
    const baseName = curr.title.split(' | ')[0];
    if (!acc.find(p => p.title.split(' | ')[0] === baseName)) {
      acc.push(curr);
    }
    return acc;
  }, [] as typeof products);

  const filtered = (groupedProducts || [])
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
          if (activeSubcategory === 'games_xbox') matchesCategory = p.category === 'xbox_game' || titleLower.includes('xbox') || platLower.includes('xbox');
          else if (activeSubcategory === 'games_ps') matchesCategory = p.category === 'ps_game' || titleLower.includes('playstation') || titleLower.includes('ps4') || titleLower.includes('ps5') || platLower.includes('playstation');
          else if (activeSubcategory === 'games_steam') matchesCategory = (p.category === 'pc_game' && (titleLower.includes('steam') || platLower.includes('steam'))) || platLower === 'steam';
          else if (activeSubcategory === 'games_gog') matchesCategory = (p.category === 'pc_game' && (titleLower.includes('gog') || platLower.includes('gog'))) || platLower === 'gog';
          else if (activeSubcategory === 'games_others') matchesCategory = ['pc_game', 'xbox_game', 'ps_game'].includes(p.category) && !titleLower.includes('xbox') && !platLower.includes('xbox') && !titleLower.includes('playstation') && !titleLower.includes('ps4') && !titleLower.includes('ps5') && !platLower.includes('playstation') && !titleLower.includes('steam') && !platLower.includes('steam') && !titleLower.includes('gog') && !platLower.includes('gog');
        } else {
          matchesCategory = ['pc_game', 'xbox_game', 'ps_game'].includes(p.category);
        }
      } else if (activeCategory === 'accounts') {
        if (activeSubcategory) {
          if (activeSubcategory === 'accounts_games') matchesCategory = titleLower.includes('account') && ['pc_game', 'xbox_game', 'ps_game'].includes(p.category);
          else if (activeSubcategory === 'accounts_app') matchesCategory = titleLower.includes('account') && p.category === 'software';
          else if (activeSubcategory === 'accounts_others') matchesCategory = titleLower.includes('account') && !['pc_game', 'xbox_game', 'ps_game', 'software'].includes(p.category);
        } else {
          matchesCategory = titleLower.includes('account');
        }
      } else if (activeCategory === 'giftcard') {
        if (activeSubcategory) {
          if (activeSubcategory === 'giftcard_xbox') matchesCategory = p.category === 'giftcard' && (titleLower.includes('xbox') || platLower.includes('xbox'));
          else if (activeSubcategory === 'giftcard_steam') matchesCategory = p.category === 'giftcard' && (titleLower.includes('steam') || platLower.includes('steam'));
          else if (activeSubcategory === 'giftcard_ps') matchesCategory = p.category === 'giftcard' && (titleLower.includes('playstation') || titleLower.includes('psn') || platLower.includes('playstation'));
          else if (activeSubcategory === 'giftcard_others') matchesCategory = p.category === 'giftcard' && !titleLower.includes('xbox') && !titleLower.includes('steam') && !titleLower.includes('playstation') && !titleLower.includes('psn');
        } else {
          matchesCategory = p.category === 'giftcard';
        }
      } else if (activeCategory === 'subscription') {
        if (activeSubcategory) {
          if (activeSubcategory === 'sub_gamepass') matchesCategory = p.category === 'subscription' && (titleLower.includes('game pass') || titleLower.includes('gamepass'));
          else if (activeSubcategory === 'sub_psn') matchesCategory = p.category === 'subscription' && (titleLower.includes('psn') || titleLower.includes('playstation plus') || titleLower.includes('ps plus'));
          else if (activeSubcategory === 'sub_ea') matchesCategory = p.category === 'subscription' && (titleLower.includes('ea play') || titleLower.includes('ea'));
          else if (activeSubcategory === 'sub_others') matchesCategory = p.category === 'subscription' && !titleLower.includes('game pass') && !titleLower.includes('gamepass') && !titleLower.includes('psn') && !titleLower.includes('playstation plus') && !titleLower.includes('ps plus') && !titleLower.includes('ea play') && !titleLower.includes('ea');
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
      if (sort === 'price_asc')  return a.sale_price - b.sale_price;
      if (sort === 'price_desc') return b.sale_price - a.sale_price;
      if (sort === 'name_asc')   return a.title.localeCompare(b.title);
      // newest — default from API (created_at DESC), keep order
      return 0;
    });

  const activeCat = CATEGORIES.find(c => c.value === activeCategory) ?? CATEGORIES[0];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <ShopHeader />

      <HeroSection />

      {/* Main Content */}
      <section className="container relative z-20 -mt-8 sm:-mt-16 space-y-6 sm:space-y-8 pb-20">
        <CategoryFilter
          search={search}
          setSearch={setSearch}
          animatedPlaceholder={animatedPlaceholder}
          sort={sort}
          setSort={setSort}
          sortOpen={sortOpen}
          setSortOpen={setSortOpen}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
          activeSubcategory={activeSubcategory}
          setActiveSubcategory={setActiveSubcategory}
        />

        {/* Products Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-display font-bold tracking-wide text-white flex items-center gap-2">
              {(() => { const Icon = activeCat.icon; return <Icon className={cn('w-5 h-5', activeCat.color)} />; })()}
              {activeCategory === 'all' ? 'All Products' : activeCat.label}
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {filtered.length.toLocaleString()} products
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-32 text-muted-foreground space-y-4">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-display tracking-wider animate-pulse">Loading amazing deals...</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
              {filtered.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}

          {!isLoading && filtered.length === 0 && (
            <div className="text-center py-32 text-muted-foreground bg-card/30 rounded-2xl border border-white/5 border-dashed">
              <p className="font-display tracking-wider text-xl mb-2">No products found</p>
              <p className="text-sm">Try adjusting your search or filters.</p>
              <Button
                id="clear-filters-btn"
                variant="outline"
                className="mt-6 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => { setSearch(''); setActiveCategory('all'); }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Index;
