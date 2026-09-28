import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const TELEGRAM_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
export const ADMIN_CHAT_ID = String(
  Deno.env.get("TELEGRAM_CHAT_ID") ||
    Deno.env.get("ADMIN_CHAT_ID") ||
    "",
).trim();
export const CUSTOMER_BOT_TOKEN = Deno.env.get("CUSTOMER_BOT_TOKEN") || "";
export const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
export const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") || "";
export const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
export const TELEGRAM_WEBHOOK_SECRET = Deno.env.get("TELEGRAM_WEBHOOK_SECRET") || "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
