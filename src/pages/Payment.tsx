import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
} from "lucide-react";
import { ShopHeader } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateOrderTransactionId } from "@/lib/shopApi";

import { BkashPayment, StripeCheckout } from "@/components/payment";

type PaymentMethod = "card" | "bkash";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { orderIds, totalPrice } = location.state || {
    orderIds: [],
    totalPrice: 0,
  };

  const bkashCharge = totalPrice * 0.01;
  const finalBkashTotal = totalPrice * 1.01;

  const handleSubmitBkash = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = transactionId.trim();
    // Enforce format: 6–30 alphanumeric characters (bKash TrxIDs are typically 10 chars)
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
      if (orderIds.length > 0) {
        await updateOrderTransactionId(orderIds, trimmed);
        queryClient.invalidateQueries({ queryKey: ["user-orders"] });
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      } else {
        // Fallback simulation if no order IDs
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

  return (
    <div className="min-h-screen relative selection:bg-primary/20 text-foreground">
      {/* Subtle Ambient Radial Highlight - background animation shines through */}
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

        {/* Hero Title */}
        <div className="text-center space-y-3 mb-10">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-black tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-primary via-cyan-200 to-accent">
            Complete Your Payment
          </h1>
          <p className="text-slate-300 max-w-xl mx-auto text-sm sm:text-base font-normal leading-relaxed">
            Select your preferred gateway below to finalize and receive your instant digital keys.
          </p>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Method Selector & Payment Forms (7 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* Payment Method Selector Cards */}
            <div className="space-y-3">
              <Label className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">
                Select Payment Method
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Stripe Card Option */}
                <button
                  type="button"
                  onClick={() => setSelectedMethod("card")}
                  className={cn(
                    "relative flex items-start gap-3.5 p-4 rounded-xl border text-left transition-all duration-200 group cursor-pointer backdrop-blur-md",
                    selectedMethod === "card"
                      ? "border-primary bg-primary/10 shadow-[0_0_20px_-5px_rgba(0,240,255,0.3)] ring-1 ring-primary/40"
                      : "border-white/10 bg-card/25 hover:bg-card/40 hover:border-primary/40",
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
                        Card (Stripe)
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
                    Enter your international card details below. Verification is instant and keys are issued automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-2">
                  {orderIds.length > 0 ? (
                    totalPrice > 0 && totalPrice < 65 ? (
                      <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-sm space-y-3">
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-amber-200">
                              Minimum Amount for International Card Processing
                            </p>
                            <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                              Stripe requires international card transactions to convert to at least $0.50 USD (approx. ৳65 BDT). Your current order total is <strong>৳{totalPrice.toFixed(2)}</strong>.
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
                      <StripeCheckout orderIds={orderIds} />
                    )
                  ) : (
                    <div className="py-8 text-center text-muted-foreground text-sm">
                      No order items found. Please start from your cart.
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Active Payment View: bKash */}
            {selectedMethod === "bkash" && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* bKash Details Card */}
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
                        <Label htmlFor="trx-id" className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
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
                        disabled={isSubmitting}
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
          </div>

          {/* Right Column: Order Summary & Trust Guarantee (5 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-6">
            {/* Sticky Order Summary Card */}
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
                {/* Order References */}
                {orderIds.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/[0.04] border border-white/10 space-y-1.5">
                    <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                      Order Reference:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {orderIds.map((id: string) => (
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
                    <span className="font-mono font-medium">৳{totalPrice.toFixed(2)}</span>
                  </div>

                  <div className="flex justify-between items-center text-slate-300">
                    <span className="flex items-center gap-1.5">
                      Processing Fee
                      {selectedMethod === "bkash" && (
                        <span className="text-[10px] text-pink-400 font-semibold">(1% bKash)</span>
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
                          ? `~$${(totalPrice / 128.02).toFixed(2)} USD via Stripe`
                          : "Final BDT via bKash"}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="font-display font-black text-2xl text-primary drop-shadow-[0_0_15px_rgba(0,240,255,0.4)]">
                        ৳{selectedMethod === "bkash" ? finalBkashTotal.toFixed(2) : totalPrice.toFixed(2)}
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
                    Need help? Contact support or custom order
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
