import { supabase } from "@/integrations/supabase/client";

export async function generateFulfillmentEmail(
  orderId: string,
  productName: string,
  customerName: string,
  fulfillmentCode: string,
  isDelayed: boolean = false,
): Promise<string> {
  const systemPrompt = `You are a helpful e-commerce assistant for a digital game key store.
Your job is to write a polite, professional, and friendly fulfillment email to a customer who just purchased a product.

Order Details:
- Order ID: ${orderId}
- Product: ${productName}
- Customer Name: ${customerName}
- Game Key / Code: ${fulfillmentCode}

Instructions:
1. Greet the customer by name.
2. Thank them for their purchase.
3. Clearly provide their Game Key / Code.
4. ${isDelayed ? "The order was slightly delayed. Politely apologize for the wait and tell them not to panic, we are always here to help." : "Keep it standard and brief."}
5. End with a warm sign-off from "RetroHub Support".

Write ONLY the email body in plain text (no markdown formatting, no JSON, no extra conversational text).`;

  const { data, error } = await supabase.functions.invoke("generate-ai-text", {
    body: { systemPrompt },
  });

  if (error || !data?.content) {
    throw new Error(`Failed to generate email: ${error?.message || "Unknown error"}`);
  }

  return data.content;
}
