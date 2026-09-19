import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Delivery, Order } from '@/lib/shopApi';

export interface DesktopOrderTableProps {
  orders: (Order & { products?: { platform?: string; title?: string }; deliveries?: Delivery[] })[];
  statusStyles: Record<string, { className: string; icon: React.ReactNode; label: string }>;
}

export const DesktopOrderTable = ({ orders, statusStyles }: DesktopOrderTableProps) => {
  return (
    <div className="hidden sm:block overflow-x-auto">
      <Table>
        <TableHeader className="bg-secondary/50">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4 pl-6">Order ID</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Product</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Status</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Total</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Date</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4 pr-6">Delivery</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusStyles[order.status || 'pending'] || statusStyles.pending;
            const orderDate = new Date(order.created_at || '').toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            });
            const orderDeliveries = (order.deliveries as unknown as Delivery[]) || [];

            return (
              <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                <TableCell className="font-mono text-xs text-muted-foreground pl-6">
                  #{order.id.slice(0, 8)}
                </TableCell>

                <TableCell className="text-sm font-medium text-foreground">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded bg-background/50 border border-white/5 flex items-center justify-center text-[10px] text-muted-foreground">
                      {order.products?.platform?.charAt(0) || '?'}
                    </span>
                    {order.products?.title || 'Unknown Product'}
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn("text-[10px] font-normal px-2.5 py-0.5 flex items-center gap-1.5 w-fit transition-colors", status.className)}
                  >
                    {status.icon}
                    {status.label}
                  </Badge>
                </TableCell>

                <TableCell className="font-display text-sm font-bold text-white group-hover:text-primary transition-colors">
                  ৳{Number(order.total).toFixed(2)}
                </TableCell>

                <TableCell className="text-xs text-muted-foreground tabular-nums">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3 h-3 opacity-50" />
                    {orderDate}
                  </div>
                </TableCell>

                <TableCell className="pr-6 max-w-[200px]">
                  {orderDeliveries.length > 0 ? (
                    <div className="text-xs space-y-1.5 animate-in fade-in slide-in-from-left-2 duration-500">
                      {orderDeliveries.map((delivery) => (
                        <div key={delivery.id} className="font-mono text-success whitespace-pre-wrap bg-success/5 p-2 rounded border border-success/20 select-all selection:bg-success/30 max-h-40 overflow-y-auto">
                          {delivery.delivery_code}
                        </div>
                      ))}
                      <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        Delivered
                      </p>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic opacity-50">
                      Awaiting completion...
                    </div>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
