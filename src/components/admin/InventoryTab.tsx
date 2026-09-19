import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Save, X, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { updateProductPrice, type Product } from '@/lib/shopApi';
import { InventoryRow } from './components/InventoryRow';

interface InventoryTabProps {
  products: Product[] | undefined;
}

const InventoryTab = ({ products }: InventoryTabProps) => {
  const groupedProducts = products?.reduce((acc, product) => {
    const cat = product.category || 'other';
    if (!acc[cat]) {
      acc[cat] = [];
    }
    acc[cat].push(product);
    return acc;
  }, {} as Record<string, Product[]>) || {};

  return (
    <Card className="bg-card/40 backdrop-blur-xl border-white/10 overflow-hidden shadow-xl">
      <CardHeader className="bg-white/5 border-b border-white/5">
        <CardTitle className="font-display text-lg tracking-wider">Inventory Status</CardTitle>
        <CardDescription>Category-based stock levels and margin analysis</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(groupedProducts).map(([category, categoryProducts]) => (
            <AccordionItem key={category} value={category} className="border-white/5">
              <AccordionTrigger className="px-6 py-4 hover:bg-white/5 hover:no-underline transition-colors data-[state=open]:bg-white/5">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-primary" />
                  <span className="font-display font-bold text-base capitalize">{category.replace(/_/g, ' ')}</span>
                  <Badge variant="outline" className="ml-2 bg-background/50 text-[10px]">
                    {categoryProducts.length} {categoryProducts.length === 1 ? 'item' : 'items'}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-black/40 text-muted-foreground font-display text-[10px] uppercase tracking-wider border-y border-white/5">
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
                      {categoryProducts.map((p) => (
                        <InventoryRow key={p.id} product={p} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
};

export default InventoryTab;
