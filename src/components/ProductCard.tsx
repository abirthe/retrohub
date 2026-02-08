import type { Product } from '@/lib/shopApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Zap, Globe, Bot } from 'lucide-react';

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
  giftcard: 'bg-primary/20 text-primary border-primary/30',
  topup: 'bg-accent/20 text-accent border-accent/30',
  subscription: 'bg-success/20 text-success border-success/30',
};

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <div className="group relative rounded-lg bg-card border border-border/50 hover:border-primary/40 transition-all duration-300 overflow-hidden hover:shadow-[0_0_30px_hsl(185_100%_50%/0.1)] animate-slide-up">
      {/* Image area */}
      <div className="relative h-40 bg-secondary flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent z-10" />
        <span className="font-display text-2xl font-bold text-muted-foreground/30 tracking-widest">
          {product.platform}
        </span>
        <div className="absolute top-2 left-2 z-20 flex gap-1">
          <Badge variant="outline" className={`text-[10px] ${categoryColor[product.category]}`}>
            {product.category}
          </Badge>
          <Badge variant="outline" className="text-[10px] border-muted-foreground/30 text-muted-foreground">
            {product.region}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <h3 className="font-display text-sm font-semibold tracking-wide leading-tight line-clamp-2 text-foreground">
          {product.title}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>

        <div className="flex items-center justify-between">
          <div>
            <span className="font-display text-lg font-bold text-primary">
              ${Number(product.sale_price).toFixed(2)}
            </span>
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
              {deliveryIcon[product.delivery_type]}
              <span>{deliveryLabel[product.delivery_type]}</span>
              <span className="mx-1">•</span>
              <span>{product.in_stock} in stock</span>
            </div>
          </div>
          <Button size="sm" className="gradient-primary font-display text-xs tracking-wider gap-1">
            <ShoppingCart className="h-3 w-3" />
            Buy
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
