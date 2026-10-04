import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Global Stripe instance injected via index.html
declare global {
  interface Window {
    Stripe: any;
  }
}

export function StripeCheckout({ orderIds }: { orderIds: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initStripeCheckout = async () => {
    setLoading(true);
    setError(null);

    try {
      // Wait for Stripe.js script if not immediately ready
      let stripeConstructor = window.Stripe;
      let attempts = 0;
      while (!stripeConstructor && attempts < 25) {
        await new Promise((res) => setTimeout(res, 100));
        stripeConstructor = window.Stripe;
        attempts++;
      }

      if (!stripeConstructor) {
        throw new Error("Stripe SDK failed to load from CDN. Please check your connection.");
      }

      const publishableKey =
        import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
        "pk_live_51UMuVWQ4V6haoLQNOWkACWHwmy1gQINs5sMGz3caYF3RdEBN8Co0qqQFwdFUuOhZubg6eD2Fn1zEr2bDQNvVdIeA00uYdmGnXc";
      if (!publishableKey) {
        throw new Error("Stripe publishable key is missing.");
      }

      const stripe = stripeConstructor(publishableKey, {
        betas: ["custom_checkout_payment_form_1"],
      });

      const appearance = {
        theme: "night",
        labels: "auto",
        variables: {
          borderRadius: "6px",
          colorBackground: "#0d1527",
          colorDanger: "#ef4444",
          colorPrimary: "#00f0ff",
          colorSuccess: "#10b981",
          colorText: "#f1f5f9",
          fontFamily: "Inter, sans-serif",
          fontSizeBase: "15px",
        },
      };

      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-checkout-session",
        {
          body: { orderIds },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || "Failed to initialize payment session");
      }

      if (!data?.client_secret) {
        throw new Error("Invalid response from payment server: missing client_secret");
      }

      const clientSecret = data.client_secret;
      const checkout = stripe.initCheckoutFormSdk({ clientSecret, appearance });
      const form = checkout.createForm({ layout: "expanded" });

      if (containerRef.current) {
        containerRef.current.innerHTML = "";
        form.mount(containerRef.current);
      }

      const loadActionsResult = await checkout.loadActions();
      if (loadActionsResult.type === "success") {
        form.on("confirm", async (event: any) => {
          try {
            await loadActionsResult.actions.confirm({ formConfirmEvent: event });
          } catch (confirmError) {
            console.error("Payment confirmation error:", confirmError);
          }
        });
      }

      setLoading(false);
    } catch (err: any) {
      console.error("Error initializing Stripe checkout:", err);
      setError(err?.message || "Failed to load payment form.");
      setLoading(false);
    }
  };

  useEffect(() => {
    initStripeCheckout();
  }, [JSON.stringify(orderIds)]);

  return (
    <div className="w-full">
      {loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm font-medium">Initializing secure Stripe gateway...</p>
        </div>
      )}

      {error && !loading && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm space-y-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={initStripeCheckout}
            className="flex items-center gap-1.5 border-destructive/30 hover:bg-destructive/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      )}

      <div
        id="checkout-form"
        ref={containerRef}
        className={loading || error ? "hidden" : "w-full min-h-[100px] animate-in fade-in duration-300"}
      />
    </div>
  );
}
