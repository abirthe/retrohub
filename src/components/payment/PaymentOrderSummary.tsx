import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Receipt, Zap, ShieldCheck, Lock } from "lucide-react";
import type { Product } from "@/lib/shopApi";

export interface OrderSummaryItem {
  id: string;
  total: number;
  products?: (Product & { id: string; title: string; image_url?: string }) | null;
}

interface PaymentOrderSummaryProps {
  activeOrders: OrderSummaryItem[];
  effectiveOrderIds: string[];
  effectiveTotalPrice: number;
  selectedMethod: "card" | "bkash";
  bkashCharge: number;
  finalBkashTotal: number;
}

export function PaymentOrderSummary({
  activeOrders,
  effectiveOrderIds,
  effectiveTotalPrice,
  selectedMethod,
  bkashCharge,
  finalBkashTotal,
}: PaymentOrderSummaryProps) {
  return (
    <Card className="border-white/10 bg-card/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden sticky top-24">
      <div className="h-1 bg-gradient-to-r from-primary via-accent to-primary" />
      <CardHeader className="pb-4">
        <CardTitle className="font-display text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            Order Summary
          </span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            Payment Pending
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Items Breakdown */}
        {activeOrders.length > 0 && (
          <div className="space-y-2 border-b border-white/5 pb-3">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Items ({activeOrders.length}):
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between text-xs py-1"
                >
                  <span className="text-slate-200 line-clamp-1 flex-1 mr-2">
                    {order.products?.title || `Order #${order.id.slice(0, 8)}`}
                  </span>
                  <span className="font-mono font-medium text-white shrink-0">
                    ৳{Number(order.total).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Order References */}
        {effectiveOrderIds.length > 0 && (
          <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 space-y-1.5">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
              Order Reference:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {effectiveOrderIds.map((id: string) => (
                <span
                  key={id}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-xs font-mono text-primary font-bold"
                >
                  #{id.slice(0, 8)}...
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price Breakdown */}
        <div className="space-y-2.5 text-sm pt-1">
          <div className="flex justify-between text-slate-300">
            <span>Base Amount</span>
            <span className="font-mono font-medium">
              ৳{effectiveTotalPrice.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-slate-300">
            <span className="flex items-center gap-1.5">
              Processing Fee
              {selectedMethod === "bkash" && (
                <span className="text-[10px] text-pink-400 font-semibold">
                  (1% bKash)
                </span>
              )}
            </span>
            <span className="font-mono font-medium">
              {selectedMethod === "bkash" ? (
                `৳${bkashCharge.toFixed(2)}`
              ) : (
                <span className="text-emerald-400">Included</span>
              )}
            </span>
          </div>

          <div className="border-t border-white/10 my-2 pt-3 flex justify-between items-baseline">
            <div className="flex flex-col">
              <span className="font-display text-sm font-bold text-white uppercase tracking-wider">
                Total Payable
              </span>
              <span className="text-[11px] text-slate-400">
                {selectedMethod === "card"
                  ? `~$${(effectiveTotalPrice / 128.02).toFixed(2)} USD via Stripe`
                  : "Final BDT via bKash"}
              </span>
            </div>
            <div className="text-right">
              <span className="font-display font-black text-2xl text-primary drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                ৳
                {selectedMethod === "bkash"
                  ? finalBkashTotal.toFixed(2)
                  : effectiveTotalPrice.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="pt-4 border-t border-white/10 space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary shrink-0" />
            <span>Instant automated digital code delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100% genuine keys & official warranty</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>256-bit bank-grade TLS encryption</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default PaymentOrderSummary;
