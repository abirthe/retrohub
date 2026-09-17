import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export interface CheckoutCartItemsProps {
  items: any[];
  updateQuantity: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
}

export const CheckoutCartItems = ({ items, updateQuantity, removeFromCart }: CheckoutCartItemsProps) => {
  return (
    <Card className="bg-card/50 backdrop-blur-md border-white/5 border overflow-hidden">
      <CardHeader className="bg-white/5 border-b border-white/5">
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          Order Items
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-white/5">
          {items.map((item) => (
            <div key={item.product.id} className="p-4 sm:p-6 flex gap-3 sm:gap-6 items-start hover:bg-white/5 transition-colors">
              <div className="w-14 h-14 sm:w-24 sm:h-24 bg-secondary/50 rounded-lg flex items-center justify-center flex-shrink-0 border border-white/5">
                {item.product.image_url ? (
                  <img src={item.product.image_url} alt={item.product.title} className="w-full h-full object-cover rounded-lg p-1" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <span className="font-display text-xl font-black text-muted-foreground/20">
                    {item.product.platform?.charAt(0)}
                  </span>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <h3 className="font-display text-sm font-bold text-foreground line-clamp-2 leading-snug">{item.product.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1">{item.product.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center rounded-md border border-white/10 bg-background/50">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none hover:bg-white/10"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    >
                      -
                    </Button>
                    <span className="text-xs font-mono w-8 text-center">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-none hover:bg-white/10"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    >
                      +
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => removeFromCart(item.product.id)}
                  >
                    Remove
                  </Button>
                </div>
              </div>

              <div className="text-right shrink-0">
                <p className="font-display text-base sm:text-xl font-bold text-white tracking-tight">
                  ৳{(Number(item.product.sale_price) * item.quantity).toFixed(2)}
                </p>
                <p className="text-xs text-muted-foreground">
                  ৳{Number(item.product.sale_price).toFixed(2)} / unit
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
