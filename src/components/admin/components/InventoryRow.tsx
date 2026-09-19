import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { type Product } from '@/lib/shopApi';
import { EditProductDialog } from './EditProductDialog';

export const InventoryRow = ({ product: p }: { product: Product }) => {
  const { toast } = useToast();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const margin = (((Number(p.sale_price) - Number(p.cost_price)) / Number(p.sale_price)) * 100).toFixed(1);

  return (
    <>
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
            p.in_stock && p.in_stock > 5 ? "bg-success" :
              p.in_stock && p.in_stock > 0 ? "bg-warning" : "bg-destructive animate-pulse"
          )}></span>
          <span className={cn(
            "font-mono font-bold text-xs",
            p.in_stock && p.in_stock > 5 ? "text-success" :
              p.in_stock && p.in_stock > 0 ? "text-warning" : "text-destructive"
          )}>
            {p.in_stock || 0}
          </span>
        </div>
      </td>
      <td className="p-4 text-muted-foreground font-mono text-xs opacity-70">
        ৳{Number(p.cost_price).toFixed(2)}
      </td>
      <td className="p-4 font-bold text-white font-mono text-xs">
        ৳{Number(p.sale_price).toFixed(2)}
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
        <Button 
          variant="ghost" 
          size="sm"
          onClick={() => setIsEditDialogOpen(true)}
          className="h-8 px-2 text-muted-foreground hover:text-white"
        >
          <Edit2 className="w-4 h-4 mr-1" /> Edit
        </Button>
      </td>
    </tr>
    <EditProductDialog product={p} open={isEditDialogOpen} onClose={() => setIsEditDialogOpen(false)} />
    </>
  );
};
