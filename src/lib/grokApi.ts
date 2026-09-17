export async function generateFulfillmentEmail(
  orderId: string,
  productName: string,
  customerName: string,
  fulfillmentCode: string,
  isDelayed: boolean = false
): Promise<string> {
  const apiKey = import.meta.env.VITE_XAI_API_KEY;
  if (!apiKey) {
    throw new Error('XAI API Key is missing');
  }

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

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-beta',
      messages: [
        { role: 'system', content: systemPrompt }
      ],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Failed to generate email: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  return data.choices[0].message.content.trim();
}
