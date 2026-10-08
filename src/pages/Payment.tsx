import { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  CreditCard,
  ShieldCheck,
  Zap,
  Lock,
  Receipt,
  Headphones,
  Check,
  AlertCircle,
  AlertTriangle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { ShopHeader } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import {
  updateOrderTransactionId,
  cancelUnpaidOrder,
  expireStaleOrders,
  type Product,
} from "@/lib/shopApi";
import { supabase } from "@/integrations/supabase/client";
import { isOrderExpired, isOrderUnpaid } from "@/lib/orderPaymentWindow";
import { PaymentCountdownTimer } from "@/components/orders";
import { BkashPayment, StripeCheckout } from "@/components/payment";

type PaymentMethod = "card" | "bkash";

interface OrderDetail {
  id: string;
  total: number;
  status: string;
  created_at: string;
  customer_input?: unknown;
  products?: (Product & { id: string; title: string; image_url?: string }) | null;
}

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const { addToCart, clearCart } = useCart();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [transactionId, setTransactionId] = useState("");
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
    enabled: true,
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

  // If expired, trigger background cleanup
  useEffect(() => {
    if (isExpired && activeOrders.length > 0) {
      expireStaleOrders().then(() => {
        queryClient.invalidateQueries({ queryKey: ["user-orders"] });
        queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
      });
    }
  }, [isExpired, activeOrders.length, queryClient]);

  const bkashCharge = effectiveTotalPrice * 0.01;
  const finalBkashTotal = effectiveTotalPrice * 1.01;

  const handleSubmitBkash = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isExpired) {
      toast({
        title: "Order Expired",
        description: "The 30-minute payment window has expired. Please re-order.",
        variant: "destructive",
      });
      return;
    }

    const trimmed = transactionId.trim();
    if (!trimmed || !/^[A-Z0-9]{6,30}$/i.test(trimmed)) {
      toast({
        title: "Invalid Transaction ID",
        description:
          "Transaction ID must be 6–30 alphanumeric characters (letters and numbers only).",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (effectiveOrderIds.length > 0) {
        await updateOrderTransactionId(effectiveOrderIds, trimmed);
        clearCart();
        queryClient.invalidateQueries({ queryKey: ["user-orders"] });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast({
        title: "Payment Submitted",
        description:
          "Your transaction ID has been received. We will verify it shortly.",
        className: "bg-success text-success-foreground",
      });

      setTimeout(() => {
        navigate("/orders");
      }, 1500);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update payment status.";
      toast({
        title: "Submission Failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelAndRestore = async () => {
    if (
      !confirm(
        "Are you sure you want to cancel this payment? The items will be returned to your cart.",
      )
    ) {
      return;
    }

    setIsCancelling(true);
    try {
      for (const order of activeOrders) {
        await cancelUnpaidOrder(order.id, "Cancelled by user on payment page");
        if (order.products) {
          addToCart(order.products as unknown as Product, 1);
        }
      }

      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });

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
          <Card className="border-rose-500/30 bg-card/40 backdrop-blur-xl p-8 text-center space-y-6 shadow-[0_0_30px_rgba(244,63,94,0.15)] animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400">
              <AlertTriangle className="w-8 h-8 animate-bounce" />
            </div>
            <div className="space-y-2 max-w-lg mx-auto">
              <h2 className="font-display text-2xl font-bold text-white tracking-wide">
                Payment Window Expired
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Orders are reserved for <strong>30 minutes</strong> to ensure inventory availability. Because payment was not completed within the time limit, this order reservation has been released.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={handleReorderExpired}
                className="gradient-primary text-sm font-display tracking-wider px-6 h-11 gap-2 shadow-lg shadow-primary/20"
              >
                <RotateCcw className="w-4 h-4" />
                Restore Items to Cart & Re-order
              </Button>
              <Link to="/orders">
                <Button
                  variant="outline"
                  className="text-sm font-display tracking-wider h-11 border-white/10"
                >
                  View All Orders
                </Button>
              </Link>
            </div>
          </Card>
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
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                  Select Payment Method
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Card Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("card")}
                    className={cn(
                      "relative flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 group cursor-pointer backdrop-blur-md",
                      selectedMethod === "card"
                        ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(0,240,255,0.3)] ring-1 ring-primary/40"
                        : "border-white/10 bg-card/25 hover:bg-card/40 hover:border-white/20",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        selectedMethod === "card"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-secondary/60 text-muted-foreground group-hover:text-primary group-hover:bg-primary/20",
                      )}
                    >
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-display text-sm font-bold tracking-wide text-white">
                          Card Payment
                        </span>
                        {selectedMethod === "card" && (
                          <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Visa, Mastercard, Amex, Intl
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        ⚡ Instant Automated Delivery
                      </span>
                    </div>
                  </button>

                  {/* bKash Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedMethod("bkash")}
                    className={cn(
                      "relative flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 group cursor-pointer backdrop-blur-md",
                      selectedMethod === "bkash"
                        ? "border-pink-500 bg-pink-500/10 shadow-[0_0_20px_-5px_rgba(244,114,182,0.3)] ring-1 ring-pink-500/40"
                        : "border-white/10 bg-card/25 hover:bg-card/40 hover:border-pink-500/40",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                        selectedMethod === "bkash"
                          ? "bg-pink-500 text-white shadow-sm"
                          : "bg-secondary/60 text-muted-foreground group-hover:text-pink-400 group-hover:bg-pink-500/20",
                      )}
                    >
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-display text-sm font-bold tracking-wide text-white">
                          bKash Send Money
                        </span>
                        {selectedMethod === "bkash" && (
                          <span className="w-4 h-4 rounded-full bg-pink-500 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Personal / Agent Transfer
                      </p>
                      <span className="inline-block mt-2 px-2 py-0.5 rounded text-[10px] font-semibold bg-pink-500/10 text-pink-400 border border-pink-500/20">
                        Official Account (+1% Fee)
                      </span>
                    </div>
                  </button>
                </div>
              </div>

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
                            <Link to="/">
                              <Button
                                size="sm"
                                type="button"
                                variant="outline"
                                className="text-xs border-amber-500/30 hover:bg-amber-500/10 text-amber-200"
                              >
                                Add More Items
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <StripeCheckout orderIds={effectiveOrderIds} />
                      )
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
                <div className="space-y-6 animate-in fade-in duration-300">
                  <Card className="border-pink-500/20 bg-card/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
                    <div className="h-1 bg-gradient-to-r from-pink-500 via-pink-400 to-pink-500/20" />
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between gap-2">
                        <CardTitle className="font-display text-lg sm:text-xl flex items-center gap-2 text-pink-400">
                          <Smartphone className="w-5 h-5" />
                          Official bKash Send Money
                        </CardTitle>
                        <span className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-xs font-mono text-pink-400">
                          Manual Verification
                        </span>
                      </div>
                      <CardDescription className="text-slate-300 text-xs sm:text-sm">
                        Send the exact total amount to our verified personal bKash account, then submit your transaction ID below.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <BkashPayment />
                    </CardContent>
                  </Card>

                  {/* Transaction ID Submission Form */}
                  <Card className="border-white/10 bg-card/30 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden">
                    <CardHeader className="pb-3">
                      <CardTitle className="font-display text-base sm:text-lg flex items-center gap-2">
                        <Receipt className="w-4 h-4 text-primary" />
                        Confirm Your Transaction
                      </CardTitle>
                      <CardDescription className="text-slate-300 text-xs">
                        Enter the 10-character transaction ID received via SMS after sending money.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={handleSubmitBkash} className="space-y-4">
                        <div className="space-y-2">
                          <Label
                            htmlFor="trx-id"
                            className="text-xs uppercase tracking-wider text-muted-foreground font-semibold"
                          >
                            Transaction ID (TrxID)
                          </Label>
                          <div className="relative">
                            <Input
                              id="trx-id"
                              placeholder="e.g. 9H7G6F5D4S"
                              value={transactionId}
                              onChange={(e) => setTransactionId(e.target.value)}
                              className="font-mono uppercase placeholder:normal-case border-pink-500/30 focus-visible:ring-pink-500/50 text-lg py-5 bg-white/[0.04]"
                            />
                            {transactionId.length >= 6 && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-400 animate-in zoom-in">
                                <CheckCircle2 className="w-5 h-5" />
                              </div>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-400">
                            Usually an 8–10 character code found in your bKash SMS confirmation.
                          </p>
                        </div>

                        <Button
                          type="submit"
                          className="w-full h-11 text-base font-display tracking-wide relative overflow-hidden group bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white"
                          disabled={isSubmitting || isExpired}
                        >
                          <span className="relative flex items-center justify-center gap-2">
                            {isSubmitting ? (
                              "Verifying Submission..."
                            ) : (
                              <>
                                Submit bKash Transaction{" "}
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </span>
                        </Button>
                      </form>
                    </CardContent>
                  </Card>
                </div>
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

                  {/* Support Link */}
                  <div className="pt-2">
                    <Link
                      to="/custom-order"
                      className="flex items-center justify-center gap-2 p-2.5 rounded-lg border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      <Headphones className="w-3.5 h-3.5 text-primary" />
                      Need help? Contact support
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Payment;
