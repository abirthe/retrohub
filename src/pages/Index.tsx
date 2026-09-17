import { useState } from 'react';
import { Search, Sparkles, Zap, Gift, Repeat, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import ShopHeader from '@/components/ShopHeader';
import { useProducts } from '@/hooks/useProducts';
import type { ProductCategory } from '@/lib/shopApi';
import heroBg from '@/assets/hero-bg.jpg';
import { cn } from '@/lib/utils';

import type { LucideIcon } from 'lucide-react';

const categories: { label: string; value: ProductCategory | 'all'; icon: LucideIcon }[] = [
  { label: 'All', value: 'all', icon: Sparkles },
  { label: 'Gift Cards', value: 'giftcard', icon: Gift },
  { label: 'Top-ups', value: 'topup', icon: Zap },
  { label: 'Subscriptions', value: 'subscription', icon: Repeat },
];

const Index = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');
  const { data: products, isLoading } = useProducts();

  const filtered = (products || []).filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      (p.platform?.toLowerCase().includes(search.toLowerCase()) ?? false);
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <ShopHeader />

      {/* Hero */}
      <section className="relative min-h-[600px] lg:min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background Image & Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src={heroBg}
            alt="Hero Background"
            className="w-full h-full object-cover object-top opacity-40 animate-pulse-neon"
            style={{ animationDuration: '15s' }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary-rgb),0.05)_0%,transparent_70%)]" />
        </div>

        {/* Content */}
        <div className="container relative z-10 text-center space-y-8 max-w-5xl px-4 py-20">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md animate-in fade-in slide-in-from-top-4 duration-700">
            <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse" />
            <span className="text-xs font-display font-medium tracking-[0.2em] text-primary uppercase">
              Premium Digital Store
            </span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-wider text-white drop-shadow-[0_0_25px_rgba(var(--primary-rgb),0.3)] leading-[1.1] animate-in zoom-in-95 duration-700 delay-100 uppercase">
            Game <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-accent filter drop-shadow-none">Keys</span> <span className="text-primary">&</span> <br />
            <span className="text-white">Top-Ups</span>
          </h1>

          <p className="text-muted-foreground text-lg md:text-2xl max-w-3xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
            Instant delivery for gift cards, in-game currencies, and subscriptions.
            <br className="hidden sm:block" />
            <span className="mt-2 inline-block">Powered by <span className="text-primary font-bold border-b border-primary/30 pb-0.5">automated H2H fulfillment</span>.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-300">
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 text-sm hover:border-primary/30 transition-colors">
              <Zap className="w-4 h-4 text-primary fill-primary/20" />
              <span className="font-semibold text-foreground">24/7 Instant Delivery</span>
            </div>
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 text-sm hover:border-primary/30 transition-colors">
              <ShieldAlert className="w-4 h-4 text-success fill-success/20" />
              <span className="font-semibold text-foreground">100% Secure Payment</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="container relative z-20 -mt-20 space-y-8 pb-20">

        {/* Search & Filter Bar */}
        <div className="bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl shadow-black/50">
          <div className="flex flex-col md:flex-row gap-6 items-center justify-between">

            {/* Search */}
            <div className="w-full md:w-auto flex-1 relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search games, platforms..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11 bg-background/50 border-primary/20 focus:border-primary/50 focus:ring-primary/20 transition-all font-display tracking-wide text-sm"
              />
            </div>

            {/* Categories */}
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
              {categories.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.value;
                return (
                  <Button
                    key={cat.value}
                    variant="ghost"
                    onClick={() => setActiveCategory(cat.value)}
                    className={cn(
                      "h-10 px-4 rounded-lg font-display text-xs tracking-wider transition-all duration-300 border",
                      isActive
                        ? "bg-primary/10 text-primary border-primary/30 shadow-[0_0_15px_-5px_rgba(var(--primary-rgb),0.4)]"
                        : "bg-background/30 text-muted-foreground border-transparent hover:border-primary/20 hover:bg-background/50"
                    )}
                  >
                    <Icon className={cn("w-3.5 h-3.5 mr-2", isActive ? "text-primary" : "text-muted-foreground")} />
                    {cat.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-display font-bold tracking-wide text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-accent" />
              Featured Products
            </h2>
            <span className="text-xs text-muted-foreground font-mono">
              Showing {filtered.length} products
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-32 text-muted-foreground space-y-4">
              <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-display tracking-wider animate-pulse">Loading amazing deals...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                variant="outline"
                className="mt-6 border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => {
                  setSearch('');
                  setActiveCategory('all');
                }}
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
          <div className="flex items-center justify-center gap-2 mb-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
            {/* Add payment logos or similar here if available */}
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 RETROHUB. Crafted with precision.
          </p>
          <p className="text-xs text-muted-foreground/50">
            Dev by <span className="text-primary font-semibold hover:text-accent transition-colors duration-300 cursor-pointer">ABIR HOSSAIN</span>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
