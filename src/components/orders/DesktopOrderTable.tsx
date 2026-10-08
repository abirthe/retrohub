import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Calendar,
  CheckCircle2,
  Copy,
  Check,
  CreditCard,
  Trash2,
  RotateCcw,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Delivery, Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { isOrderUnpaid, isOrderExpired } from "@/lib/orderPaymentWindow";
import { PaymentCountdownTimer } from "./PaymentCountdownTimer";

export interface DesktopOrderTableProps {
  orders: (Order & {
    products?: { id?: string; platform?: string; title?: string; [key: string]: unknown } | null;
    deliveries?: Delivery[];
  })[];
  statusStyles: Record<
    string,
    { className: string; icon: React.ReactNode; label: string }
  >;
  onCompletePayment?: (orderId: string, total: number) => void;
  onCancelOrder?: (orderId: string) => void;
  onReorder?: (order: Order & { products?: unknown }) => void;
}

export const DesktopOrderTable = ({
  orders,
  statusStyles,
  onCompletePayment,
  onCancelOrder,
  onReorder,
}: DesktopOrderTableProps) => {
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
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4 pl-6">
              Order ID
            </TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">
              Product
            </TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">
              Status
            </TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">
              Total
            </TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4">
              Date
            </TableHead>
            <TableHead className="text-muted-foreground font-display text-xs tracking-wider py-4 pr-6">
              Delivery & Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isUnpaid = isOrderUnpaid(order);
            const expired = isOrderExpired(order.created_at);

            const status =
              statusStyles[order.status || "pending"] || statusStyles.pending;
            const orderDate = new Date(
              order.created_at || "",
            ).toLocaleDateString(undefined, {
              year: "numeric",
              month: "short",
              day: "numeric",
            });
            const orderDeliveries =
              (order.deliveries as unknown as Delivery[]) || [];
            const shortId = order.id.slice(0, 8);

            return (
              <TableRow
                key={order.id}
                className={cn(
                  "border-white/5 hover:bg-white/[0.02] transition-colors group",
                  isUnpaid && !expired && "bg-amber-500/[0.03]",
                )}
              >
                <TableCell className="font-mono text-xs text-muted-foreground pl-6">
                  <div className="flex flex-col">
                    <span className="font-bold text-foreground">
                      #{shortId}
                    </span>
                    <span className="text-[10px] text-muted-foreground opacity-60">
                      ID prefix
                    </span>
                  </div>
                </TableCell>

                <TableCell className="text-sm font-medium text-foreground">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-lg bg-secondary/80 border border-white/10 flex items-center justify-center text-[10px] font-bold text-primary">
                      {order.products?.platform?.charAt(0) || "🎮"}
                    </span>
                    <div>
                      <p className="line-clamp-1">
                        {order.products?.title || "Unknown Product"}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-normal">
                        {order.products?.platform || "Global"}
                      </p>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  {isUnpaid && !expired ? (
                    <div className="space-y-1">
                      <Badge
                        variant="outline"
                        className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] font-normal px-2.5 py-0.5 flex items-center gap-1.5 w-fit"
                      >
                        <AlertTriangle className="h-3 w-3 text-amber-400" />
                        Awaiting Payment
                      </Badge>
                      <PaymentCountdownTimer
                        createdAt={order.created_at}
                        compact
                        className="text-[10px]"
                      />
                    </div>
                  ) : isUnpaid && expired ? (
                    <Badge
                      variant="outline"
                      className="bg-rose-500/10 text-rose-400 border-rose-500/30 text-[10px] font-normal px-2.5 py-0.5 flex items-center gap-1.5 w-fit"
                    >
                      Payment Expired
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-normal px-2.5 py-0.5 flex items-center gap-1.5 w-fit transition-colors",
                        status.className,
                      )}
                    >
                      {status.icon}
                      {status.label}
                    </Badge>
                  )}
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

                <TableCell className="max-w-[320px] pr-6">
                  {/* Case 1: Unpaid and still within 30-min window */}
                  {isUnpaid && !expired ? (
                    <div className="flex items-center gap-2 py-1">
                      <Button
                        size="sm"
                        onClick={() =>
                          onCompletePayment?.(order.id, Number(order.total))
                        }
                        className="h-8 text-xs px-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                        Complete Payment
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onCancelOrder?.(order.id)}
                        title="Cancel this unpaid order"
                        className="h-8 px-2.5 text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Cancel
                      </Button>
                    </div>
                  ) : isUnpaid && expired ? (
                    /* Case 2: Unpaid and expired (> 30 mins) */
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs text-rose-400/80 italic">
                        Window expired
                      </span>
                      {onReorder && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReorder(order)}
                          className="h-7 text-xs border-white/10 hover:border-primary/40 text-foreground hover:text-primary"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Re-order
                        </Button>
                      )}
                    </div>
                  ) : orderDeliveries.length > 0 ? (
                    /* Case 3: Fulfilled deliveries */
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
                            onClick={() =>
                              handleCopy(delivery.id, delivery.delivery_code)
                            }
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
                  ) : order.status === "cancelled" ? (
                    /* Case 4: Cancelled order */
                    <div className="flex items-center gap-2 py-1">
                      <span className="text-xs text-muted-foreground italic opacity-70">
                        {order.final_output || "Cancelled"}
                      </span>
                      {onReorder && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onReorder(order)}
                          className="h-7 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <RotateCcw className="w-3 h-3 mr-1" />
                          Re-order
                        </Button>
                      )}
                    </div>
                  ) : (
                    /* Case 5: In progress */
                    <div className="text-xs text-muted-foreground italic opacity-60">
                      {order.status === "sourcing"
                        ? "⚡ Sourcing key..."
                        : "⏳ Awaiting verification..."}
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
