import { ShoppingCart, Zap, Globe, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn, generateProductUrl } from '@/lib/utils';

export interface ProductPurchaseCardProps {
  product: {
    id?: string;
    title: string;
    delivery_type: string;
    in_stock: number;
    sale_price: number;
  };
  variants?: Array<{
    id: string;
    title: string;
    sale_price: number;
  }> | null;
  quantity: number;
  setQuantity: (q: number) => void;
  onAddToCart: () => void;
}

const deliveryIcon: Record<string, React.ReactNode> = {
  instant_code: <Zap className="h-4 w-4" />,
  api_h2h: <Globe className="h-4 w-4" />,
  automation: <Bot className="h-4 w-4" />,
};

const deliveryLabel: Record<string, string> = {
  instant_code: 'Instant - 30min Delivery',
  api_h2h: 'Instant - 30min Delivery',
  automation: 'Instant - 30min Delivery',
};

export const ProductPurchaseCard = ({ product, variants, quantity, setQuantity, onAddToCart }: ProductPurchaseCardProps) => {
  const navigate = useNavigate();
  const hasVariants = variants && variants.length > 1;
  const baseName = product.title.includes(' | ') ? product.title.split(' | ')[0] : product.title;
  
  return (
    <div className="bg-card/50 backdrop-blur-xl border border-white/10 rounded-2xl p-6 lg:p-8 shadow-2xl shadow-black/20 relative overflow-hidden">
      {/* Decorative Gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-50" />
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />

      <div className="space-y-6 relative z-10">
        <div className="space-y-2">
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-wide text-white">
            {hasVariants ? baseName : product.title}
          </h1>
          <div className="flex items-center flex-wrap gap-2 gap-y-1 text-muted-foreground">
            {deliveryIcon[product.delivery_type]}
            <span className="text-sm border-r border-white/10 pr-3 mr-1">{deliveryLabel[product.delivery_type] || 'Standard Delivery'}</span>
            <span className={cn("text-xs font-mono px-2 py-0.5 rounded", product.in_stock === 0 ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success")}>
              {product.in_stock === 0 ? 'OUT OF STOCK' : 'AVAILABLE'}
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-xl text-muted-foreground font-light">৳</span>
          <span className="font-display text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            {Number(product.sale_price).toFixed(2)}
          </span>
        </div>

        <Separator className="bg-white/5" />

        <div className="space-y-6">
          {hasVariants && (
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Select Option</Label>
              <div className="grid grid-cols-2 gap-2">
                {variants.map(v => {
                  const vName = v.title.includes(' | ') ? v.title.split(' | ')[1] : v.title;
                  const isSelected = v.id === product.id;
                  return (
                    <Button
                      key={v.id}
                      variant={isSelected ? 'default' : 'outline'}
                      onClick={() => navigate(generateProductUrl(v as Product), { replace: true })}
                      className={cn(
                        "h-auto py-2.5 px-3 justify-start font-display text-sm whitespace-normal text-left h-full transition-all duration-300",
                        isSelected 
                          ? "bg-primary text-primary-foreground border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)]" 
                          : "border-white/10 text-muted-foreground hover:border-primary/50 hover:text-white bg-background/50 hover:bg-white/5"
                      )}
                    >
                      <div className="flex flex-col items-start gap-1 w-full">
                        <span className="font-semibold line-clamp-2">{vName}</span>
                        <span className={cn("text-xs font-mono", isSelected ? "opacity-90" : "opacity-70")}>
                          ৳{Number(v.sale_price).toFixed(0)}
                        </span>
                      </div>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}
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
              {product.in_stock !== 0 && (
                <div className="text-xs text-emerald-400/80 font-medium">
                  Available
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <Button
              onClick={onAddToCart}
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
  );
};
