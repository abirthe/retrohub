import { useState, useEffect } from 'react';
import ProductCard from '@/components/ProductCard';
import ShopHeader from '@/components/layout/ShopHeader';
import { HeroSection } from '@/components/home/HeroSection';
import { CategoryFilter } from '@/components/home/CategoryFilter';
import { useProducts } from '@/hooks/useProducts';
import { CATEGORIES } from '@/lib/constants';
import type { SortValue } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { filterAndGroupProducts } from '@/lib/productFilters';
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

  const filtered = filterAndGroupProducts(products, {
    search,
    activeCategory,
    activeSubcategory,
    sort,
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
