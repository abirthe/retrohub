import type { Product } from '@/lib/shopApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Zap, Globe, Bot, ArrowRight } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { getRegionLabel } from '@/lib/regions';
import { cn } from '@/lib/utils';

const deliveryIcon = {
  instant_code: <Zap className="h-3 w-3" />,
  api_h2h: <Globe className="h-3 w-3" />,
  automation: <Bot className="h-3 w-3" />,
};

const deliveryLabel = {
  instant_code: 'Instant',
  api_h2h: 'H2H API',
  automation: 'Auto',
};

const categoryColor: Record<string, string> = {
  giftcard: 'bg-primary/10 text-primary border-primary/20 group-hover:bg-primary/20',
  topup: 'bg-accent/10 text-accent border-accent/20 group-hover:bg-accent/20',
  subscription: 'bg-success/10 text-success border-success/20 group-hover:bg-success/20',
};

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.in_stock > 0) {
      addToCart(product, 1);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-xl bg-card/60 border border-white/5 hover:border-primary/50 transition-all duration-500 overflow-hidden hover:shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.3)] animate-slide-up cursor-pointer backdrop-blur-sm"
    >
      {/* Hover Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Image area */}
      <div className="relative h-44 bg-secondary/50 flex items-center justify-center overflow-hidden group-hover:scale-[1.02] transition-transform duration-700">
        <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent z-10" />

        {/* Dynamic Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent z-0" />

        <span className="font-display text-3xl font-black text-white/5 tracking-widest group-hover:text-primary/20 transition-colors duration-500 scale-150 select-none">
          {product.platform}
        </span>

        <div className="absolute top-3 left-3 z-20 flex gap-1.5">
          <Badge variant="outline" className={cn("text-[10px] backdrop-blur-md transition-colors", categoryColor[product.category])}>
            {product.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground backdrop-blur-md">
            {getRegionLabel(product.region || 'GLOBAL')}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4 relative z-20">
        <div className="space-y-1">
          <h3 className="font-display text-base font-bold tracking-wide leading-tight line-clamp-2 text-foreground group-hover:text-primary transition-colors duration-300">
            {product.title}
          </h3>
          <p className="text-xs text-muted-foreground/80 line-clamp-2 min-h-[2.5em]">{product.description}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-white/5">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-xs text-muted-foreground font-medium">৳</span>
              <span className="font-display text-xl font-bold text-white tracking-tight group-hover:text-accent transition-colors">
                {Number(product.sale_price).toFixed(2)}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
              {deliveryIcon[product.delivery_type]}
              <span className="font-medium">{deliveryLabel[product.delivery_type]}</span>
              <span className="mx-1 opacity-50">|</span>
              <span className={product.in_stock > 0 ? "text-success" : "text-destructive"}>
                {product.in_stock > 0 ? `${product.in_stock} stock` : 'Out of Stock'}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            className={cn(
              "font-display text-xs tracking-wider gap-1.5 transition-all duration-300 shadow-lg shadow-primary/10",
              product.in_stock > 0
                ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-accent text-primary-foreground hover:shadow-primary/25"
                : "bg-secondary text-muted-foreground cursor-not-allowed"
            )}
            onClick={handleBuy}
            disabled={product.in_stock === 0}
          >
            {product.in_stock > 0 ? (
              <>
                <ShoppingCart className="h-3.5 w-3.5" />
                Buy
              </>
            ) : (
              'Sold Out'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
