import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchProducts, fetchFeaturedProductIds, updateFeaturedProductIds, Product } from '@/lib/shopApi';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface FeaturedTabProps {
  products: Product[] | undefined;
}

export const FeaturedTab = ({ products }: FeaturedTabProps) => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [displayLimit, setDisplayLimit] = useState(50);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { data: featuredIds, isLoading: isLoadingIds } = useQuery({
    queryKey: ['adminFeaturedProductIds'],
    queryFn: fetchFeaturedProductIds,
  });

  useEffect(() => {
    if (featuredIds && (!isInitialized || !isDirty)) {
      setSelectedIds(featuredIds);
      setIsInitialized(true);
    }
  }, [featuredIds, isInitialized, isDirty]);

  const updateFeaturedMutation = useMutation({
    mutationFn: (newIds: string[]) => updateFeaturedProductIds(newIds),
    onSuccess: () => {
      setIsDirty(false);
      queryClient.setQueryData(['adminFeaturedProductIds'], selectedIds);
      queryClient.invalidateQueries({ queryKey: ['adminFeaturedProductIds'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProductIds'] });
      queryClient.invalidateQueries({ queryKey: ['featuredProducts'] });
      toast({ title: 'Success', description: 'Featured products updated.' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message || 'Failed to update featured products.', variant: 'destructive' });
    }
  });

  if (isLoadingIds || !products) {
    return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  }

  const handleSave = () => {
    updateFeaturedMutation.mutate(selectedIds);
  };

  const handleToggle = (id: string, checked: boolean) => {
    setIsDirty(true);
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(pId => pId !== id));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = (p.title || '').toLowerCase().includes(search.toLowerCase());
    const matchesSelected = showOnlySelected ? selectedIds.includes(p.id) : true;
    return matchesSearch && matchesSelected;
  });
  const displayedProducts = filteredProducts.slice(0, displayLimit);
  const hasMore = displayLimit < filteredProducts.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-display font-bold">Featured Products</h2>
          <p className="text-sm text-muted-foreground">Select products to show in the "Special Offers" banner on the homepage with a discount tag.</p>
        </div>
        <Button onClick={handleSave} disabled={updateFeaturedMutation.isPending} className="w-full sm:w-auto">
          {updateFeaturedMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes ({selectedIds.length} selected)
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[240px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search products..." 
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setDisplayLimit(50);
            }}
            className="pl-9 bg-card/40 border-white/10"
          />
        </div>

        <Button
          type="button"
          variant={showOnlySelected ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setShowOnlySelected(prev => !prev);
            setDisplayLimit(50);
          }}
          className={showOnlySelected ? "border-primary/40 bg-primary/20 text-primary hover:bg-primary/30" : "border-white/10 text-muted-foreground hover:text-white"}
        >
          {showOnlySelected ? `Showing Selected (${selectedIds.length})` : `Show Selected Only (${selectedIds.length})`}
        </Button>

        {isDirty && (
          <span className="text-xs text-amber-400 font-medium animate-pulse ml-auto sm:ml-0">
            • Unsaved changes
          </span>
        )}
      </div>

      <div className="bg-card/40 border border-white/5 rounded-xl overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto pb-4">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-secondary/50 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-4 py-3 w-16">Feature</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
              </tr>
            </thead>
            <tbody>
              {displayedProducts.map(product => {
                const isSelected = selectedIds.includes(product.id);
                return (
                  <tr key={product.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={(checked) => handleToggle(product.id, checked as boolean)}
                      />
                    </td>
                    <td className="px-4 py-3 font-medium flex items-center gap-3">
                      {product.image_url && <img src={product.image_url} alt="" className="w-8 h-8 rounded object-cover" />}
                      <span className="line-clamp-1">{product.title}</span>
                    </td>
                    <td className="px-4 py-3">৳{product.sale_price}</td>
                    <td className="px-4 py-3">
                      <span className={product.in_stock === 0 ? 'text-destructive' : 'text-green-400'}>
                        {product.in_stock}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No products found matching "{search}"
            </div>
          )}

          {hasMore && (
            <div className="flex justify-center mt-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setDisplayLimit(prev => prev + 50)}
                className="w-full max-w-xs border-primary/20 hover:bg-primary/10"
              >
                Load More
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
