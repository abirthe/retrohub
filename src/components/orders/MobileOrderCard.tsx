import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2, Copy, Check, Send, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Delivery, Order } from '@/lib/shopApi';
import { Button } from '@/components/ui/button';

export interface MobileOrderCardProps {
  order: Order & { products?: unknown; deliveries?: unknown };
  statusStyle: { className: string; icon: React.ReactNode; label: string };
  orderDate: string;
}

export const MobileOrderCard = ({ order, statusStyle, orderDate }: MobileOrderCardProps) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const orderDeliveries = (order.deliveries as unknown as Delivery[]) || [];
  const telegramSupportUrl = `https://t.me/retrochanbot?start=order_${order.id.slice(0, 8)}`;

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isCompleted = order.status === 'fulfilled';
  const isProcessing = ['payment_verified', 'sourcing', 'payment_submitted'].includes(order.status || '');

  return (
    <div className="p-4 space-y-3 hover:bg-white/[0.02] transition-colors border-b border-white/5 last:border-b-0">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-bold text-foreground line-clamp-1">
            {(order.products as { title?: string } | null)?.title || 'Unknown Product'}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground font-mono">#{order.id.slice(0, 8)}</span>
            <span className="text-[10px] text-primary/70 font-sans">• Instant Delivery</span>
          </div>
        </div>
        <Badge
          variant="outline"
          className={cn('text-[10px] font-normal px-2 py-0.5 flex items-center gap-1 shrink-0', statusStyle.className)}
        >
          {statusStyle.icon}
          {statusStyle.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm py-1 bg-white/[0.02] px-2.5 rounded-md border border-white/5">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3.5 h-3.5 opacity-50" />
          {orderDate}
        </span>
        <span className="font-display font-bold text-white tracking-wide">৳{Number(order.total).toFixed(2)}</span>
      </div>

      {/* Progress pill */}
      <div className="w-full bg-secondary/50 rounded-full h-1.5 overflow-hidden">
        <div
          className={cn(
            'h-full transition-all duration-500',
            isCompleted ? 'bg-success w-full' : isProcessing ? 'bg-primary w-2/3 animate-pulse' : 'bg-amber-500 w-1/3'
          )}
        />
      </div>

      {orderDeliveries.length > 0 ? (
        <div className="text-xs space-y-2 pt-1">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground font-medium">
            <span className="flex items-center gap-1 text-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Delivered Credentials:
            </span>
          </div>
          {orderDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="relative group bg-success/5 border border-success/20 rounded-lg p-2.5 flex items-start justify-between gap-2"
            >
              <div className="font-mono text-xs text-success break-all select-all flex-1 whitespace-pre-wrap">
                {delivery.delivery_code}
                {delivery.delivery_notes && (
                  <p className="text-[10px] text-muted-foreground mt-1 font-sans">{delivery.delivery_notes}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(delivery.id, delivery.delivery_code)}
                className="h-7 w-7 p-0 shrink-0 text-success hover:bg-success/20 hover:text-success"
                title="Copy code"
              >
                {copiedId === delivery.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-1 px-2.5 rounded bg-secondary/30 text-xs text-muted-foreground flex items-center justify-between">
          <span className="italic opacity-70">
            {order.status === 'sourcing' ? 'Sourcing game key from supplier...' : 'Waiting for payment verification...'}
          </span>
        </div>
      )}

      {/* Action Footer with Telegram Support Launcher */}
      <div className="pt-2 flex items-center justify-between gap-2 border-t border-white/5">
        <a
          href={telegramSupportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[11px] text-cyan-400 hover:text-cyan-300 font-medium transition-colors bg-cyan-500/10 hover:bg-cyan-500/20 px-2.5 py-1.5 rounded-md border border-cyan-500/20"
        >
          <Send className="w-3 h-3 rotate-45" />
          <span>Telegram Concierge</span>
          <Sparkles className="w-2.5 h-2.5 text-cyan-300 animate-pulse" />
        </a>

        <span className="text-[10px] text-muted-foreground">24/7 AI + Staff Support</span>
      </div>
    </div>
  );
};
