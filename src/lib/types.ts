// src/lib/types.ts
// Centralized type definitions shared across all API modules.

import type { Database } from "@/integrations/supabase/types";

// ─── Enum Aliases ─────────────────────────────────────────────────────────────
export type ProductCategory = Database["public"]["Enums"]["product_category"];
export type DeliveryType = Database["public"]["Enums"]["delivery_type"];
export type Region = Database["public"]["Enums"]["region_tag"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type AppRole = Database["public"]["Enums"]["app_role"];

// ─── Table Row Types ──────────────────────────────────────────────────────────
export type Product = Database["public"]["Tables"]["products"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type Delivery = Database["public"]["Tables"]["deliveries"]["Row"];
export type AdminActionLog =
  Database["public"]["Tables"]["admin_action_logs"]["Row"];

// ─── Domain Interfaces ────────────────────────────────────────────────────────
export interface CustomOrderPayload {
  name: string;
  email: string;
  productName: string;
  platform: string;
  details: string;
}

export type CustomOrderRow = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  product_name: string;
  platform: string;
  details: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};
