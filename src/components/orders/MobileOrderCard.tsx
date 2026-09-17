import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Delivery } from '@/lib/shopApi';

export interface MobileOrderCardProps {
  order: any;
  statusStyle: { className: string; icon: React.ReactNode; label: string };
  orderDate: string;
}

export const MobileOrderCard = ({ order, statusStyle, orderDate }: MobileOrderCardProps) => {
  const orderDeliveries = (order.deliveries as unknown as Delivery[]) || [];

  return (
    <div className="p-4 space-y-3 hover:bg-white/5 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-display text-sm font-bold text-foreground line-clamp-1">
            {order.products?.title || 'Unknown Product'}
          </p>
          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">#{order.id.slice(0, 8)}</p>
        </div>
        <Badge
          variant="outline"
          className={cn('text-[10px] font-normal px-2 py-0.5 flex items-center gap-1 shrink-0', statusStyle.className)}
        >
          {statusStyle.icon}
          {statusStyle.label}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Calendar className="w-3 h-3 opacity-50" />
          {orderDate}
        </span>
        <span className="font-display font-bold text-white">৳{Number(order.total).toFixed(2)}</span>
      </div>

      {orderDeliveries.length > 0 ? (
        <div className="text-xs space-y-2">
          {orderDeliveries.map((delivery) => (
            <div key={delivery.id} className="font-mono text-success whitespace-pre-wrap bg-success/5 p-2 rounded border border-success/20 select-all max-h-28 overflow-y-auto break-all">
              {delivery.delivery_code}
            </div>
          ))}
          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-success" />
            Delivered
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground italic opacity-50">Awaiting completion...</p>
      )}
    </div>
  );
};
