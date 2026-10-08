import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  CreditCard,
  Lock,
  AlertCircle,
  Smartphone,
  ArrowLeft,
  Trash2,
  Loader2,
} from "lucide-react";
import { ShopHeader } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import {
  updateOrderTransactionId,
  cancelUnpaidOrder,
  expireStaleOrders,
  type Product,
} from "@/lib/shopApi";
import { supabase } from "@/integrations/supabase/client";
import { isOrderExpired, isOrderUnpaid } from "@/lib/orderPaymentWindow";
import { PaymentCountdownTimer } from "@/components/orders";
import {
  StripeCheckout,
  PaymentMethodSelector,
  type PaymentMethod,
  BkashForm,
  PaymentExpiredCard,
  PaymentOrderSummary,
  type OrderSummaryItem,
} from "@/components/payment";

interface OrderDetail extends OrderSummaryItem {
  status: string;
  created_at: string;
  customer_input?: unknown;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const { addToCart, clearCart } = useCart();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Parse order IDs from location.state or query params (?order_ids=... or ?order_id=...)
  const stateOrderIds: string[] = location.state?.orderIds || [];
  const queryOrderIdsParam = searchParams.get("order_ids");
  const querySingleOrderId = searchParams.get("order_id");

  const parsedQueryIds = useMemo(() => {
    if (queryOrderIdsParam) {
      return queryOrderIdsParam.split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (querySingleOrderId) {
      return [querySingleOrderId.trim()].filter(Boolean);
    }
    return [];
  }, [queryOrderIdsParam, querySingleOrderId]);

  const targetOrderIds = stateOrderIds.length > 0 ? stateOrderIds : parsedQueryIds;

  // Query order records from database
  const {
    data: fetchedOrders = [],
    isLoading: isFetchingOrders,
    refetch: refetchOrders,
  } = useQuery({
    queryKey: ["payment-order-details", targetOrderIds, user?.id],
    queryFn: async () => {
      if (targetOrderIds.length > 0) {
        const { data, error } = await supabase
          .from("orders")
          .select("*, products(*)")
          .in("id", targetOrderIds);
        if (error) throw error;
        return (data || []) as unknown as OrderDetail[];
      }

      // Fallback: If no order IDs were provided in state or URL, look for user's latest unpaid pending orders
      if (user) {
        const { data, error } = await supabase
          .from("orders")
          .select("*, products(*)")
          .eq("user_id", user.id)
          .eq("status", "pending")
          .order("created_at", { ascending: false });
        if (error) throw error;
        return (data || []) as unknown as OrderDetail[];
      }

      return [];
    },
    enabled: !authLoading && (targetOrderIds.length > 0 || !!user),
  });

  const activeOrders = useMemo(() => {
    return fetchedOrders.filter((o) => isOrderUnpaid(o));
  }, [fetchedOrders]);

  const effectiveOrderIds = useMemo(() => {
    if (activeOrders.length > 0) {
      return activeOrders.map((o) => o.id);
    }
    return targetOrderIds;
  }, [activeOrders, targetOrderIds]);

  const effectiveTotalPrice = useMemo(() => {
    if (activeOrders.length > 0) {
      return activeOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    }
    return Number(location.state?.totalPrice) || 0;
  }, [activeOrders, location.state?.totalPrice]);

  // Earliest created_at among the orders to enforce strict 30-minute window
  const earliestCreatedAt = useMemo(() => {
    if (activeOrders.length > 0) {
      return activeOrders.reduce((earliest, o) => {
        if (!earliest) return o.created_at;
        return new Date(o.created_at).getTime() < new Date(earliest).getTime()
          ? o.created_at
          : earliest;
      }, activeOrders[0].created_at);
    }
    return null;
  }, [activeOrders]);

  const isExpired = earliestCreatedAt ? isOrderExpired(earliestCreatedAt) : false;

  // Background auto-expire stale orders if any found
  useEffect(() => {
    if (isExpired && activeOrders.length > 0) {
      expireStaleOrders().then(() => {
        queryClient.invalidateQueries({ queryKey: ["user-orders"] });
        queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
      });
    }
  }, [isExpired, activeOrders.length, queryClient]);

  // Pricing calculations
  const bkashCharge = useMemo(() => {
    return Math.round(effectiveTotalPrice * 0.01 * 100) / 100;
  }, [effectiveTotalPrice]);

  const finalBkashTotal = useMemo(() => {
    return effectiveTotalPrice + bkashCharge;
  }, [effectiveTotalPrice, bkashCharge]);

  const handleSubmitBkash = async (transactionId: string) => {
    const cleanTrx = transactionId.trim().toUpperCase();
    if (!cleanTrx) {
      toast({
        title: "Transaction ID Required",
        description: "Please enter your bKash transaction ID (TrxID).",
        variant: "destructive",
      });
      return;
    }

    if (cleanTrx.length < 6) {
      toast({
        title: "Invalid TrxID",
        description: "Transaction ID must be at least 6 characters.",
        variant: "destructive",
      });
      return;
    }

    if (isExpired) {
      toast({
        title: "Order Expired",
        description: "This reservation has expired. Please re-order.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (effectiveOrderIds.length > 0) {
        await updateOrderTransactionId(effectiveOrderIds, cleanTrx);
      }

      toast({
        title: "Payment Submitted! 🚀",
        description: `TrxID ${cleanTrx} received. Our verification team is triaging your order now.`,
      });

      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
      queryClient.invalidateQueries({ queryKey: ["payment-order-details"] });

      clearCart();
      navigate("/orders");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to record payment";
      toast({
        title: "Submission Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAndRestore = async () => {
    if (effectiveOrderIds.length === 0) return;
    if (
      !confirm(
        "Are you sure you want to cancel this order reservation? Your items will be added back to your cart.",
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      for (const order of activeOrders) {
        if (order.products) {
          addToCart(order.products as unknown as Product, 1);
        }
      }

      for (const id of effectiveOrderIds) {
        await cancelUnpaidOrder(id, "Cancelled from payment screen by customer");
      }

      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });

      toast({
        title: "Order Cancelled",
        description: "Items have been restored to your cart.",
      });

      navigate("/checkout");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to cancel order";
      toast({
        title: "Cancellation Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReorderExpired = () => {
    for (const order of activeOrders) {
      if (order.products) {
        addToCart(order.products as unknown as Product, 1);
      }
    }
    toast({
      title: "Restored to Cart",
      description: "Items added back to your cart. Please proceed through checkout.",
    });
    navigate("/checkout");
  };

  return (
    <div className="min-h-screen relative selection:bg-primary/20 text-foreground">
      {/* Subtle Ambient Radial Highlight */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(0,240,255,0.08)_0%,transparent_70%)]" />
      </div>

      <ShopHeader />

      <main className="container relative z-10 py-8 sm:py-12 lg:py-16 max-w-6xl mx-auto px-4">
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
          <Button
            variant="ghost"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/orders");
            }}
            className="font-display text-xs tracking-wider text-muted-foreground hover:text-white self-start px-0 hover:bg-transparent"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Checkout
          </Button>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 text-xs font-mono tracking-wider self-start sm:self-auto">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary border border-primary/40 flex items-center justify-center text-[10px] font-bold">
                1
              </span>
              Cart
            </span>
            <span className="text-muted-foreground/40">──</span>
            <span className="flex items-center gap-1.5 text-primary font-bold">
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shadow-[0_0_10px_rgba(0,240,255,0.5)]">
                2
              </span>
              Payment
            </span>
            <span className="text-muted-foreground/40">──</span>
            <span className="flex items-center gap-1.5 text-muted-foreground/60">
              <span className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px]">
                3
              </span>
              Delivery
            </span>
          </div>
        </div>

        {/* 30-Minute Payment Timer Banner (Active) */}
        {!isExpired && earliestCreatedAt && (
          <div className="mb-6 animate-in fade-in duration-300">
            <PaymentCountdownTimer
              createdAt={earliestCreatedAt}
              showProgress
              onExpire={() => {
                refetchOrders();
              }}
            />
          </div>
        )}

        {/* Expired State Callout */}
        {isExpired ? (
          <PaymentExpiredCard onReorder={handleReorderExpired} />
        ) : (
          /* Normal Payment Flow */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Payment Methods & Input (7 cols) */}
            <div className="lg:col-span-7 xl:col-span-8 space-y-6">
              <div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-white mb-2">
                  Complete Payment
                </h1>
                <p className="text-slate-400 text-sm">
                  Choose your payment gateway below. Complete your transaction before the 30-minute timer expires.
                </p>
              </div>

              {/* Payment Method Selector */}
              <PaymentMethodSelector
                selectedMethod={selectedMethod}
                onSelectMethod={setSelectedMethod}
              />

              {/* Active Payment View: Stripe */}
              {selectedMethod === "card" && (
                <Card className="border-primary/20 bg-card/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden animate-in fade-in duration-300">
                  <div className="h-1 bg-gradient-to-r from-primary via-cyan-400 to-primary/20" />
                  <CardHeader className="pb-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <CardTitle className="font-display text-lg sm:text-xl flex items-center gap-2">
                        <CreditCard className="w-5 h-5 text-primary" />
                        Pay with Card Securely
                      </CardTitle>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-mono text-primary">
                        <Lock className="w-3 h-3" /> Stripe 256-bit SSL
                      </span>
                    </div>
                    <CardDescription className="text-slate-300 text-xs sm:text-sm">
                      Enter your card details below. Verification is instant and keys are issued automatically.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    {effectiveOrderIds.length > 0 ? (
                      effectiveTotalPrice > 0 && effectiveTotalPrice < 65 ? (
                        <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm space-y-3">
                          <div className="flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                            <div>
                              <p className="font-semibold text-amber-200">
                                Minimum Amount for International Card Processing
                              </p>
                              <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                                Stripe requires international card transactions to convert to at least $0.50 USD (approx. ৳65 BDT). Your order total is <strong>৳{effectiveTotalPrice.toFixed(2)}</strong>.
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2.5 pt-1">
                            <Button
                              size="sm"
                              type="button"
                              onClick={() => setSelectedMethod("bkash")}
                              className="bg-pink-600 hover:bg-pink-500 text-white font-medium text-xs shadow-md"
                            >
                              <Smartphone className="w-3.5 h-3.5 mr-1.5" />
                              Pay with bKash (No Minimum)
                            </Button>
                            <Link to="/checkout">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs"
                              >
                                Add More Items
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <StripeCheckout orderIds={effectiveOrderIds} />
                      )
                    ) : isFetchingOrders || authLoading ? (
                      <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
                        <Loader2 className="w-5 h-5 animate-spin text-primary" />
                        <span>Loading order reservation...</span>
                      </div>
                    ) : (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        No active order found. Please start from your cart.
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Active Payment View: bKash */}
              {selectedMethod === "bkash" && (
                <BkashForm
                  onSubmit={handleSubmitBkash}
                  isSubmitting={isSubmitting}
                  isExpired={isExpired}
                />
              )}

              {/* Cancel Reservation & Return to Store option */}
              <div className="pt-2 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleCancelAndRestore}
                  disabled={isCancelling}
                  className="text-xs text-muted-foreground hover:text-rose-400 hover:bg-rose-500/10 px-3"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                  Cancel Order & Return Items to Cart
                </Button>
                <Link to="/orders" className="text-xs text-muted-foreground hover:text-primary">
                  View Order History →
                </Link>
              </div>
            </div>

            {/* Right Column: Order Summary & Trust Guarantee (5 cols) */}
            <div className="lg:col-span-5 xl:col-span-4 space-y-6">
              <PaymentOrderSummary
                activeOrders={activeOrders}
                effectiveOrderIds={effectiveOrderIds}
                effectiveTotalPrice={effectiveTotalPrice}
                selectedMethod={selectedMethod}
                bkashCharge={bkashCharge}
                finalBkashTotal={finalBkashTotal}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Payment;
