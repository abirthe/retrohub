import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Sparkles, Zap, Gift, Repeat, ShieldAlert,
  Monitor, Gamepad2, Trophy, Wrench, ChevronDown,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import ShopHeader from '@/components/ShopHeader';
import { useProducts } from '@/hooks/useProducts';
import type { ProductCategory } from '@/lib/shopApi';
import heroBg from '@/assets/hero-bg.jpg';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { User } from 'lucide-react';

interface CategoryDef {
  label: string;
  value: string;
  icon: LucideIcon;
  color: string;
  subcategories?: { label: string; value: string }[];
}

const categories: CategoryDef[] = [
  { label: 'All',           value: 'all',          icon: Sparkles,  color: 'text-white' },
  { 
    label: 'Games',         
    value: 'games',        
    icon: Gamepad2,  
    color: 'text-blue-400',
    subcategories: [
      { label: 'Xbox', value: 'games_xbox' },
      { label: 'Play Station', value: 'games_ps' },
      { label: 'Steam', value: 'games_steam' },
      { label: 'GOG', value: 'games_gog' },
      { label: 'Others', value: 'games_others' }
    ]
  },
  { 
    label: 'Accounts',         
    value: 'accounts',        
    icon: User,  
    color: 'text-teal-400',
    subcategories: [
      { label: 'Games', value: 'accounts_games' },
      { label: 'Application', value: 'accounts_app' },
      { label: 'Others', value: 'accounts_others' }
    ]
  },
  { 
    label: 'Gift card',    
    value: 'giftcard',     
    icon: Gift,      
    color: 'text-pink-400',
    subcategories: [
      { label: 'XBOX', value: 'giftcard_xbox' },
      { label: 'STEAM', value: 'giftcard_steam' },
      { label: 'PlayStation', value: 'giftcard_ps' },
      { label: 'Others', value: 'giftcard_others' }
    ]
  },
  { 
    label: 'Subscription', 
    value: 'subscription', 
    icon: Repeat,    
    color: 'text-purple-400',
    subcategories: [
      { label: 'Game Pass', value: 'sub_gamepass' },
      { label: 'PSN', value: 'sub_psn' },
      { label: 'EA', value: 'sub_ea' },
      { label: 'Others', value: 'sub_others' }
    ]
  },
  { label: 'Top up',       value: 'topup',        icon: Zap,       color: 'text-yellow-400' },
  { label: 'Request Custom Orders', value: 'custom_orders', icon: Monitor, color: 'text-orange-400' },
];

const SORT_OPTIONS = [
  { label: 'Newest',        value: 'newest' },
  { label: 'Price: Low–High', value: 'price_asc' },
  { label: 'Price: High–Low', value: 'price_desc' },
  { label: 'Name A–Z',      value: 'name_asc' },
];

type SortValue = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

const Index = () => {
  const [search, setSearch]               = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeSubcategory, setActiveSubcategory] = useState<string>('');
  const [sort, setSort]                   = useState<SortValue>('newest');
  const [sortOpen, setSortOpen]           = useState(false);
  const navigate = useNavigate();

  const { data: products, isLoading } = useProducts();

  const filteredBaseProducts = (products || [])
    .filter((p) => {
      // For Top-Ups, Subscriptions, Gift Cards, and Software, ONLY show the first variant as the "card"
      // Variants are defined by having a '|' in the title.
      // E.g., if there are 6 variants of "Valorant VP (Malaysia)", we only want ONE card to represent them all on the home page.
      if (p.title.includes(' | ')) {
        // We can just pick one deterministically, e.g. the lowest price one or just by checking if this is the first one in the list for this base title.
        // Wait, filtering here means we need to deduplicate. It's better to group them below.
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
        // Typically custom orders won't have regular products unless marked, we can show a placeholder or nothing
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

  const activeCat = categories.find(c => c.value === activeCategory) ?? categories[0];
  const activeSort = SORT_OPTIONS.find(s => s.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <ShopHeader />

      {/* Hero */}
      <section className="relative min-h-[480px] sm:min-h-[580px] lg:min-h-[660px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Hero Background"
            className="w-full h-full object-cover object-top opacity-40"
            style={{ animationDuration: '15s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)]" />
        </div>

        <div className="container relative z-10 text-center space-y-6 max-w-5xl px-4 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-xs font-display font-medium tracking-[0.2em] text-primary uppercase">
              Premium Digital Store
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-wider text-white drop-shadow-[0_0_25px_rgba(var(--primary-rgb),0.3)] leading-[1.1] animate-in zoom-in-95 duration-700 delay-100 uppercase">
            Game <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-accent filter drop-shadow-none">Keys</span>{' '}
            <span className="text-primary">&</span>{' '}<br />
            <span className="text-white">Top-Ups</span>
          </h1>

          <p className="text-muted-foreground text-base md:text-2xl max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Instant delivery for game keys, gift cards, in-game currencies and subscriptions.
            <br className="hidden sm:block" />
            <span className="mt-2 inline-block">
              Powered by <span className="text-primary font-bold border-b border-primary/30 pb-0.5">automated H2H fulfillment</span>.
            </span>
          </p>

          <div className="flex flex-wrap justify-center gap-3 pt-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 text-xs sm:text-sm hover:border-primary/30 transition-colors">
              <Zap className="w-4 h-4 text-primary fill-primary/20" />
              <span className="font-semibold text-foreground">24/7 Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 text-xs sm:text-sm hover:border-primary/30 transition-colors">
              <ShieldAlert className="w-4 h-4 text-success fill-success/20" />
              <span className="font-semibold text-foreground">100% Secure Payment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container relative z-20 -mt-8 sm:-mt-16 space-y-6 sm:space-y-8 pb-20">

        {/* Search & Filter Bar */}
        <div className="relative z-50 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl shadow-black/50">
          <div className="flex flex-col gap-4">

            {/* Top row: search + sort */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="product-search"
                  placeholder="Search games, platforms, subscriptions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 h-11 bg-background/50 border-primary/20 focus:border-primary/50 focus:ring-primary/20 transition-all font-display tracking-wide text-sm"
                />
              </div>

              {/* Sort dropdown */}
              <div className="relative shrink-0">
                <Button
                  id="sort-button"
                  variant="ghost"
                  onClick={() => setSortOpen(o => !o)}
                  className="h-11 px-4 bg-background/30 border border-white/10 rounded-lg text-sm text-muted-foreground hover:border-primary/20 flex items-center gap-2"
                >
                  {activeSort.label}
                  <ChevronDown className={cn('w-4 h-4 transition-transform', sortOpen && 'rotate-180')} />
                </Button>
                {sortOpen && (
                  <div className="absolute right-0 mt-1 w-44 bg-card border border-white/10 rounded-xl shadow-xl z-50 py-1">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => { setSort(opt.value as SortValue); setSortOpen(false); }}
                        className={cn(
                          'w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-white/5',
                          sort === opt.value ? 'text-primary font-semibold' : 'text-muted-foreground'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Category pills */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.value;
                return (
                  <Button
                    key={cat.value}
                    id={`cat-${cat.value}`}
                    variant="ghost"
                    onClick={() => {
                      if (cat.value === 'custom_orders') {
                        navigate('/custom-order');
                        return;
                      }
                      setActiveCategory(cat.value);
                      if (cat.subcategories && cat.subcategories.length > 0) {
                        setActiveSubcategory(cat.subcategories[0].value);
                      } else {
                        setActiveSubcategory('');
                      }
                    }}
                    className={cn(
                      "rounded-xl gap-2 font-display text-sm tracking-wide whitespace-nowrap px-4 py-6 transition-all duration-300",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                        : "bg-white/5 text-muted-foreground border border-white/10 hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                    )}
                  >
                    <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : cat.color)} />
                    {cat.label}
                  </Button>
                );
              })}
            </div>

            {/* Subcategories (only shows if active category has subcategories) */}
            {categories.find(c => c.value === activeCategory)?.subcategories && (
              <div className="flex gap-2 overflow-x-auto pb-2 pt-1 scrollbar-hide -mx-1 px-1" style={{ WebkitOverflowScrolling: 'touch' }}>
                {categories.find(c => c.value === activeCategory)!.subcategories!.map(sub => (
                  <Button
                    key={sub.value}
                    variant={activeSubcategory === sub.value ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      "rounded-full text-xs font-display tracking-wider border transition-colors",
                      activeSubcategory === sub.value 
                        ? "bg-primary/20 text-primary border-primary hover:bg-primary/30" 
                        : "bg-transparent text-muted-foreground border-white/10 hover:border-white/30 hover:text-white"
                    )}
                    onClick={() => setActiveSubcategory(sub.value)}
                  >
                    {sub.label}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>

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

      {/* Footer */}
      <footer className="border-t border-white/5 bg-card/30 py-12">
        <div className="container text-center space-y-4">
          <p className="text-sm text-muted-foreground">
            © 2026 RETROHUB. Crafted with precision.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Dev by{' '}
            <span className="text-primary font-semibold hover:text-accent transition-colors duration-300 cursor-pointer">
              ABIR HOSSAIN
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
