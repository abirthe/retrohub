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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: orders, error: ordersError } = await supabaseClient
      .from("orders")
      .select("id, product_id, total, products(id, title, platform, sale_price, image_url)")
      .in("id", orderIds);

    if (ordersError || !orders || orders.length === 0) {
      throw new Error("Failed to fetch orders or orders not found.");
    }

    const line_items: Stripe.Checkout.SessionCreateParams.LineItem[] = [];

    for (const order of orders) {
      const product = order.products;
      const title = product?.title || `Order #${order.id.slice(0, 8)}`;
      const amountNumber = Number(order.total || product?.sale_price || 1);
      const unitAmount = Math.max(Math.round(amountNumber * 100), 50);

      const item: Stripe.Checkout.SessionCreateParams.LineItem = {
        price_data: {
          currency: "bdt",
          unit_amount: unitAmount,
          product_data: {
            name: title,
            ...(product?.platform ? { description: `Platform: ${product.platform}` } : {}),
            ...(product?.image_url && product.image_url.startsWith("http")
              ? { images: [product.image_url] }
              : {}),
            metadata: {
              order_id: order.id,
              product_id: order.product_id || "",
            },
          },
        },
        quantity: 1,
      };

      line_items.push(item);
    }

    // Calculate total order amount across line items
    let totalBdtAmount = 0;
    for (const item of line_items) {
      totalBdtAmount += ((item.price_data?.unit_amount || 0) * (item.quantity || 1)) / 100;
    }

    // Stripe enforces a global minimum transaction size equivalent to $0.50 USD (~৳65 BDT).
    if (totalBdtAmount < 65) {
      return new Response(
        JSON.stringify({
          error: `Stripe card processing requires a minimum order amount of ৳65 (~$0.50 USD). Your current total is ৳${totalBdtAmount.toFixed(2)}. Please pay via bKash or add more items to your cart.`,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    const mode = "payment";

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      ui_mode: "form",
      mode,
      managed_payments: { enabled: false },
      billing_address_collection: "auto",
      phone_number_collection: { enabled: false },
      automatic_tax: { enabled: false },
      submit_type: "auto",
      tax_id_collection: { enabled: false },
      name_collection: { individual: { enabled: true } },
      line_items,
      metadata: {
        orderIds: orderIds.join(","),
      },
    };

    let session;
    try {
      session = await stripe.checkout.sessions.create(sessionParams);
    } catch (stripeErr: any) {
      console.warn("Primary Stripe checkout session creation failed:", stripeErr.message);
      // If BDT is not supported by merchant's Stripe account, convert line items to USD
      if (
        stripeErr?.message?.toLowerCase().includes("currency") ||
        stripeErr?.code === "currency_unsupported"
      ) {
        console.warn("Retrying with USD currency fallback...");
        for (const item of line_items) {
          if (item.price_data) {
            item.price_data.currency = "usd";
            // Convert BDT to USD (~120 BDT per USD, with minimum $0.50 Stripe charge)
            const usdAmount = Math.max(Math.round(item.price_data.unit_amount / 120), 50);
            item.price_data.unit_amount = usdAmount;
          }
        }
        session = await stripe.checkout.sessions.create(sessionParams);
      } else {
        throw stripeErr;
      }
    }

    return new Response(JSON.stringify({ client_secret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("Create checkout session error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
