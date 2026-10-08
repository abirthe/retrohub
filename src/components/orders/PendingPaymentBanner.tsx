import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertCircle, CreditCard, X, ArrowRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUnpaidOrders } from "@/hooks/useUnpaidOrders";
import { PaymentCountdownTimer } from "./PaymentCountdownTimer";

export const PendingPaymentBanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const { unpaidOrders, hasUnpaidOrders, latestUnpaidOrder, cancelOrder, reorderToCart } =
    useUnpaidOrders();

  // If dismissed or no unpaid orders, don't show
  if (!hasUnpaidOrders || !latestUnpaidOrder || isDismissed) {
    return null;
  }

  // If already on payment page, hide banner to avoid visual clutter
  if (location.pathname === "/payment") {
    return null;
  }

  const orderIds = unpaidOrders.map((o) => o.id);
  const combinedTotal = unpaidOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  const handleCompletePayment = () => {
    navigate(`/payment?order_ids=${orderIds.join(",")}`, {
      state: {
        orderIds,
        totalPrice: combinedTotal,
      },
    });
  };

  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to cancel this pending order? You can add items back to your cart anytime.")) {
      await cancelOrder(latestUnpaidOrder.id, "Cancelled by user via reminder banner");
      reorderToCart(latestUnpaidOrder);
    }
  };

  return (
    <div className="relative z-40 bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-b border-amber-500/30 backdrop-blur-md text-foreground transition-all duration-300 shadow-[0_4px_20px_rgba(245,158,11,0.15)]">
      <div className="container max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 animate-pulse">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0">
            <span className="font-bold text-amber-300 uppercase tracking-wide text-[11px]">
              Payment Pending
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-slate-200 line-clamp-1">
              Order #{latestUnpaidOrder.id.slice(0, 8)}
              {unpaidOrders.length > 1 && ` (+${unpaidOrders.length - 1} more)`}
              {" "}(৳{combinedTotal.toFixed(2)}) is waiting for payment.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto justify-between sm:justify-end">
          <PaymentCountdownTimer
            createdAt={latestUnpaidOrder.created_at}
            compact
            className="shrink-0"
          />

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleCompletePayment}
              className="h-7 text-xs px-3 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium shadow-sm transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <CreditCard className="w-3.5 h-3.5 mr-1.5" />
              Complete Payment
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={handleCancel}
              title="Cancel unpaid order and return items to cart"
              className="h-7 w-7 text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => setIsDismissed(true)}
              title="Dismiss reminder"
              className="h-7 w-7 text-muted-foreground hover:text-white hover:bg-white/10"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
