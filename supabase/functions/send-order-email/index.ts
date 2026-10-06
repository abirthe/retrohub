// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
// Supabase Edge Function to send order completion emails
// This function is called when an order is completed

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || "noreply@retrohub.com";

interface EmailPayload {
  order_id: string;
  recipient: string;
  product_title: string;
  code: string;
  order_total: number;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the order data from the request
    const payload: EmailPayload = await req.json();

    if (!payload.recipient || !payload.code) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Email HTML template
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .code-box { background: #fff; border: 2px dashed #667eea; padding: 20px; margin: 20px 0; text-align: center; border-radius: 5px; }
            .code { font-size: 24px; font-weight: bold; color: #667eea; font-family: monospace; letter-spacing: 2px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .button { display: inline-block; padding: 12px 24px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎮 RETROHUB</h1>
              <p>Your Order is Ready!</p>
            </div>
            <div class="content">
              <h2>Order Confirmation</h2>
              <p>Thank you for your purchase! Your order has been completed.</p>
              
              <p><strong>Product:</strong> ${payload.product_title}</p>
              <p><strong>Order Total:</strong> ৳${payload.order_total.toFixed(2)}</p>
              <p><strong>Order ID:</strong> ${payload.order_id.slice(0, 8)}...</p>
              
              <div class="code-box">
                <p style="margin: 0 0 10px 0; color: #666;">Your Product Code:</p>
                <div class="code">${payload.code}</div>
              </div>
              
              <p><strong>Important:</strong> Please save this code securely. You can also view it anytime in your <a href="${Deno.env.get("SITE_URL") || "https://www.retrohub.tech"}/orders">order history</a>.</p>
              
              <a href="${Deno.env.get("SITE_URL") || "https://www.retrohub.tech"}/orders" class="button">View All Orders</a>
            </div>
            <div class="footer">
              <p>© 2026 RETROHUB. Dev by ABIR HOSSAIN</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email using Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: payload.recipient,
        subject: `🎮 Your ${payload.product_title} Code - RETROHUB`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const error = await emailResponse.text();
      throw new Error(`Email API error: ${error}`);
    }

    const emailData = await emailResponse.json();

    return new Response(
      JSON.stringify({
        success: true,
        message: "Email sent successfully",
        email_id: emailData.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        error: error?.message || "Failed to send email",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
