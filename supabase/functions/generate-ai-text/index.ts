import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { systemPrompt } = await req.json();
    if (!systemPrompt) {
      return new Response(JSON.stringify({ error: "Missing systemPrompt" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const XAI_API_KEY = Deno.env.get("XAI_API_KEY") || "";

    const response = await fetch("https://api.x.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "grok-beta",
        messages: [{ role: "system", content: systemPrompt }],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to generate text: ${response.status} ${errorData}`);
    }

    const data = await response.json();
    return new Response(JSON.stringify({ content: data.choices[0].message.content.trim() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
