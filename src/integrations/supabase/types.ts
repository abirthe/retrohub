export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_action_logs: {
        Row: {
          action: string
          admin_id: string | null
          after_status: Database["public"]["Enums"]["order_status"] | null
          before_status: Database["public"]["Enums"]["order_status"] | null
          created_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          order_id: string | null
        }
        Insert: {
          action: string
          admin_id?: string | null
          after_status?: Database["public"]["Enums"]["order_status"] | null
          before_status?: Database["public"]["Enums"]["order_status"] | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string | null
          after_status?: Database["public"]["Enums"]["order_status"] | null
          before_status?: Database["public"]["Enums"]["order_status"] | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          order_id?: string | null
        }
        Relationships: []
      }
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
      custom_orders: {
        Row: {
          created_at: string | null
          details: string | null
          email: string
          id: string
          name: string
          platform: string
          product_name: string
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: string | null
          email: string
          id?: string
          name: string
          platform: string
          product_name: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: string | null
          email?: string
          id?: string
          name?: string
          platform?: string
          product_name?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          admin_id: string | null
          cost_paid: number | null
          created_at: string | null
          delivered_at: string | null
          delivery_code: string
          delivery_notes: string | null
          id: string
          order_id: string
          sourced_at: string | null
          sourced_from: string | null
        }
        Insert: {
          admin_id?: string | null
          cost_paid?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_code: string
          delivery_notes?: string | null
          id?: string
          order_id: string
          sourced_at?: string | null
          sourced_from?: string | null
        }
        Update: {
          admin_id?: string | null
          cost_paid?: number | null
          created_at?: string | null
          delivered_at?: string | null
          delivery_code?: string
          delivery_notes?: string | null
          id?: string
          order_id?: string
          sourced_at?: string | null
          sourced_from?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
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
          source_platform: string | null
          source_url: string | null
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
          source_platform?: string | null
          source_url?: string | null
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
          source_platform?: string | null
          source_url?: string | null
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
      v_orders_today: {
        Row: {
          order_count: number | null
        }
        Relationships: []
      }
      v_pending_action_count: {
        Row: {
          count: number | null
        }
        Relationships: []
      }
      v_profit_today: {
        Row: {
          profit: number | null
          total_cost: number | null
          total_revenue: number | null
        }
        Relationships: []
      }
      v_revenue_today: {
        Row: {
          revenue: number | null
        }
        Relationships: []
      }
      v_grouped_products: {
        Row: {
          base_title: string | null
          category: Database["public"]["Enums"]["product_category"] | null
          cost_price: number | null
          created_at: string | null
          delivery_type: Database["public"]["Enums"]["delivery_type"] | null
          id: string | null
          image_url: string | null
          in_stock: number | null
          is_active: boolean | null
          platform: string | null
          region: Database["public"]["Enums"]["region_tag"] | null
          sale_price: number | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      fulfill_order: {
        Args: {
          p_order_id: string
          p_delivery_code: string
          p_cost_paid?: number
          p_sourced_from?: string
          p_notes?: string
        }
        Returns: Json
      }
      has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"]; _user_id: string }
        Returns: boolean
      }
      hold_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      refund_order: {
        Args: { p_order_id: string; p_reason?: string }
        Returns: Json
      }
      start_sourcing: {
        Args: { p_order_id: string }
        Returns: Json
      }
      validate_order: {
        Args: { p_order_id: string }
        Returns: Json
      }
      verify_payment: {
        Args: { p_order_id: string }
        Returns: Json
      }
    }
    Enums: {
      app_role: "admin" | "user"
      delivery_type: "instant_code" | "api_h2h" | "automation"
      order_status:
        | "pending"
        | "payment_submitted"
        | "payment_verified"
        | "sourcing"
        | "fulfilled"
        | "failed"
        | "cancelled"
        | "refunded"
      product_category: "pc_game" | "xbox_game" | "ps_game" | "topup" | "subscription" | "software" | "giftcard" | "service"
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
        | "AR"
        | "CO"
        | "CL"
        | "PE"
        | "EG"
        | "NG"
        | "PK"
        | "BD"
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
      order_status: [
        "pending",
        "payment_submitted",
        "payment_verified",
        "sourcing",
        "fulfilled",
        "failed",
        "cancelled",
        "refunded",
      ],
      product_category: ["pc_game", "xbox_game", "ps_game", "topup", "subscription", "software", "giftcard", "service"],
      region_tag: [
        "GLOBAL", "US", "EU", "ASIA", "LATAM", "UK", "CA", "MX", "BR", "IN",
        "CN", "JP", "KR", "AU", "NZ", "ME", "AFRICA", "OCEANIA", "AE", "SA",
        "ZA", "RU", "TR", "SG", "MY", "TH", "ID", "PH", "VN",
        "AR", "CO", "CL", "PE", "EG", "NG", "PK", "BD",
      ],
    },
  },
} as const
