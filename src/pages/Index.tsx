import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ProductCard } from '@/components/product';
import { ShopHeader } from '@/components/layout';
import { HeroSection, CategoryFilter } from '@/components/home';
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

  // Initialize state from URL search params for seamless reverse routing
  const initialCategory = searchParams.get('category') || 'all';
  const initialSubcategory = searchParams.get('sub') || '';
  const initialSearch = searchParams.get('search') || '';
  const initialSort = (searchParams.get('sort') as SortValue) || 'newest';

  const [search, setSearch]                             = useState(initialSearch);
  const [activeCategory, setActiveCategory]             = useState<string>(initialCategory);
  const [activeSubcategory, setActiveSubcategory]       = useState<string>(initialSubcategory);
  const [sort, setSort]                                 = useState<SortValue>(initialSort);
  const [sortOpen, setSortOpen]                         = useState(false);

  const [animatedPlaceholder, setAnimatedPlaceholder]   = useState('');

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

  const debouncedSearch = useDebounce(search, 300);

  // Synchronize state changes to URL search params (enabling reverse routing & shareable URLs)
  useEffect(() => {
    const params: Record<string, string> = {};
    if (activeCategory && activeCategory !== 'all') params.category = activeCategory;
    if (activeSubcategory) params.sub = activeSubcategory;
    if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
    if (sort && sort !== 'newest') params.sort = sort;

    // Only update if params actually differ from current searchParams to avoid infinite loop
    const currentCategory = searchParams.get('category') || 'all';
    const currentSub = searchParams.get('sub') || '';
    const currentSearch = searchParams.get('search') || '';
    const currentSort = searchParams.get('sort') || 'newest';

    const hasChanged =
      (params.category || 'all') !== currentCategory ||
      (params.sub || '') !== currentSub ||
      (params.search || '') !== currentSearch ||
      (params.sort || 'newest') !== currentSort;

    if (hasChanged) {
      setSearchParams(params, { replace: true });
    }
  }, [activeCategory, activeSubcategory, debouncedSearch, sort, searchParams, setSearchParams]);

  // Synchronize browser history back/forward navigation to state
  useEffect(() => {
    const c = searchParams.get('category') || 'all';
    const s = searchParams.get('sub') || '';
    const q = searchParams.get('search') || '';
    const st = (searchParams.get('sort') as SortValue) || 'newest';

    setActiveCategory(prev => (c !== prev ? c : prev));
    setActiveSubcategory(prev => (s !== prev ? s : prev));
    setSearch(prev => (q !== prev ? q : prev));
    setSort(prev => (st !== prev ? st : prev));
  }, [searchParams]);

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
              {totalCount.toLocaleString()} products
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-32 text-muted-foreground space-y-4">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-display tracking-wider animate-pulse">Loading amazing deals...</p>
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
