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
      addresses: {
        Row: {
          address: string
          city: string
          created_at: string
          full_name: string
          id: string
          is_default: boolean
          landmark: string | null
          phone: string
          pincode: string
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          full_name?: string
          id?: string
          is_default?: boolean
          landmark?: string | null
          phone?: string
          pincode?: string
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author: string | null
          content: string
          created_at: string
          excerpt: string | null
          id: string
          image: string | null
          is_published: boolean | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image?: string | null
          is_published?: boolean | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          id?: string
          image?: string | null
          is_published?: boolean | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cart_snapshots: {
        Row: {
          item_count: number
          items: Json
          last_reminder_sent_at: string | null
          total: number
          updated_at: string
          user_id: string
        }
        Insert: {
          item_count?: number
          items?: Json
          last_reminder_sent_at?: string | null
          total?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          item_count?: number
          items?: Json
          last_reminder_sent_at?: string | null
          total?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order_value: number | null
          updated_at: string
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          updated_at?: string
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order_value?: number | null
          updated_at?: string
          used_count?: number | null
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      flash_sales: {
        Row: {
          banner_color: string | null
          created_at: string
          description: string | null
          discount_percentage: number
          end_time: string
          id: string
          is_active: boolean | null
          product_ids: string[]
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_color?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number
          end_time: string
          id?: string
          is_active?: boolean | null
          product_ids?: string[]
          start_time?: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_color?: string | null
          created_at?: string
          description?: string | null
          discount_percentage?: number
          end_time?: string
          id?: string
          is_active?: boolean | null
          product_ids?: string[]
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          announcements: boolean
          cart_reminders: boolean
          created_at: string
          flash_sales: boolean
          new_arrivals: boolean
          offers: boolean
          orders: boolean
          updated_at: string
          user_id: string
          wishlist: boolean
        }
        Insert: {
          announcements?: boolean
          cart_reminders?: boolean
          created_at?: string
          flash_sales?: boolean
          new_arrivals?: boolean
          offers?: boolean
          orders?: boolean
          updated_at?: string
          user_id: string
          wishlist?: boolean
        }
        Update: {
          announcements?: boolean
          cart_reminders?: boolean
          created_at?: string
          flash_sales?: boolean
          new_arrivals?: boolean
          offers?: boolean
          orders?: boolean
          updated_at?: string
          user_id?: string
          wishlist?: boolean
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      order_items: {
        Row: {
          color: string | null
          created_at: string
          id: string
          image: string | null
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
          size: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          image?: string | null
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
          size?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          image?: string | null
          order_id?: string
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
          size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancellation_reason: string | null
          cod_fee: number
          created_at: string
          delivered_at: string | null
          id: string
          invoice_generated_at: string | null
          invoice_url: string | null
          order_number: string
          payment_id: string | null
          payment_method: string
          payment_status: string
          refund_amount: number | null
          refund_eta: string | null
          refund_method: string | null
          refund_processed_at: string | null
          rejection_reason: string | null
          return_reason: string | null
          shipping_address: Json
          shipping_cost: number
          status: string
          subtotal: number
          total: number
          tracking_awb: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancellation_reason?: string | null
          cod_fee?: number
          created_at?: string
          delivered_at?: string | null
          id?: string
          invoice_generated_at?: string | null
          invoice_url?: string | null
          order_number: string
          payment_id?: string | null
          payment_method: string
          payment_status?: string
          refund_amount?: number | null
          refund_eta?: string | null
          refund_method?: string | null
          refund_processed_at?: string | null
          rejection_reason?: string | null
          return_reason?: string | null
          shipping_address: Json
          shipping_cost?: number
          status?: string
          subtotal: number
          total: number
          tracking_awb?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancellation_reason?: string | null
          cod_fee?: number
          created_at?: string
          delivered_at?: string | null
          id?: string
          invoice_generated_at?: string | null
          invoice_url?: string | null
          order_number?: string
          payment_id?: string | null
          payment_method?: string
          payment_status?: string
          refund_amount?: number | null
          refund_eta?: string | null
          refund_method?: string | null
          refund_processed_at?: string | null
          rejection_reason?: string | null
          return_reason?: string | null
          shipping_address?: Json
          shipping_cost?: number
          status?: string
          subtotal?: number
          total?: number
          tracking_awb?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pending_payments: {
        Row: {
          created_at: string
          id: string
          is_buy_now: boolean | null
          items: Json
          order_id: string | null
          shipping_address: Json
          shipping_cost: number
          status: string
          subtotal: number
          total: number
          txnid: string
          updated_at: string
          user_email: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_buy_now?: boolean | null
          items: Json
          order_id?: string | null
          shipping_address: Json
          shipping_cost?: number
          status?: string
          subtotal: number
          total: number
          txnid: string
          updated_at?: string
          user_email?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_buy_now?: boolean | null
          items?: Json
          order_id?: string | null
          shipping_address?: Json
          shipping_cost?: number
          status?: string
          subtotal?: number
          total?: number
          txnid?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          additional_images: string[] | null
          brand: string
          category: string
          colors: Json | null
          created_at: string
          description: string | null
          discount: number | null
          id: string
          image: string
          in_stock: boolean | null
          low_stock_threshold: number | null
          name: string
          original_price: number | null
          price: number
          sizes: string[] | null
          stock_quantity: number | null
          subcategory: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          additional_images?: string[] | null
          brand?: string
          category?: string
          colors?: Json | null
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image?: string
          in_stock?: boolean | null
          low_stock_threshold?: number | null
          name: string
          original_price?: number | null
          price: number
          sizes?: string[] | null
          stock_quantity?: number | null
          subcategory?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          additional_images?: string[] | null
          brand?: string
          category?: string
          colors?: Json | null
          created_at?: string
          description?: string | null
          discount?: number | null
          id?: string
          image?: string
          in_stock?: boolean | null
          low_stock_threshold?: number | null
          name?: string
          original_price?: number | null
          price?: number
          sizes?: string[] | null
          stock_quantity?: number | null
          subcategory?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      push_campaigns: {
        Row: {
          audience: string
          category: string
          created_at: string
          created_by: string | null
          id: string
          message: string
          recipients_count: number | null
          scheduled_at: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          audience?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          audience?: string
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
          recipients_count?: number | null
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      push_config: {
        Row: {
          created_at: string
          id: string
          private_key: string
          public_key: string
          subject: string
        }
        Insert: {
          created_at?: string
          id?: string
          private_key: string
          public_key: string
          subject?: string
        }
        Update: {
          created_at?: string
          id?: string
          private_key?: string
          public_key?: string
          subject?: string
        }
        Relationships: []
      }
      push_send_log: {
        Row: {
          category: string
          dedupe_key: string
          id: string
          sent_at: string
          user_id: string | null
        }
        Insert: {
          category: string
          dedupe_key: string
          id?: string
          sent_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          dedupe_key?: string
          id?: string
          sent_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          id: string
          referral_code: string
          referred_discount_applied: boolean | null
          referred_email: string | null
          referred_id: string | null
          referrer_discount_applied: boolean | null
          referrer_id: string
          status: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          referral_code: string
          referred_discount_applied?: boolean | null
          referred_email?: string | null
          referred_id?: string | null
          referrer_discount_applied?: boolean | null
          referrer_id: string
          status?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          referral_code?: string
          referred_discount_applied?: boolean | null
          referred_email?: string | null
          referred_id?: string | null
          referrer_discount_applied?: boolean | null
          referrer_id?: string
          status?: string
          used_at?: string | null
        }
        Relationships: []
      }
      returns: {
        Row: {
          auto_approved: boolean
          created_at: string
          id: string
          images: string[] | null
          manual_review_reason: string | null
          order_id: string
          payu_refund_id: string | null
          picked_up_at: string | null
          reason_code: string
          reason_details: string | null
          refund_amount: number
          refund_method: string
          refunded_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_approved?: boolean
          created_at?: string
          id?: string
          images?: string[] | null
          manual_review_reason?: string | null
          order_id: string
          payu_refund_id?: string | null
          picked_up_at?: string | null
          reason_code: string
          reason_details?: string | null
          refund_amount?: number
          refund_method?: string
          refunded_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_approved?: boolean
          created_at?: string
          id?: string
          images?: string[] | null
          manual_review_reason?: string | null
          order_id?: string
          payu_refund_id?: string | null
          picked_up_at?: string | null
          reason_code?: string
          reason_details?: string | null
          refund_amount?: number
          refund_method?: string
          refunded_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string
          created_at: string
          helpful: number | null
          id: string
          images: string[] | null
          product_id: string
          rating: number
          title: string
          user_id: string
          user_name: string
          verified: boolean | null
        }
        Insert: {
          comment?: string
          created_at?: string
          helpful?: number | null
          id?: string
          images?: string[] | null
          product_id: string
          rating?: number
          title?: string
          user_id: string
          user_name?: string
          verified?: boolean | null
        }
        Update: {
          comment?: string
          created_at?: string
          helpful?: number | null
          id?: string
          images?: string[] | null
          product_id?: string
          rating?: number
          title?: string
          user_id?: string
          user_name?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_visits: {
        Row: {
          created_at: string
          id: string
          page: string
          user_agent: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page?: string
          user_agent?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page?: string
          user_agent?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      wishlist_items: {
        Row: {
          created_at: string
          id: string
          last_seen_in_stock: boolean
          last_seen_price: number
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_in_stock?: boolean
          last_seen_price: number
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_in_stock?: boolean
          last_seen_price?: number
          product_id?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_email_by_phone: { Args: { p_phone: string }; Returns: string }
      is_owner_of_order: { Args: { order_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
