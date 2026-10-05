import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StripeEmbeddedCheckout {
  mount: (el: HTMLElement) => void;
  destroy: () => void;
}

interface StripeInstance {
  initEmbeddedCheckout: (opts: { clientSecret: string }) => Promise<StripeEmbeddedCheckout>;
}

declare global {
  interface Window {
    Stripe?: (key: string, options?: Record<string, unknown>) => StripeInstance;
  }
}

export function StripeCheckout({ orderIds }: { orderIds: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const checkoutInstanceRef = useRef<StripeEmbeddedCheckout | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderIdsKey = orderIds.join(",");

  const cleanupCheckout = useCallback(() => {
    if (checkoutInstanceRef.current) {
      try {
        checkoutInstanceRef.current.destroy();
      } catch (err) {
        console.warn("Stripe embedded checkout destroy warning:", err);
      }
      checkoutInstanceRef.current = null;
    }
  }, []);

  const initStripeCheckout = useCallback(async () => {
    cleanupCheckout();
    setLoading(true);
    setError(null);

    try {
      // 1. Wait for Stripe.js (v3) script from window
      let stripeConstructor = window.Stripe;
      let attempts = 0;
      while (!stripeConstructor && attempts < 30) {
        await new Promise((res) => setTimeout(res, 100));
        stripeConstructor = window.Stripe;
        attempts++;
      }

      if (!stripeConstructor) {
        throw new Error("Stripe SDK failed to load. Please check your internet connection.");
      }

      const publishableKey =
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
        "pk_live_51UMuVWQ4V6haoLQNOWkACWHwmy1gQINs5sMGz3caYF3RdEBN8Co0qqQFwdFUuOhZubg6eD2Fn1zEr2bDQNvVdIeA00uYdmGnXc";

      if (!publishableKey) {
        throw new Error("Stripe publishable key is missing.");
      }

      const stripe = stripeConstructor(publishableKey);

      // 2. Request checkout session from Supabase Edge Function
      const returnUrl = `${window.location.origin}/orders`;
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: {
            orderIds: orderIdsKey.split(",").filter(Boolean),
            returnUrl,
          },
        }
      );

      if (invokeError) {
        let detailedMsg = invokeError.message;
        try {
          if (invokeError.context && typeof invokeError.context.json === "function") {
            const body = await invokeError.context.json();
            if (body?.error) {
              detailedMsg = body.error;
            }
          }
        } catch (_parseErr) {
          void _parseErr;
        }
        throw new Error(detailedMsg || "Failed to initialize payment gateway session.");
      }

      if (!data?.client_secret) {
        throw new Error("Payment gateway response was missing client_secret.");
      }

      const clientSecret = data.client_secret as string;

      // 3. Initialize official Stripe Embedded Checkout
      const checkout = await stripe.initEmbeddedCheckout({
        clientSecret,
      });

      checkoutInstanceRef.current = checkout;

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        checkout.mount(containerRef.current);
      }

      setLoading(false);
    } catch (err: unknown) {
      console.error("Error initializing Stripe checkout:", err);
      const errorObj = err as Error;
      setError(errorObj?.message || "Failed to load payment form.");
      setLoading(false);
    }
  }, [orderIdsKey, cleanupCheckout]);

  useEffect(() => {
    initStripeCheckout();
    return () => {
      cleanupCheckout();
    };
  }, [initStripeCheckout, cleanupCheckout]);

  return (
    <div className="w-full">
      {loading && (
        <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-300">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-sm font-medium tracking-wide">
            Loading secure Stripe checkout...
          </p>
          <span className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            256-bit SSL encrypted international card gateway
          </span>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/25 text-destructive text-sm space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="font-medium text-destructive-foreground">{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={initStripeCheckout}
            className="flex items-center gap-1.5 border-destructive/40 hover:bg-destructive/15 text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry Gateway
          </Button>
        </div>
      )}

      <div
        id="checkout-form"
        ref={containerRef}
        className={loading || error ? "hidden" : "w-full min-h-[400px] animate-in fade-in duration-300"}
      />
    </div>
  );
}

export default StripeCheckout;
