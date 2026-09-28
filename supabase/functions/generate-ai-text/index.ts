// @ts-nocheck
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

    const XAI_API_KEY = (Deno.env.get("XAI_API_KEY") || "").trim();
    const XAI_TEAM_ID = (Deno.env.get("XAI_TEAM_ID") || "").trim();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${XAI_API_KEY}`,
    };
    if (XAI_TEAM_ID) {
      headers["X-Team-Id"] = XAI_TEAM_ID;
    }

    let generatedText = "";

    // 1. Try modern xAI v1/responses API with grok-4.7
    try {
      const response = await fetch("https://api.x.ai/v1/responses", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "grok-4.7",
          input: [{ role: "system", content: systemPrompt }],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data?.output)) {
          for (const item of data.output) {
            if (item.type === "message" && Array.isArray(item.content)) {
              const textBlock = item.content.find(
                (c: any) => c.type === "output_text" || typeof c.text === "string",
              );
              if (textBlock?.text) {
                generatedText = textBlock.text.trim();
                break;
              }
            }
            if (typeof item.text === "string") {
              generatedText = item.text.trim();
              break;
            }
          }
        }
      }
    } catch (_err) {
      // Fall through to v1/chat/completions fallback
    }

    // 2. Fallback to v1/chat/completions with grok-beta if responses API was not used
    if (!generatedText) {
      const response = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers,
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
      generatedText = data.choices?.[0]?.message?.content?.trim() || "";
    }

    return new Response(JSON.stringify({ content: generatedText }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
