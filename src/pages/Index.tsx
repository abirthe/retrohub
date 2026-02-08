import { useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import heroBg from '@/assets/hero-bg.jpg';
import ProductCard from '@/components/ProductCard';
import ShopHeader from '@/components/ShopHeader';
import { mockProducts } from '@/data/mockData';
import type { ProductCategory } from '@/types/shop';

const categories: { label: string; value: ProductCategory | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: '🎁 Gift Cards', value: 'giftcard' },
  { label: '⚡ Top-ups', value: 'topup' },
  { label: '🔄 Subscriptions', value: 'subscription' },
];

const Index = () => {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ProductCategory | 'all'>('all');

  const filtered = mockProducts.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.platform.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <ShopHeader />

      {/* Hero */}
      <section className="relative py-20 overflow-hidden">
        <img src={heroBg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        <div className="container relative text-center space-y-4">
          <h1 className="font-display text-4xl md:text-5xl font-black tracking-wider neon-text text-foreground">
            GAME <span className="text-primary">KEYS</span> & TOP-UPS
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Instant delivery for gift cards, in-game currencies, and subscriptions.
            Powered by automated H2H fulfillment.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="container space-y-4 pb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search games, platforms..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border/50 focus:border-primary/50"
            />
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={activeCategory === cat.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveCategory(cat.value)}
              className={
                activeCategory === cat.value
                  ? 'gradient-primary font-display text-xs tracking-wider'
                  : 'border-border/50 text-muted-foreground font-display text-xs tracking-wider hover:border-primary/40'
              }
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </section>

      {/* Products */}
      <section className="container pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <p className="font-display tracking-wider">No products found</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default Index;
