import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, ArrowLeft, Zap, Globe, Bot, Package, ShieldCheck, Clock, Star } from 'lucide-react';
import ShopHeader from '@/components/ShopHeader';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { getRegionLabel } from '@/lib/regions';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

const deliveryIcon = {
  instant_code: <Zap className="h-4 w-4" />,
  api_h2h: <Globe className="h-4 w-4" />,
  automation: <Bot className="h-4 w-4" />,
};

const deliveryLabel = {
  instant_code: 'Instant - 30min Delivery',
  api_h2h: 'Instant - 30min Delivery',
  automation: 'Instant - 30min Delivery',
};

const categoryColor: Record<string, string> = {
  giftcard: 'bg-primary/10 text-primary border-primary/20',
  topup: 'bg-accent/10 text-accent border-accent/20',
  subscription: 'bg-success/10 text-success border-success/20',
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleAddToCart = () => {
    if (!product) return;
    if (!user) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to add items to your cart',
        variant: 'destructive',
      });
      navigate('/auth');
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
          <Button onClick={() => navigate('/')} variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
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
      <div className="container py-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="font-display text-xs tracking-wider text-muted-foreground hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shop
        </Button>
      </div>

      <div className="container pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">

          {/* Left Column: Image Area */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-video lg:aspect-[16/9] bg-secondary/30 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl relative group">
              {/* Background Effects */}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent z-0 opacity-50 pointer-events-none" />

              <img
                src={product.image_url || `https://image.pollinations.ai/prompt/Cinematic%20epic%20gaming%20banner%20wallpaper%20for%20${encodeURIComponent(product.title)}%20no%20text?width=1920&height=1080&nologo=true`}
                alt={product.title}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1920&auto=format&fit=crop';
                }}
              />

              <div className="absolute top-6 left-6 z-20 flex gap-2">
                <Badge variant="outline" className={cn("text-xs backdrop-blur-md px-3 py-1", categoryColor[product.category])}>
                  {product.category}
                </Badge>
                <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground backdrop-blur-md px-3 py-1 bg-background/50">
                  {getRegionLabel(product.region || 'GLOBAL')}
                </Badge>
              </div>
            </div>

            {/* Description & Features */}
            <div className="bg-card/30 backdrop-blur-sm border border-white/5 rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                <Star className="w-4 h-4 text-accent" />
                About This Product
              </h3>
              <div className="text-muted-foreground leading-relaxed text-sm space-y-4">
                {product.description ? (
                  // Split by newlines OR emojis that act as list markers
                  product.description.split(/(?=\n|✅|📞|⭐|💸|-|\*)/).filter(Boolean).map((line, i) => {
                    const cleanLine = line.trim();
                    if (!cleanLine) return null;

                    // If it starts with an emoji or bullet, format as a list item
                    const isBullet = /^[✅📞⭐💸\-*]/.test(cleanLine);
                    
                    if (isBullet) {
                      // Extract the first character as the icon, and the rest as text
                      const icon = cleanLine.charAt(0);
                      const text = cleanLine.slice(1).trim();
                      
                      return (
                        <div key={i} className="flex items-start gap-3 bg-white/5 p-3 rounded-lg border border-white/5 hover:border-primary/20 transition-colors">
                          <div className="mt-0.5 shrink-0 text-primary">
                            {icon === '-' || icon === '*' ? <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5" /> : <span>{icon}</span>}
                          </div>
                          <span className="text-white/80">{text}</span>
                        </div>
                      );
                    }
                    
                    if (cleanLine.includes(':')) {
                      const [key, ...val] = cleanLine.split(':');
                      return (
                        <div key={i} className="bg-white/5 p-3 rounded-lg border border-white/5">
                          <span className="font-semibold text-primary">{key.trim()}:</span> {val.join(':').trim()}
                        </div>
                      );
                    }
                    return <p key={i} className="text-white/70">{cleanLine}</p>;
                  })
                ) : (
                  <p className="italic text-white/50">Experience the ultimate digital journey with {product.title}. Securely delivered to you instantly.</p>
                )}
              </div>
              <Separator className="bg-white/5" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span>Secure Transaction</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                    <Zap className="w-4 h-4" />
                  </div>
                  <span>Instant - 30min Delivery</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center text-success">
                    <Clock className="w-4 h-4" />
                  </div>
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Purchasing Card */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-6">
            <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl shadow-black/20 relative overflow-hidden">
              {/* Decorative Gradient */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
              <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">
                    {product.title}
                  </h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    {deliveryIcon[product.delivery_type]}
                    <span className="text-sm border-r border-white/10 pr-3 mr-1">{deliveryLabel[product.delivery_type]}</span>
                    <span className={cn("text-xs font-mono px-2 py-0.5 rounded", product.in_stock > 0 ? "bg-success/20 text-success" : "bg-yellow-500/20 text-yellow-500")}>
                      {product.in_stock > 0 ? 'IN STOCK' : 'AVAILABLE'}
                    </span>
                  </div>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="text-2xl text-muted-foreground font-light">৳</span>
                  <span className="font-display text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                    {Number(product.sale_price).toFixed(2)}
                  </span>
                </div>

                <Separator className="bg-white/5" />

                <div className="space-y-6">
                  {product.in_stock === 1 && (
                    <div className="flex items-center gap-2 text-accent text-sm animate-pulse bg-accent/10 p-3 rounded border border-accent/20">
                      <Zap className="w-4 h-4" />
                      <span className="font-bold">Hurry! Only 1 left in stock.</span>
                    </div>
                  )}

                  <div className="space-y-3">
                    <Label htmlFor="quantity" className="text-xs uppercase tracking-widest text-muted-foreground">Quantity</Label>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-white/10 bg-background/50 p-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded hover:bg-white/10"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          disabled={quantity <= 1}
                        >
                          -
                        </Button>
                        <Input
                          id="quantity"
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setQuantity(Math.max(1, val));
                          }}
                          className="w-16 text-center border-none bg-transparent h-8 focus-visible:ring-0 font-display"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded hover:bg-white/10"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          +
                        </Button>
                      </div>
                      {product.in_stock > 0 && (
                        <div className="text-xs text-muted-foreground">
                          Stock: {product.in_stock}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    <Button
                      onClick={handleAddToCart}
                      className="w-full h-14 gradient-primary font-display text-base tracking-wider gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300"
                      size="lg"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      {product.in_stock === 1 ? 'Buy Now - Last One!' : 'Add to Cart'}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      By purchasing, you agree to our Terms of Service.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;

