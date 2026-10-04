// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.20.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2026-03-25.dahlia; custom_checkout_payment_form_preview=v1" as any,
});

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { orderIds } = await req.json();

    if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
      throw new Error("Missing orderIds array in request body");
    }

    // Since we are not using the supabase client in the edge function currently, 
    // we need to instantiate it to query the database, or we can just expect 
    // the frontend to pass the productIds and quantities directly.
    // However, for security, the frontend shouldn't pass prices.
    // But wait! We don't have the Supabase URL/Key in this edge function right now!
    // The previous code just took `productId` and asked Stripe directly.
    // If the frontend passes an array of `{ productId, quantity }` it is much simpler.
    // Wait, let's use the supabase client to fetch orders.
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: orders, error: ordersError } = await supabaseClient
      .from("orders")
      .select("id, product_id")
      .in("id", orderIds);

    if (ordersError || !orders || orders.length === 0) {
      throw new Error("Failed to fetch orders or orders not found.");
    }

    // Group by product_id to calculate quantities
    const productQuantities: Record<string, number> = {};
    for (const order of orders) {
      if (order.product_id) {
        productQuantities[order.product_id] = (productQuantities[order.product_id] || 0) + 1;
      }
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    // Fetch stripe prices for each product
    for (const [productId, quantity] of Object.entries(productQuantities)) {
      const stripeProduct = await stripe.products.retrieve(productId);
      if (!stripeProduct || !stripeProduct.default_price) {
        throw new Error(`Product ${productId} not found or has no default price set in Stripe`);
      }
      const priceId = typeof stripeProduct.default_price === 'string' 
        ? stripeProduct.default_price 
        : stripeProduct.default_price.id;

      line_items.push({
        price: priceId,
        quantity: quantity
      });
    }

    const mode = "payment";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: "elements",
      mode,
      managed_payments: { enabled: false },
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: true },
      submit_type: "auto",
      tax_id_collection: { enabled: true },
      name_collection: { individual: { enabled: true } },
      line_items,
      metadata: {
        orderIds: orderIds.join(",") // Store orderIds to update them later via webhook
      }
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    return new Response(JSON.stringify({ client_secret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
