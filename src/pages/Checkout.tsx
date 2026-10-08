import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useUnpaidOrders } from "@/hooks/useUnpaidOrders";
import { createOrder } from "@/lib/shopApi";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  AlertTriangle,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { ShopHeader } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { CheckoutCartItems, CheckoutSummary } from "@/components/checkout";
import { PaymentCountdownTimer } from "@/components/orders";

const Checkout = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } =
    useCart();
  const { user } = useAuth();
  const { unpaidOrders, hasUnpaidOrders, latestUnpaidOrder } = useUnpaidOrders();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [customerInput, setCustomerInput] = useState<Record<string, string>>(
    {},
  );

  const [termsAccepted, setTermsAccepted] = useState(false);

  const hasTopup = items.some((i) => i.product.category === "topup");
  const topupsValid =
    !hasTopup ||
    items
      .filter((i) => i.product.category === "topup")
      .every((i) => customerInput[i.product.id]?.trim());
  const canCheckout = !hasTopup || (termsAccepted && topupsValid);

  if (items.length === 0) {
    return (
      <div className="min-h-screen">
        <ShopHeader />
        <div className="container py-20 text-center flex flex-col items-center gap-4 max-w-lg mx-auto px-4">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-2">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mb-2 text-sm">
            Looks like you haven't added anything yet.
          </p>

          {/* Pending Order Notice if cart is empty but user has an unpaid order */}
          {hasUnpaidOrders && latestUnpaidOrder && (
            <Card className="w-full text-left p-4 my-2 border-amber-500/30 bg-amber-500/10 backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-display text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Order Waiting for Payment
                </span>
                <PaymentCountdownTimer
                  createdAt={latestUnpaidOrder.created_at}
                  compact
                />
              </div>
              <p className="text-xs text-slate-300">
                You have order #{latestUnpaidOrder.id.slice(0, 8)} (৳
                {Number(latestUnpaidOrder.total).toFixed(2)}) waiting for payment.
              </p>
              <Button
                size="sm"
                onClick={() =>
                  navigate(`/payment?order_ids=${latestUnpaidOrder.id}`, {
                    state: {
                      orderIds: [latestUnpaidOrder.id],
                      totalPrice: Number(latestUnpaidOrder.total),
                    },
                  })
                }
                className="w-full bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium text-xs h-9 shadow-md"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                Complete Payment Now
              </Button>
            </Card>
          )}

          <Button
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/");
            }}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10 mt-2"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (items.length === 0) return;
    if (!user) {
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }
    if (!canCheckout) {
      toast({
        title: "Missing Information",
        description: "Please fill in all Game IDs and accept the terms.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const failedOrders: string[] = [];
      const createdOrderIds: string[] = [];

      // Create orders for each item with stock validation
      for (const item of items) {
        for (let i = 0; i < item.quantity; i++) {
          const payload =
            item.product.category === "topup"
              ? { game_id: customerInput[item.product.id] || "" }
              : {};
          const order = await createOrder(
            item.product.id,
            Number(item.product.sale_price),
            payload,
          );
          createdOrderIds.push(order.id);
        }
      }

      if (failedOrders.length > 0) {
        toast({
          title: "Partial order placed",
          description: `Some items are out of stock: ${failedOrders.join(", ")}`,
          variant: "default",
        });
      }

      if (createdOrderIds.length > 0) {
        clearCart();
        queryClient.invalidateQueries({ queryKey: ["user-orders"] });
        queryClient.invalidateQueries({ queryKey: ["unpaid-orders"] });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast({
          title: "Order initiated",
          description: "Please complete your payment within 30 minutes.",
        });
        navigate(`/payment?order_ids=${createdOrderIds.join(",")}`, {
          state: { orderIds: createdOrderIds, totalPrice },
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to place order";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative selection:bg-primary/20">
      {/* Background Ambience */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      </div>

      <ShopHeader />
      <div className="container relative z-10 py-6 sm:py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-3">
          <Button
            variant="ghost"
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/");
            }}
            className="font-display text-xs tracking-wider text-muted-foreground hover:text-white self-start"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Continue Shopping
          </Button>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-wider">
            Checkout
          </h1>
        </div>

        {/* Guest Notification Banner - Only visible to unauthenticated guests */}
        {!user && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/20 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Checking out as Guest
                </p>
                <p className="text-xs text-muted-foreground">
                  Sign in or create a free account to finalize payment and
                  receive your digital codes.
                </p>
              </div>
            </div>
            <Button
              onClick={() =>
                navigate("/auth", { state: { from: "/checkout" } })
              }
              size="sm"
              className="gradient-primary font-display text-xs tracking-wider shrink-0 self-start sm:self-auto"
            >
              Sign In / Register
            </Button>
          </div>
        )}

        {/* Existing Unpaid Order Banner */}
        {hasUnpaidOrders && latestUnpaidOrder && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-300">
                  You have an order awaiting payment (#{latestUnpaidOrder.id.slice(0, 8)})
                </p>
                <p className="text-xs text-slate-300">
                  Total: ৳{Number(latestUnpaidOrder.total).toFixed(2)}. Complete payment before time runs out or continue with new order.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <PaymentCountdownTimer createdAt={latestUnpaidOrder.created_at} compact />
              <Button
                onClick={() =>
                  navigate(`/payment?order_ids=${latestUnpaidOrder.id}`, {
                    state: {
                      orderIds: [latestUnpaidOrder.id],
                      totalPrice: Number(latestUnpaidOrder.total),
                    },
                  })
                }
                size="sm"
                className="bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-600 hover:to-rose-600 text-white font-medium text-xs h-8 px-3 shrink-0"
              >
                <CreditCard className="w-3.5 h-3.5 mr-1.5" />
                Pay Existing Order
              </Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            <CheckoutCartItems
              items={items}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              customerInput={customerInput}
              setCustomerInput={setCustomerInput}
            />
          </div>

          {/* Order Summary */}
          <div className="space-y-6">
            <CheckoutSummary
              totalPrice={totalPrice}
              loading={loading}
              onCheckout={handleCheckout}
              hasTopup={hasTopup}
              termsAccepted={termsAccepted}
              setTermsAccepted={setTermsAccepted}
              canCheckout={canCheckout}
              isAuthenticated={!!user}
              onSignIn={() =>
                navigate("/auth", { state: { from: "/checkout" } })
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
