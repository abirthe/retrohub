import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { createOrder } from "@/lib/shopApi";
import { Button } from "@/components/ui/button";
import { ShoppingCart, ArrowLeft, ShieldCheck } from "lucide-react";
import { ShopHeader } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { CheckoutCartItems, CheckoutSummary } from "@/components/checkout";

const Checkout = () => {
  const { items, removeFromCart, updateQuantity, clearCart, totalPrice } =
    useCart();
  const { user } = useAuth();
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
        <div className="container py-32 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground mb-2">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h1 className="font-display text-2xl font-bold">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mb-4">
            Looks like you haven't added anything yet.
          </p>
          <Button
            onClick={() => {
              if (window.history.length > 1) navigate(-1);
              else navigate("/");
            }}
            variant="outline"
            className="border-primary/30 text-primary hover:bg-primary/10"
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
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        queryClient.invalidateQueries({ queryKey: ["products"] });
        toast({
          title: "Order initiated",
          description: "Please complete your payment.",
        });
        navigate("/payment", {
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
