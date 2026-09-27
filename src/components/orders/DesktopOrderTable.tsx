import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, CheckCircle2, Copy, Check, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Delivery, Order } from '@/lib/shopApi';
import { Button } from '@/components/ui/button';

export interface DesktopOrderTableProps {
  orders: (Order & { products?: { platform?: string; title?: string }; deliveries?: Delivery[] })[];
  statusStyles: Record<string, { className: string; icon: React.ReactNode; label: string }>;
}

export const DesktopOrderTable = ({ orders, statusStyles }: DesktopOrderTableProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="hidden sm:block overflow-x-auto">
      <Table>
        <TableHeader className="bg-secondary/40 border-b border-white/5">
          <TableRow className="border-white/5 hover:bg-transparent">
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4 pl-6">Order ID</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Product</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Status</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Total</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Date</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">Delivery & Keys</TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4 pr-6 text-right">Support</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusStyles[order.status || 'pending'] || statusStyles.pending;
            const orderDate = new Date(order.created_at || '').toLocaleDateString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const orderDeliveries = (order.deliveries as unknown as Delivery[]) || [];
            const shortId = order.id.slice(0, 8);
            const telegramSupportUrl = `https://t.me/retrochanbot?start=order_${shortId}`;

            return (
              <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.02] transition-colors group">
                <TableCell className="font-mono text-xs text-muted-foreground pl-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">#{shortId}</span>
                    <span className="text-[10px] text-muted-foreground opacity-60">ID prefix</span>
                  </div>
                </TableCell>

                <TableCell className="text-sm font-medium text-foreground">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-secondary/80 border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {order.products?.platform?.charAt(0) || '🎮'}
                    </span>
                    <div>
                      <p className="line-clamp-1">{order.products?.title || 'Unknown Product'}</p>
                      <p className="text-[10px] text-muted-foreground font-normal">{order.products?.platform || 'Global'}</p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-normal px-2.5 py-0.5 flex items-center gap-1.5 w-fit transition-colors',
                      status.className
                    )}
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
                    <Calendar className="w-3.5 h-3.5 opacity-50" />
                    {orderDate}
                  </div>
                </TableCell>

                <TableCell className="max-w-[260px]">
                  {orderDeliveries.length > 0 ? (
                    <div className="text-xs space-y-1.5 py-1">
                      {orderDeliveries.map((delivery) => (
                        <div
                          key={delivery.id}
                          className="flex items-center justify-between gap-1.5 bg-success/5 border border-success/20 rounded-md p-1.5"
                        >
                          <span className="font-mono text-xs text-success select-all break-all line-clamp-1">
                            {delivery.delivery_code}
                          </span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleCopy(delivery.id, delivery.delivery_code)}
                            className="h-6 w-6 p-0 shrink-0 text-success hover:bg-success/20 hover:text-success"
                            title="Copy code"
                          >
                            {copiedId === delivery.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-success" />
                        <span>Ready to redeem</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground italic opacity-60">
                      {order.status === 'sourcing' ? '⚡ Sourcing key...' : '⏳ Awaiting verification...'}
                    </div>
                  )}
                </TableCell>

                <TableCell className="pr-6 text-right">
                  <a
                    href={telegramSupportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/20 shadow-sm"
                  >
                    <Send className="w-3 h-3 rotate-45" />
                    <span>Telegram Bot</span>
                    <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
                  </a>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
