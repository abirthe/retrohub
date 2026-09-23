import { Badge } from '@/components/ui/badge';
import { getRegionLabel } from '@/lib/regions';
import { cn } from '@/lib/utils';

export interface ProductImageAreaProps {
  product: {
    title: string;
    image_url: string | null;
    platform: string;
    category: string;
    region?: string | null;
  };
}

const categoryColor: Record<string, string> = {
  giftcard: 'bg-primary/10 text-primary border-primary/20',
  topup: 'bg-accent/10 text-accent border-accent/20',
  subscription: 'bg-success/10 text-success border-success/20',
  service: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export const ProductImageArea = ({ product }: ProductImageAreaProps) => {
  return (
    <div className="relative aspect-video lg:aspect-[16/9] bg-secondary/30 rounded-2xl border border-white/10 flex items-center justify-center overflow-hidden shadow-2xl group">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent z-0 opacity-50 pointer-events-none" />

      {product.image_url ? (
        <img
          src={product.image_url}
          alt={product.title}
          className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 relative z-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        <span className="font-display text-5xl md:text-8xl font-black text-white/5 tracking-widest select-none transform group-hover:scale-110 transition-transform duration-1000 z-0">
          {product.platform}
        </span>
      )}

      <div className="absolute top-3 inset-x-3 z-20 flex justify-between gap-1.5">
        <Badge variant="outline" className={cn("text-xs backdrop-blur-md px-3 py-1", categoryColor[product.category] || categoryColor.giftcard)}>
          {product.category}
        </Badge>
        <Badge variant="outline" className="text-xs border-white/10 text-muted-foreground backdrop-blur-md px-3 py-1 bg-background/50">
          {getRegionLabel(product.region || 'GLOBAL')}
        </Badge>
      </div>
    </div>
  );
};
