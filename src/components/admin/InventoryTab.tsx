import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X, Package, User, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateProductPrice, type Product } from '@/lib/shopApi';
import { InventoryRow } from './InventoryRow';
import { getProductEffectiveCategory } from '@/lib/productFilters';
import { AddProductDialog } from './AddProductDialog';

interface InventoryTabProps {
  products: Product[] | undefined;
}

const STANDARD_CATEGORIES: Array<{ key: string; label: string; iconType: 'package' | 'user' }> = [
  { key: 'giftcard', label: 'Giftcard', iconType: 'package' },
  { key: 'service', label: 'Service', iconType: 'package' },
  { key: 'topup', label: 'Topup', iconType: 'package' },
  { key: 'pc_game', label: 'PC Game', iconType: 'package' },
  { key: 'subscription', label: 'Subscription', iconType: 'package' },
  { key: 'software', label: 'Software', iconType: 'package' },
  { key: 'xbox_game', label: 'Xbox Game', iconType: 'package' },
  { key: 'ps_game', label: 'PS Game', iconType: 'package' },
  { key: 'accounts', label: 'Accounts', iconType: 'user' },
];

const InventoryTab = ({ products }: InventoryTabProps) => {
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');

  const getLimit = (key: string) => limits[key] || 50;
  const loadMore = (key: string) => setLimits(prev => ({ ...prev, [key]: getLimit(key) + 50 }));
  const isAccountProduct = (p: Product): boolean => {
    const rawCat = p.category?.toLowerCase() || '';
    if (rawCat === 'accounts' || rawCat === 'account') return true;
    const titleLower = (p.title || '').toLowerCase();
    if (titleLower.includes('account')) return true;
    return getProductEffectiveCategory(p) === 'accounts';
  };

  // Build bucket mapping
  const categoryBuckets: Record<string, Product[]> = {};

  // Initialize all standard categories so they always exist
  STANDARD_CATEGORIES.forEach(({ key }) => {
    categoryBuckets[key] = [];
  });

  const filteredProducts = (products || []).filter(product => {
    if (product.title === '[CONFIG] Featured Products') return false;
    if (!search) return true;
    return product.title.toLowerCase().includes(search.toLowerCase());
  });

  filteredProducts.forEach((product) => {
    if (isAccountProduct(product)) {
      categoryBuckets['accounts'].push(product);
    } else {
      const cat = product.category || 'other';
      if (!categoryBuckets[cat]) {
        categoryBuckets[cat] = [];
      }
      categoryBuckets[cat].push(product);
    }
  });

  // Collect any extra dynamic categories not in standard list
  const extraCategories = Object.keys(categoryBuckets).filter(
    (k) => !STANDARD_CATEGORIES.some((sc) => sc.key === k)
  );

  const allGroups = [
    ...STANDARD_CATEGORIES.map(({ key, label, iconType }) => ({
      key,
      label,
      items: categoryBuckets[key] || [],
      icon: iconType === 'user' ? (
        <User className="h-5 w-5 text-teal-400" />
      ) : (
        <Package className="h-5 w-5 text-primary" />
      ),
    })),
    ...extraCategories.map((key) => ({
      key,
      label: key.replace(/_/g, ' '),
      items: categoryBuckets[key] || [],
      icon: <Package className="h-5 w-5 text-primary" />,
    })),
  ].filter(group => search === '' || group.items.length > 0);

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-white/10 overflow-hidden shadow-xl">
      <CardHeader className="bg-white/5 border-b border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="font-display text-lg tracking-wider">Inventory Status</CardTitle>
          <CardDescription>Category-based stock levels and margin analysis</CardDescription>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search inventory..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background/50 border-white/10"
            />
          </div>
          <AddProductDialog />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          {allGroups.map(({ key, label, items, icon }) => (
            <AccordionItem key={key} value={key} className="border-white/5">
              <AccordionTrigger className="px-6 py-4 hover:bg-white/5 hover:no-underline transition-colors data-[state=open]:bg-white/5">
                <div className="flex items-center gap-3">
                  {icon}
                  <span className="font-display font-bold text-base capitalize">{label}</span>
                  <Badge variant="outline" className="ml-2 bg-background/50 text-[10px]">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-black/40 text-muted-foreground font-display text-[10px] uppercase tracking-wider border-y border-white/5">
                      <tr>
                        <th className="p-4 font-semibold opacity-70 min-w-[160px]">Product</th>
                        <th className="p-4 font-semibold opacity-70 min-w-[90px]">Type</th>
                        <th className="p-4 font-semibold opacity-70 min-w-[70px]">Stock</th>
                        <th className="p-4 font-semibold opacity-70 min-w-[100px]">Cost</th>
                        <th className="p-4 font-semibold opacity-70 min-w-[100px]">Price</th>
                        <th className="p-4 font-semibold opacity-70 text-right min-w-[80px]">Margin</th>
                        <th className="p-4 font-semibold opacity-70 text-right min-w-[70px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {items.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs italic">
                            No products currently in this category.
                          </td>
                        </tr>
                      ) : (
                        <>
                          {items.slice(0, getLimit(key)).map((p) => (
                            <InventoryRow key={p.id} product={p} />
                          ))}
                          {items.length > getLimit(key) && (
                            <tr>
                              <td colSpan={7} className="p-4 text-center">
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  onClick={() => loadMore(key)}
                                  className="border-primary/20 hover:bg-primary/10 w-full max-w-xs"
                                >
                                  Load More ({items.length - getLimit(key)} remaining)
                                </Button>
                              </td>
                            </tr>
                          )}
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default InventoryTab;
