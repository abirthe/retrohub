export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          actor_id: string | null
          after_state: Json | null
          before_state: Json | null
          created_at: string | null
          event_type: string
          id: string
          record_id: string | null
          table_name: string | null
        }
        Insert: {
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          event_type: string
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Update: {
          actor_id?: string | null
          after_state?: Json | null
          before_state?: Json | null
          created_at?: string | null
          event_type?: string
          id?: string
          record_id?: string | null
          table_name?: string | null
        }
        Relationships: []
      }
      inventory_keys: {
        Row: {
          created_at: string | null
          id: string
          order_id: string | null
          pin_code: string
          product_id: string | null
          serial_number: string | null
          sold_at: string | null
          status: Database["public"]["Enums"]["key_status"] | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          pin_code: string
          product_id?: string | null
          serial_number?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["key_status"] | null
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string | null
          pin_code?: string
          product_id?: string | null
          serial_number?: string | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["key_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_keys_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_inventory_keys_order"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cost: number | null
          created_at: string | null
          customer_input: Json | null
          final_output: string | null
          id: string
          product_id: string | null
          profit: number | null
          status: Database["public"]["Enums"]["order_status"] | null
          total: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          customer_input?: Json | null
          final_output?: string | null
          id?: string
          product_id?: string | null
          profit?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          customer_input?: Json | null
          final_output?: string | null
          id?: string
          product_id?: string | null
          profit?: number | null
          status?: Database["public"]["Enums"]["order_status"] | null
          total?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: Database["public"]["Enums"]["product_category"]
          cost_price: number
          created_at: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          description: string | null
          id: string
          image_url: string | null
          in_stock: number | null
          is_active: boolean | null
          platform: string | null
          region: Database["public"]["Enums"]["region_tag"] | null
          sale_price: number
          title: string
          updated_at: string | null
        }
        Insert: {
          category: Database["public"]["Enums"]["product_category"]
          cost_price: number
          created_at?: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"]
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: number | null
          is_active?: boolean | null
          platform?: string | null
          region?: Database["public"]["Enums"]["region_tag"] | null
          sale_price: number
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["product_category"]
          cost_price?: number
          created_at?: string | null
          delivery_type?: Database["public"]["Enums"]["delivery_type"]
          description?: string | null
          id?: string
          image_url?: string | null
          in_stock?: number | null
          is_active?: boolean | null
          platform?: string | null
          region?: Database["public"]["Enums"]["region_tag"] | null
          sale_price?: number
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      retry_failed_order: { Args: { p_order_id: string }; Returns: boolean }
      sync_all_stock: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      delivery_type: "instant_code" | "api_h2h" | "automation"
      key_status: "available" | "sold" | "expired"
      order_status:
        | "pending"
        | "validated"
        | "processing"
        | "completed"
        | "failed"
        | "cancelled"
        | "refunded"
      product_category: "pc_game" | "xbox_game" | "ps_game" | "topup" | "subscription" | "software" | "giftcard"
      region_tag:
        | "GLOBAL"
        | "US"
        | "EU"
        | "ASIA"
        | "LATAM"
        | "UK"
        | "CA"
        | "MX"
        | "BR"
        | "IN"
        | "CN"
        | "JP"
        | "KR"
        | "AU"
        | "NZ"
        | "ME"
        | "AFRICA"
        | "OCEANIA"
        | "AE"
        | "SA"
        | "ZA"
        | "RU"
        | "TR"
        | "SG"
        | "MY"
        | "TH"
        | "ID"
        | "PH"
        | "VN"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
      delivery_type: ["instant_code", "api_h2h", "automation"],
      key_status: ["available", "sold", "expired"],
      order_status: [
        "pending",
        "validated",
        "processing",
        "completed",
        "failed",
        "cancelled",
        "refunded",
      ],
      product_category: ["pc_game", "xbox_game", "ps_game", "topup", "subscription", "software", "giftcard"],
      region_tag: [
        "GLOBAL",
        "US",
        "EU",
        "ASIA",
        "LATAM",
        "UK",
        "CA",
        "MX",
        "BR",
        "IN",
        "CN",
        "JP",
        "KR",
        "AU",
        "NZ",
        "ME",
        "AFRICA",
        "OCEANIA",
        "AE",
        "SA",
        "ZA",
        "RU",
        "TR",
        "SG",
        "MY",
        "TH",
        "ID",
        "PH",
        "VN",
      ],
    },
  },
} as const
