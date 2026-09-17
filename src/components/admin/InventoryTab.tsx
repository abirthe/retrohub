import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateProductPrice, type Product } from '@/lib/shopApi';

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
                <th className="p-4 font-semibold opacity-70 min-w-[160px]">Product</th>
                <th className="p-4 font-semibold opacity-70 min-w-[90px]">Type</th>
                <th className="p-4 font-semibold opacity-70 min-w-[70px]">Stock</th>
                <th className="p-4 font-semibold opacity-70 min-w-[100px]">Cost</th>
                <th className="p-4 font-semibold opacity-70 min-w-[100px]">Price</th>
                <th className="p-4 font-semibold opacity-70 text-right min-w-[80px]">Margin</th>
                <th className="p-4 font-semibold opacity-70 text-right min-w-[70px]">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products?.map((p) => (
                <InventoryRow key={p.id} product={p} />
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default InventoryTab;

const InventoryRow = ({ product: p }: { product: Product }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [costPrice, setCostPrice] = useState(p.cost_price.toString());
  const [salePrice, setSalePrice] = useState(p.sale_price.toString());
  const [isSaving, setIsSaving] = useState(false);

  const margin = (((Number(salePrice) - Number(costPrice)) / Number(salePrice)) * 100).toFixed(1);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProductPrice(p.id, Number(salePrice), Number(costPrice));
      toast({ title: 'Success', description: 'Product price updated' });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setCostPrice(p.cost_price.toString());
    setSalePrice(p.sale_price.toString());
    setIsEditing(false);
  };

  return (
    <tr className="hover:bg-white/5 transition-colors group">
      <td className="p-4 font-medium text-foreground group-hover:text-primary transition-colors max-w-[200px]">
        <span className="block truncate" title={p.title}>{p.title}</span>
      </td>
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
      <td className="p-4 text-muted-foreground font-mono text-xs opacity-70">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <span>৳</span>
            <Input 
              type="number" 
              value={costPrice} 
              onChange={(e) => setCostPrice(e.target.value)}
              className="h-7 w-20 px-2 py-1 text-xs" 
            />
          </div>
        ) : (
          `৳${Number(p.cost_price).toFixed(2)}`
        )}
      </td>
      <td className="p-4 font-bold text-white font-mono text-xs">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <span>৳</span>
            <Input 
              type="number" 
              value={salePrice} 
              onChange={(e) => setSalePrice(e.target.value)}
              className="h-7 w-20 px-2 py-1 text-xs font-bold" 
            />
          </div>
        ) : (
          `৳${Number(p.sale_price).toFixed(2)}`
        )}
      </td>
      <td className="p-4 font-display font-bold text-right">
        <span className={cn(
          "px-2 py-1 rounded text-xs border",
          Number(margin) > 0 ? "text-success bg-success/10 border-success/20" : "text-destructive bg-destructive/10 border-destructive/20"
        )}>
          {Number(margin) > 0 ? '+' : ''}{margin}%
        </span>
      </td>
      <td className="p-4 text-right">
        {isEditing ? (
          <div className="flex items-center justify-end gap-1">
            <Button size="icon" variant="ghost" className="h-7 w-7 text-success hover:text-success hover:bg-success/20" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/20" onClick={handleCancel} disabled={isSaving}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="icon" variant="ghost" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => setIsEditing(true)}>
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </td>
    </tr>
  );
};
