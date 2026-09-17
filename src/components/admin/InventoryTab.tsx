import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Product } from '@/lib/shopApi';

interface InventoryTabProps {
  products: Product[] | undefined;
}

const InventoryTab = ({ products }: InventoryTabProps) => {
  return (
    <Card className="bg-card/40 backdrop-blur-xl border-white/10 overflow-hidden shadow-xl">
      <CardHeader className="bg-white/5 border-b border-white/5">
        <CardTitle className="font-display text-lg tracking-wider">Inventory Status</CardTitle>
        <CardDescription>Real-time stock levels and margin analysis</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-black/20 text-muted-foreground font-display text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-4 font-semibold opacity-70">Product</th>
                <th className="p-4 font-semibold opacity-70">Type</th>
                <th className="p-4 font-semibold opacity-70">Stock</th>
                <th className="p-4 font-semibold opacity-70">Cost</th>
                <th className="p-4 font-semibold opacity-70">Price</th>
                <th className="p-4 font-semibold opacity-70 text-right">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products?.map((p) => {
                const margin = (((Number(p.sale_price) - Number(p.cost_price)) / Number(p.sale_price)) * 100).toFixed(1);
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-medium text-foreground group-hover:text-primary transition-colors">{p.title}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="text-[10px] border-white/10 text-muted-foreground bg-secondary/30">
                        {p.delivery_type.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          p.in_stock > 5 ? "bg-success" :
                            p.in_stock > 0 ? "bg-warning" : "bg-destructive animate-pulse"
                        )}></span>
                        <span className={cn(
                          "font-mono font-bold text-xs",
                          p.in_stock > 5 ? "text-success" :
                            p.in_stock > 0 ? "text-warning" : "text-destructive"
                        )}>
                          {p.in_stock}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground font-mono text-xs opacity-70">৳{Number(p.cost_price).toFixed(2)}</td>
                    <td className="p-4 font-bold text-white font-mono text-xs">৳{Number(p.sale_price).toFixed(2)}</td>
                    <td className="p-4 font-display font-bold text-right">
                      <span className="text-success bg-success/10 px-2 py-1 rounded text-xs border border-success/20">
                        +{margin}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryTab;
