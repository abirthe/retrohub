import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '@/components/product';
import { ShopHeader } from '@/components/layout';
import { HeroSection, CategoryFilter } from '@/components/home';
import FeaturedBanner from '@/components/home/FeaturedBanner';
import { useProducts } from '@/hooks/useProducts';
import { CATEGORIES } from '@/lib/constants';
import type { SortValue } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const Index = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Single source of truth: URL search parameters
  const activeCategory = searchParams.get('category') || 'all';
  const activeSubcategory = searchParams.get('sub') || '';
  const sort = (searchParams.get('sort') as SortValue) || 'newest';
  const urlSearch = searchParams.get('search') || '';

  const [search, setSearch] = useState(urlSearch);
  const [sortOpen, setSortOpen] = useState(false);

  const debouncedSearch = useDebounce(search, 300);

  // Sync input text when URL query changes from navigation (e.g. clicking RETROHUB or browser back/forward)
  useEffect(() => {
    setSearch(urlSearch);
  }, [urlSearch]);

  // Update URL search parameter when user types search
  useEffect(() => {
    const currentUrlSearch = searchParams.get('search') || '';
    const trimmed = debouncedSearch.trim();
    if (trimmed !== currentUrlSearch) {
      const nextParams = new URLSearchParams(searchParams);
      if (trimmed) {
        nextParams.set('search', trimmed);
      } else {
        nextParams.delete('search');
      }
      setSearchParams(nextParams, { replace: true });
    }
  }, [debouncedSearch, searchParams, setSearchParams]);

  const setActiveCategory = (cat: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (cat && cat !== 'all') {
      nextParams.set('category', cat);
    } else {
      nextParams.delete('category');
    }
    nextParams.delete('sub');
    setSearchParams(nextParams, { replace: true });
  };

  const setActiveSubcategory = (sub: string) => {
    const nextParams = new URLSearchParams(searchParams);
    if (sub) {
      nextParams.set('sub', sub);
    } else {
      nextParams.delete('sub');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const setSort = (newSort: SortValue) => {
    const nextParams = new URLSearchParams(searchParams);
    if (newSort && newSort !== 'newest') {
      nextParams.set('sort', newSort);
    } else {
      nextParams.delete('sort');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const { 
    data, 
    isLoading, 
    isFetchingNextPage, 
    hasNextPage, 
    fetchNextPage 
  } = useProducts({
    search: debouncedSearch,
    activeCategory,
    activeSubcategory,
    sort
  });

  const allProducts = data?.pages.flatMap(page => page.products) || [];
  const totalCount = data?.pages[0]?.totalCount || 0;

  const activeCat = CATEGORIES.find(c => c.value === activeCategory) ?? CATEGORIES[0];

  return (
    <div className="min-h-screen selection:bg-primary/20">
      <ShopHeader />

      <HeroSection />

      {/* Main Content */}
      <section className="container relative z-20 -mt-8 sm:-mt-16 space-y-6 sm:space-y-8 pb-20">
        <CategoryFilter
          search={search}
          setSearch={setSearch}
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
          <FeaturedBanner />

          <div className="flex items-center justify-between px-1">
            <h2 className="text-xl font-display font-bold tracking-wide text-white flex items-center gap-2">
              {(() => { const Icon = activeCat.icon; return <Icon className={cn('w-5 h-5', activeCat.color)} />; })()}
              {activeCategory === 'all' ? 'All Products' : activeCat.label}
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              {totalCount.toLocaleString()} products
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-32 text-muted-foreground space-y-4">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-display tracking-wider text-muted-foreground">Loading products...</p>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
                {allProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              
              {hasNextPage && (
                <div className="flex justify-center pt-8 pb-12">
                  <Button 
                    variant="outline" 
                    size="lg"
                    onClick={() => fetchNextPage()} 
                    disabled={isFetchingNextPage}
                    className="w-full sm:w-auto min-w-[200px] border-primary/30 text-primary hover:bg-primary/10"
                  >
                    {isFetchingNextPage ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        Loading more...
                      </div>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {!isLoading && allProducts.length === 0 && (
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
