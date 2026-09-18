import type { Product } from '@/lib/shopApi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart, Zap, Globe, Bot,
  Monitor, Gamepad2, Trophy, Repeat, Wrench, Gift,
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { getRegionLabel } from '@/lib/regions';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

const deliveryIcon = {
  instant_code: <Zap className="h-3 w-3" />,
  api_h2h:      <Globe className="h-3 w-3" />,
  automation:   <Bot className="h-3 w-3" />,
};

const deliveryLabel = {
  instant_code: 'Instant - 30min',
  api_h2h:      'Instant - 30min',
  automation:   'Instant - 30min',
};

interface CategoryMeta {
  label:   string;
  icon:    LucideIcon;
  badge:   string;
  glow:    string;
  imgBg:   string;
}

const CATEGORY_META: Record<string, CategoryMeta> = {
  pc_game:      { label: 'PC Game',      icon: Monitor,   badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',      glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(59,130,246,0.4)]',    imgBg: 'from-blue-900/20' },
  xbox_game:    { label: 'Xbox',         icon: Gamepad2,  badge: 'bg-green-500/10 text-green-400 border-green-500/20',    glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(34,197,94,0.4)]',     imgBg: 'from-green-900/20' },
  ps_game:      { label: 'PlayStation',  icon: Trophy,    badge: 'bg-sky-500/10 text-sky-300 border-sky-500/20',          glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(14,165,233,0.4)]',    imgBg: 'from-sky-900/20' },
  topup:        { label: 'Top-Up',       icon: Zap,       badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(234,179,8,0.4)]',     imgBg: 'from-yellow-900/20' },
  subscription: { label: 'Subscription', icon: Repeat,    badge: 'bg-purple-500/10 text-purple-400 border-purple-500/20', glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(168,85,247,0.4)]',    imgBg: 'from-purple-900/20' },
  software:     { label: 'Software',     icon: Wrench,    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20', glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(249,115,22,0.4)]',    imgBg: 'from-orange-900/20' },
  giftcard:     { label: 'Gift Card',    icon: Gift,      badge: 'bg-pink-500/10 text-pink-400 border-pink-500/20',       glow: 'group-hover:shadow-[0_0_40px_-10px_rgba(236,72,153,0.4)]',    imgBg: 'from-pink-900/20' },
};

const DEFAULT_META: CategoryMeta = {
  label: 'Product', icon: Gift,
  badge:  'bg-primary/10 text-primary border-primary/20',
  glow:   'group-hover:shadow-[0_0_40px_-10px_rgba(var(--primary-rgb),0.3)]',
  imgBg:  'from-primary/10',
};

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const meta = CATEGORY_META[product.category] ?? DEFAULT_META;
  const CategoryIcon = meta.icon;

  const handleBuy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (product.in_stock > 0) {
      addToCart(product, 1);
    }
  };

  const handleCardClick = () => {
    navigate(`/product/${product.id}`);
  };

  const hasImage = Boolean(product.image_url);

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        'group relative rounded-xl bg-card/60 border border-white/5 hover:border-white/20',
        'transition-all duration-500 overflow-hidden cursor-pointer backdrop-blur-sm',
        meta.glow,
      )}
    >
      {/* Hover gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-b opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none', meta.imgBg, 'to-transparent')} />

      {/* Image area */}
      <div className={cn('relative h-32 sm:h-44 overflow-hidden bg-gradient-to-b', meta.imgBg, 'to-card/80')}>
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent z-10" />

        {hasImage ? (
          <img
            src={product.image_url!}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain p-2 opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <CategoryIcon className={cn('w-14 h-14 opacity-10 group-hover:opacity-20 transition-opacity duration-500')} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-0 w-full px-3 z-20 flex justify-between gap-1.5">
          <Badge variant="outline" className={cn('text-[10px] backdrop-blur-md transition-colors flex items-center gap-1', meta.badge)}>
            <CategoryIcon className="h-2.5 w-2.5" />
            {meta.label}
          </Badge>
          <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground backdrop-blur-md">
            {getRegionLabel(product.region || 'GLOBAL')}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-2.5 sm:p-4 space-y-2 sm:space-y-3 relative z-20">
        <div className="space-y-0.5 sm:space-y-1">
          {product.platform && (
            <p className="text-[9px] sm:text-[10px] font-display tracking-widest text-muted-foreground/60 uppercase">{product.platform}</p>
          )}
          <h3 className="font-display text-xs sm:text-sm font-bold tracking-wide leading-tight line-clamp-2 text-foreground group-hover:text-white transition-colors duration-300">
            {product.title}
          </h3>
          {product.description && (
            <p className="hidden sm:block text-xs text-muted-foreground/70 line-clamp-2 min-h-[2.5em]">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1.5 sm:pt-2 border-t border-white/5 gap-2">
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="text-[10px] text-muted-foreground font-medium">৳</span>
              <span className="font-display text-base sm:text-xl font-bold text-white tracking-tight group-hover:text-accent transition-colors">
                {Number(product.sale_price).toLocaleString('en-BD')}
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
              {deliveryIcon[product.delivery_type]}
              <span className="font-medium">{deliveryLabel[product.delivery_type]}</span>
              <span className="mx-1 opacity-50">|</span>
              <span className={product.in_stock > 0 ? 'text-green-400' : 'text-destructive'}>
                {product.in_stock > 0 ? `${product.in_stock} in stock` : 'Out of Stock'}
              </span>
            </div>
          </div>

          <Button
            size="sm"
            className={cn(
              'font-display text-[10px] sm:text-xs tracking-wider gap-1 sm:gap-1.5 transition-all duration-300 h-7 sm:h-9 px-2 sm:px-3 shrink-0',
              product.in_stock > 0
                ? 'bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-accent text-primary-foreground shadow-lg shadow-primary/10 hover:shadow-primary/25'
                : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-60'
            )}
            onClick={handleBuy}
            disabled={product.in_stock === 0}
          >
            {product.in_stock > 0 ? (
              <>
                <ShoppingCart className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Buy</span>
              </>
            ) : (
              'Sold'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
