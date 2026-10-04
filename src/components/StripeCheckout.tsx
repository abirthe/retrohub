import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// Global Stripe instance injected via index.html
declare global {
  interface Window {
    Stripe: any;
  }
}

export function StripeCheckout({ orderIds }: { orderIds: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initializeStripe = async () => {
      try {
        const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY, {
          betas: ["custom_checkout_payment_form_1"]
        });

        const appearance = {
          theme: "night",
          labels: "auto",
          inputs: "spaced",
          variables: {
            borderRadius: "4px",
            colorBackground: "#ffffff",
            colorDanger: "#df1b41",
            colorPrimary: "#0570de",
            colorSuccess: "#00c853",
            colorText: "#30313d",
            fontFamily: "default",
            fontSizeBase: "16px",
            spacingUnit: "4px"
          }
        };

        const { data, error } = await supabase.functions.invoke("create-checkout-session", {
          body: { orderIds }
        });

        if (error) {
          throw new Error(error.message);
        }

        const clientSecret = data.client_secret;

        const checkout = stripe.initCheckoutFormSdk({ clientSecret, appearance });
        const form = checkout.createForm({ layout: "expanded" });
        
        if (containerRef.current) {
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
      } catch (error) {
        console.error("Error initializing Stripe checkout:", error);
      }
    };

    initializeStripe();
  }, []);

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-card rounded-lg shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Complete Payment</h2>
      <div id="checkout-form" ref={containerRef}></div>
    </div>
  );
}
