import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Package } from 'lucide-react';
import { ShopHeader } from '@/components/layout';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ProductImageArea, ProductFeatures, ProductPurchaseCard } from '@/components/product';
import type { Product } from '@/lib/shopApi';

const ProductDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  // Robust reverse routing: Extract UUID from slug or use direct ID
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const match = slug?.match(uuidRegex);
  const id = match ? match[0] : (slug || '');

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const query = supabase
        .from('products')
        .select('*')
        .eq('is_active', true);

      if (match) {
        query.eq('id', id);
      } else {
        query.ilike('title', `%${slug?.replace(/-/g, ' ')}%`);
      }

      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: variants } = useQuery({
    queryKey: ['product_variants', product?.title?.split(' | ')[0]],
    queryFn: async () => {
      if (!product || !product.title.includes(' | ')) return null;
      const baseName = product.title.split(' | ')[0];
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .ilike('title', `${baseName} | %`)
        .eq('is_active', true)
        .order('sale_price', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!product?.title?.includes(' | '),
  });

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart',
        variant: 'destructive',
      });
      navigate('/auth', { state: { from: location.pathname } });
      return;
    }
    addToCart(product, quantity);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <ShopHeader />
        <div className="container py-32 text-center flex flex-col items-center">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <p className="font-display tracking-wider animate-pulse text-muted-foreground">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <ShopHeader />
        <div className="container py-32 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 text-destructive mb-4">
            <Package className="w-8 h-8" />
          </div>
          <h1 className="font-display tracking-wider text-xl font-bold mb-2">Product not found</h1>
          <p className="text-muted-foreground mb-6">The product you are looking for does not exist or has been removed.</p>
          <Button onClick={handleBack} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Shop
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background selection:bg-primary/20">
      <ShopHeader />

      {/* Breadcrumb / Back */}
      <div className="container py-3 sm:py-6">
        <Button
          variant="ghost"
          onClick={handleBack}
          className="font-display text-xs tracking-wider text-muted-foreground hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>
      </div>

      <div className="container pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Image Area and Features */}
          <div className="lg:col-span-7 space-y-6">
            <ProductImageArea product={product as Product} />
            <ProductFeatures product={product as Product} />
          </div>

          {/* Right Column: Sticky Purchasing Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <ProductPurchaseCard 
              product={product as Product} 
              variants={variants as Product[]}
              quantity={quantity} 
              setQuantity={setQuantity} 
              onAddToCart={handleAddToCart} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
