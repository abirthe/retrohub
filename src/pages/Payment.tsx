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
import { Smartphone, CheckCircle2, ArrowRight } from "lucide-react";
import { ShopHeader } from "@/components/layout";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { updateOrderTransactionId } from "@/lib/shopApi";

import { BkashPayment } from "@/components/payment";
import { StripeCheckout } from "@/components/StripeCheckout";

const Payment = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [transactionId, setTransactionId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { orderIds, totalPrice } = location.state || {
    orderIds: [],
    totalPrice: 0,
  };

  const calculateTotal = () => {
    if (!totalPrice) return 0;
    return totalPrice * 1.01; // 1% bKash charge
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
        // Fallback simulation if no order IDs (e.g. testing)
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      toast({
        title: "Payment Submitted",
        description:
          "Your transaction ID has been received. We will verify it shortly.",
        className: "bg-success text-success-foreground",
      });

      // Navigate to orders page after success
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
    <div className="min-h-screen selection:bg-primary/20">
      <ShopHeader />

      <main className="container py-12 md:py-20">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent animate-in fade-in slide-in-from-bottom-4 duration-700">
              Complete Your Payment
            </h1>
            <p className="text-slate-200 max-w-lg mx-auto text-base md:text-lg font-medium leading-relaxed drop-shadow-sm">
              RETROHUB accepts{" "}
              <strong className="text-primary font-semibold drop-shadow-[0_0_12px_rgba(0,255,255,0.4)]">
                Card (Stripe)
              </strong>{" "}
              and{" "}
              <strong className="text-pink-400 font-semibold drop-shadow-[0_0_12px_rgba(244,114,182,0.4)]">
                bKash
              </strong>{" "}
              for instant order verification and key delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            {/* Left Column: Payment Methods */}
            <div className="space-y-6">
              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <svg viewBox="0 0 60 25" xmlns="http://www.w3.org/2000/svg" className="w-10 h-auto fill-primary"><path d="M24.73 14.16c-.02-3.13 2.1-4.74 4.54-4.74 1.5 0 2.76.65 3.52 1.44l.82-2.94c-1.12-.9-2.73-1.4-4.52-1.4-4.22 0-7.3 2.4-7.3 7.42 0 4.6 2.8 7.37 7.02 7.37 1.94 0 3.75-.62 4.97-1.57l-.76-2.9c-1.1.75-2.52 1.25-4.14 1.25-2.14 0-4.1-1.1-4.13-3.92h8.32c.04-.38.07-1 .07-1.56L24.73 14.16zM24.8 11.9c.14-1.33 1.26-2.4 2.82-2.4 1.63 0 2.65 1.05 2.65 2.4h-5.46zM46.72 13.92c0-4.82-2.78-7.34-6.85-7.34-1.7 0-3.37.5-4.66 1.44l.8 2.92c1.1-.8 2.63-1.28 4-1.28 2.06 0 3.4 1 3.4 3.12v.12c-.75-.4-1.97-.73-3.32-.73-3.66 0-6.17 1.7-6.17 4.96 0 2.8 1.96 4.63 5.06 4.63 1.68 0 3.1-.64 4.14-1.66V21.3h3.18l-.02-1.2c0-1.85.02-3.7.02-4.1 0-1.07.02-1.74.03-2.07zm-3.23 3.63c0 1.62-1.26 2.66-3.18 2.66-1.57 0-2.5-.83-2.5-2.08 0-1.43 1.25-2.18 3.5-2.18 1 .02 1.83.2 2.18.37v1.23zM54.55 13.93c0-4.83-2.78-7.35-6.85-7.35-1.7 0-3.37.5-4.66 1.45l.8 2.92c1.1-.8 2.63-1.28 4-1.28 2.06 0 3.4 1 3.4 3.12v.12c-.75-.4-1.97-.73-3.32-.73-3.66 0-6.17 1.7-6.17 4.96 0 2.8 1.96 4.63 5.06 4.63 1.68 0 3.1-.64 4.14-1.66V21.3h3.18l-.02-1.2c0-1.85.02-3.7.02-4.1 0-1.07.02-1.74.03-2.08zm-3.23 3.64c0 1.62-1.26 2.66-3.18 2.66-1.57 0-2.5-.83-2.5-2.08 0-1.43 1.25-2.18 3.5-2.18 1 .02 1.83.2 2.18.37v1.23zM9.54 12.3c0-3.5 2.15-5.63 5.6-5.63 1.57 0 2.83.5 3.82 1.23l-1.34 2.87c-.8-.58-1.5-.8-2.5-.8-1.37 0-2.17.84-2.17 2.02 0 1.13.78 1.63 2.52 2.17 2.37.7 3.88 1.95 3.88 4.28 0 3.82-2.5 5.86-5.96 5.86-1.7 0-3.2-.56-4.32-1.43l1.43-2.88c1 .73 2.02 1.05 3.02 1.05 1.54 0 2.38-.82 2.38-2.12 0-1.28-.96-1.73-2.73-2.3-2.2-.67-3.64-1.85-3.64-4.3zm21.6 8.95h3.4V6.9h-3.4v14.35zM38.16 9.68h-2.56V6.9h2.56V3.88l3.43-.8v3.83h3.55v2.78h-3.55v6.52c0 1.15.65 1.65 1.5 1.65.65 0 1.2-.14 1.7-.4l.8 2.76c-.9.5-2.24.78-3.48.78-2.9 0-3.95-1.56-3.95-4.2V9.67zM16.92 6.9h3.4v2.76c1.1-1.7 2.75-3.08 5-3.08v3.52c-.44-.06-.75-.1-1.12-.1-2.18 0-3.87 1.54-3.87 5v6.3h-3.4V6.9z"/></svg>
                    Pay with Card securely
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Pay instantly via Stripe to complete your order automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orderIds.length > 0 ? (
                    <StripeCheckout orderIds={orderIds} />
                  ) : (
                    <p className="text-muted-foreground text-sm">No items in order.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-[0_0_30px_-10px_rgba(0,0,0,0.5)] overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="font-display text-xl flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-pink-400" />
                    Official bKash Account
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Or, send money manually to our bKash account for verification.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BkashPayment />
                </CardContent>
              </Card>
            </div>

            {/* Right Column: Transaction Input */}
            <div className="space-y-6">
              <Card className="border-border/50 bg-card shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />

                <CardHeader>
                  <CardTitle className="font-display">
                    Confirm Payment
                  </CardTitle>
                  <CardDescription className="text-slate-300">
                    Enter the transaction ID from your payment provider.
                  </CardDescription>
                </CardHeader>

                <div className="bg-secondary/30 px-6 py-4 border-y border-border/50">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-300 font-medium">
                      Amount to Pay
                    </span>
                    <span className="font-display font-bold text-xl text-primary">
                      ৳{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 text-right">
                    *Includes 1% bKash charge
                  </p>
                  {orderIds.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <span className="text-xs text-slate-400 block mb-1">
                        Order Reference IDs:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {orderIds.map((id: string) => (
                          <span
                            key={id}
                            className="inline-flex items-center px-2 py-1 rounded bg-accent/10 border border-accent/20 text-xs font-mono text-accent"
                          >
                            #{id.slice(0, 8)}...
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <CardContent className="pt-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="trx-id" className="text-sm font-medium">
                        Transaction ID
                      </Label>
                      <div className="relative">
                        <Input
                          id="trx-id"
                          placeholder="e.g. 9H7G6F5D4S"
                          value={transactionId}
                          onChange={(e) => setTransactionId(e.target.value)}
                          className="font-mono uppercase placeholder:normal-case border-primary/30 focus-visible:ring-primary/50 text-lg py-6 bg-background/50"
                        />
                        {transactionId && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-success animate-in zoom-in">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">
                        Usually a 10-character alphanumeric code sent via SMS.
                      </p>
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-lg font-display tracking-wide relative overflow-hidden group"
                      disabled={isSubmitting}
                    >
                      <span
                        className={cn(
                          "absolute inset-0 bg-gradient-to-r from-primary via-primary to-accent opacity-100 transition-all duration-300",
                          isSubmitting
                            ? "opacity-90"
                            : "group-hover:opacity-90",
                        )}
                      />
                      <span className="relative flex items-center gap-2 text-primary-foreground">
                        {isSubmitting ? (
                          "Verifying..."
                        ) : (
                          <>
                            Submit Transaction{" "}
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </span>
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="bg-secondary/30 p-4 rounded-lg border border-border/50 backdrop-blur text-sm text-center text-slate-300">
                Need help?{" "}
                <Link
                  to="/custom-order"
                  className="text-primary hover:underline underline-offset-4 font-semibold"
                >
                  Contact Support / Custom Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
