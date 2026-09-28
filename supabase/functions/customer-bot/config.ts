import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const CUSTOMER_BOT_TOKEN = Deno.env.get("CUSTOMER_BOT_TOKEN") || "";
export const ADMIN_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
export const STAFF_CHAT_ID = String(
  Deno.env.get("ADMIN_CHAT_ID") ||
    Deno.env.get("TELEGRAM_CHAT_ID") ||
    "",
).trim();
export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const XAI_API_KEY = (
  Deno.env.get("XAI_API_KEY") ||
  Deno.env.get("VITE_XAI_API_KEY") ||
  ""
).trim();
export const XAI_TEAM_ID = (
  Deno.env.get("XAI_TEAM_ID") ||
  ""
).trim();

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
