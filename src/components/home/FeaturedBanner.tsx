import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedProductIds, fetchProductsByIds } from '@/lib/shopApi';
import ProductCard from '@/components/product/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

const FeaturedBanner = () => {
  const { data: featuredIds, isLoading: isLoadingIds } = useQuery({
    queryKey: ['featuredProductIds'],
    queryFn: fetchFeaturedProductIds,
    staleTime: 5 * 60 * 1000,
  });

  const { data: featuredProducts, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['featuredProducts', featuredIds],
    queryFn: () => fetchProductsByIds(featuredIds || []),
    enabled: !!featuredIds && featuredIds.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = isLoadingIds || (featuredIds?.length ? isLoadingProducts : false);

  if (isLoading) {
    return (
      <div className="w-full h-48 animate-pulse bg-card/40 rounded-xl border border-white/5" />
    );
  }

  if (!featuredProducts || featuredProducts.length === 0) {
    return null;
  }

  return (
    <div className="mb-12 relative">
      {/* Ambient background glow for the banner section */}
      <div className="absolute -inset-4 bg-primary/5 blur-3xl rounded-[3rem] -z-10 pointer-events-none" />
      
      <div className="flex items-center gap-2 mb-4 px-1">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-display font-bold tracking-wide text-white">Special Offers</h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
        {featuredProducts.map((product) => (
          <div key={product.id} className="relative group/featured">
            <ProductCard product={product} />
            
            {/* Discount Tag Overlaid */}
            <div className="absolute -top-2 -right-2 z-50 pointer-events-none">
              <Badge 
                className={cn(
                  "bg-gradient-to-r from-red-500 to-orange-500 text-white border-none font-bold shadow-lg shadow-red-500/20",
                  "animate-in fade-in zoom-in duration-500 flex items-center gap-1 py-1"
                )}
              >
                <Percent className="w-3 h-3" />
                Discount
              </Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedBanner;
