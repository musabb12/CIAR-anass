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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          bid_per_click: number
          campaign_type: string
          clicks: number
          created_at: string
          daily_budget: number
          ends_at: string
          id: string
          image_url: string | null
          impressions: number
          product_id: string | null
          rejection_reason: string | null
          reviewed_by: string | null
          spent: number
          starts_at: string
          status: string
          store_id: string
          target_category_id: string | null
          target_city: string | null
          title: string
          total_budget: number
          updated_at: string
        }
        Insert: {
          bid_per_click?: number
          campaign_type: string
          clicks?: number
          created_at?: string
          daily_budget?: number
          ends_at: string
          id?: string
          image_url?: string | null
          impressions?: number
          product_id?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          spent?: number
          starts_at?: string
          status?: string
          store_id: string
          target_category_id?: string | null
          target_city?: string | null
          title: string
          total_budget?: number
          updated_at?: string
        }
        Update: {
          bid_per_click?: number
          campaign_type?: string
          clicks?: number
          created_at?: string
          daily_budget?: number
          ends_at?: string
          id?: string
          image_url?: string | null
          impressions?: number
          product_id?: string | null
          rejection_reason?: string | null
          reviewed_by?: string | null
          spent?: number
          starts_at?: string
          status?: string
          store_id?: string
          target_category_id?: string | null
          target_city?: string | null
          title?: string
          total_budget?: number
          updated_at?: string
        }
        Relationships: []
      }
      ad_events: {
        Row: {
          campaign_id: string
          created_at: string
          event_type: string
          id: string
          user_id: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          event_type: string
          id?: string
          user_id?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          event_type?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      addresses: {
        Row: {
          city: string
          created_at: string
          district: string | null
          full_name: string | null
          id: string
          is_default: boolean | null
          label: string | null
          lat: number | null
          lng: number | null
          notes: string | null
          phone: string | null
          street: string | null
          user_id: string
        }
        Insert: {
          city: string
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          phone?: string | null
          street?: string | null
          user_id: string
        }
        Update: {
          city?: string
          created_at?: string
          district?: string | null
          full_name?: string | null
          id?: string
          is_default?: boolean | null
          label?: string | null
          lat?: number | null
          lng?: number | null
          notes?: string | null
          phone?: string | null
          street?: string | null
          user_id?: string
        }
        Relationships: []
      }
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          metadata: Json
          reason: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          metadata?: Json
          reason?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: []
      }
      admin_channels: {
        Row: {
          assigned_admin: string | null
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["admin_channel_kind"]
          last_message_at: string
          metadata: Json
          priority: string
          status: Database["public"]["Enums"]["admin_channel_status"]
          subject: string
          unread_for_admin: number
          unread_for_user: number
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_admin?: string | null
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["admin_channel_kind"]
          last_message_at?: string
          metadata?: Json
          priority?: string
          status?: Database["public"]["Enums"]["admin_channel_status"]
          subject: string
          unread_for_admin?: number
          unread_for_user?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_admin?: string | null
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["admin_channel_kind"]
          last_message_at?: string
          metadata?: Json
          priority?: string
          status?: Database["public"]["Enums"]["admin_channel_status"]
          subject?: string
          unread_for_admin?: number
          unread_for_user?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_messages: {
        Row: {
          attachments: Json
          body: string | null
          channel_id: string
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          id: string
          is_system: boolean
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachments?: Json
          body?: string | null
          channel_id: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_system?: boolean
          sender_id: string
          sender_role?: string
        }
        Update: {
          attachments?: Json
          body?: string | null
          channel_id?: string
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          id?: string
          is_system?: boolean
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "admin_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      app_integrations: {
        Row: {
          category: string
          config: Json
          created_at: string
          description: string | null
          display_name: string
          docs_url: string | null
          enabled: boolean
          has_secret: boolean
          icon: string | null
          id: string
          last_error: string | null
          last_tested_at: string | null
          provider: string
          public_key: string | null
          secret_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          category: string
          config?: Json
          created_at?: string
          description?: string | null
          display_name: string
          docs_url?: string | null
          enabled?: boolean
          has_secret?: boolean
          icon?: string | null
          id?: string
          last_error?: string | null
          last_tested_at?: string | null
          provider: string
          public_key?: string | null
          secret_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          category?: string
          config?: Json
          created_at?: string
          description?: string | null
          display_name?: string
          docs_url?: string | null
          enabled?: boolean
          has_secret?: boolean
          icon?: string | null
          id?: string
          last_error?: string | null
          last_tested_at?: string | null
          provider?: string
          public_key?: string | null
          secret_name?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          app_commission_pct: number
          id: number
          min_pilot_fee: number
          pilot_base_pct: number
          updated_at: string
        }
        Insert: {
          app_commission_pct?: number
          id?: number
          min_pilot_fee?: number
          pilot_base_pct?: number
          updated_at?: string
        }
        Update: {
          app_commission_pct?: number
          id?: number
          min_pilot_fee?: number
          pilot_base_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          display_order: number | null
          icon: string | null
          id: string
          name: string
          name_ar: string
          parent_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name: string
          name_ar: string
          parent_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          icon?: string | null
          id?: string
          name?: string
          name_ar?: string
          parent_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          ciphertext: string
          created_at: string
          id: string
          is_read: boolean | null
          iv: string | null
          sender_id: string
          thread_id: string
        }
        Insert: {
          ciphertext: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          iv?: string | null
          sender_id: string
          thread_id: string
        }
        Update: {
          ciphertext?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          iv?: string | null
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "chat_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_threads: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          participants: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          participants: string[]
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          participants?: string[]
        }
        Relationships: []
      }
      commission_splits: {
        Row: {
          app_amount: number
          created_at: string
          id: string
          order_id: string
          pilot_amount: number
          pilot_tip: number
          seller_amount: number
        }
        Insert: {
          app_amount?: number
          created_at?: string
          id?: string
          order_id: string
          pilot_amount?: number
          pilot_tip?: number
          seller_amount?: number
        }
        Update: {
          app_amount?: number
          created_at?: string
          id?: string
          order_id?: string
          pilot_amount?: number
          pilot_tip?: number
          seller_amount?: number
        }
        Relationships: []
      }
      device_sessions: {
        Row: {
          created_at: string
          device_fingerprint: string
          id: string
          ip_hash: string | null
          last_seen_at: string
          trusted: boolean | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          trusted?: boolean | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          id?: string
          ip_hash?: string | null
          last_seen_at?: string
          trusted?: boolean | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      device_tokens: {
        Row: {
          created_at: string
          id: string
          platform: string
          token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          platform?: string
          token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          platform?: string
          token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      factory_products: {
        Row: {
          available_qty: number | null
          category: string | null
          created_at: string
          description: string | null
          factory_id: string
          id: string
          image_url: string | null
          is_active: boolean | null
          min_order_qty: number
          name: string
          unit_price: number
        }
        Insert: {
          available_qty?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          factory_id: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_order_qty?: number
          name: string
          unit_price: number
        }
        Update: {
          available_qty?: number | null
          category?: string | null
          created_at?: string
          description?: string | null
          factory_id?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          min_order_qty?: number
          name?: string
          unit_price?: number
        }
        Relationships: []
      }
      fraud_signals: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          kind: string
          severity: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          kind: string
          severity?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          kind?: string
          severity?: string
          user_id?: string | null
        }
        Relationships: []
      }
      hero_media: {
        Row: {
          badge_text: string | null
          created_at: string
          cta_text: string | null
          cta_url: string | null
          duration_ms: number
          effect: string
          id: string
          is_active: boolean
          media_type: string
          overlay_opacity: number
          poster_url: string | null
          sort_order: number
          subtitle: string | null
          text_align: string
          text_color: string
          title: string | null
          updated_at: string
          url: string
        }
        Insert: {
          badge_text?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          duration_ms?: number
          effect?: string
          id?: string
          is_active?: boolean
          media_type?: string
          overlay_opacity?: number
          poster_url?: string | null
          sort_order?: number
          subtitle?: string | null
          text_align?: string
          text_color?: string
          title?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          badge_text?: string | null
          created_at?: string
          cta_text?: string | null
          cta_url?: string | null
          duration_ms?: number
          effect?: string
          id?: string
          is_active?: boolean
          media_type?: string
          overlay_opacity?: number
          poster_url?: string | null
          sort_order?: number
          subtitle?: string | null
          text_align?: string
          text_color?: string
          title?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      integration_secrets: {
        Row: {
          provider: string
          secret_value: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          provider: string
          secret_value: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          provider?: string
          secret_value?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "job_applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          applications_count: number | null
          city: string | null
          company_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          job_type: Database["public"]["Enums"]["job_type"]
          posted_by: string
          requirements: string | null
          salary_max: number | null
          salary_min: number | null
          title: string
          views_count: number | null
        }
        Insert: {
          applications_count?: number | null
          city?: string | null
          company_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"]
          posted_by: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title: string
          views_count?: number | null
        }
        Update: {
          applications_count?: number | null
          city?: string | null
          company_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          job_type?: Database["public"]["Enums"]["job_type"]
          posted_by?: string
          requirements?: string | null
          salary_max?: number | null
          salary_min?: number | null
          title?: string
          views_count?: number | null
        }
        Relationships: []
      }
      live_locations: {
        Row: {
          heading: number | null
          id: string
          lat: number
          lng: number
          order_id: string | null
          role: string
          speed: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          heading?: number | null
          id?: string
          lat: number
          lng: number
          order_id?: string | null
          role: string
          speed?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          heading?: number | null
          id?: string
          lat?: number
          lng?: number
          order_id?: string | null
          role?: string
          speed?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string
          product_image: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id: string
          product_image?: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string
          product_image?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address_id: string | null
          created_at: string
          customer_id: string
          distance_km: number | null
          escrow_code: string | null
          escrow_released_at: string | null
          escrow_status: string
          id: string
          notes: string | null
          order_number: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_status: Database["public"]["Enums"]["payment_status"]
          pilot_id: string | null
          pilot_tip: number
          service_fee: number
          shipping_fee: number
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
        }
        Insert: {
          address_id?: string | null
          created_at?: string
          customer_id: string
          distance_km?: number | null
          escrow_code?: string | null
          escrow_released_at?: string | null
          escrow_status?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pilot_id?: string | null
          pilot_tip?: number
          service_fee?: number
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Update: {
          address_id?: string | null
          created_at?: string
          customer_id?: string
          distance_km?: number | null
          escrow_code?: string | null
          escrow_released_at?: string | null
          escrow_status?: string
          id?: string
          notes?: string | null
          order_number?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_status?: Database["public"]["Enums"]["payment_status"]
          pilot_id?: string | null
          pilot_tip?: number
          service_fee?: number
          shipping_fee?: number
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_address_id_fkey"
            columns: ["address_id"]
            isOneToOne: false
            referencedRelation: "addresses"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_intents: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          gateway: string
          id: string
          proof_url: string | null
          reference: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          gateway: string
          id?: string
          proof_url?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          gateway?: string
          id?: string
          proof_url?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_ref: string | null
          created_at: string
          id: string
          is_default: boolean | null
          kind: string
          label: string | null
          meta: Json | null
          user_id: string
        }
        Insert: {
          account_ref?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          kind: string
          label?: string | null
          meta?: Json | null
          user_id: string
        }
        Update: {
          account_ref?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          kind?: string
          label?: string | null
          meta?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          auto_hide_when_oos: boolean | null
          brand: string | null
          category_id: string | null
          condition: string | null
          created_at: string
          description: string | null
          dimensions: string | null
          discount_price: number | null
          id: string
          images: string[] | null
          is_active: boolean | null
          is_featured: boolean | null
          material: string | null
          name: string
          price: number
          product_type: string | null
          rating: number | null
          reviews_count: number | null
          sales_count: number | null
          size: string | null
          sku: string | null
          specs: Json | null
          stock: number
          store_id: string | null
          tags: string[] | null
          updated_at: string
          usage: string | null
          variants: Json | null
          visibility_status: string
          warranty: string | null
          weight: string | null
        }
        Insert: {
          auto_hide_when_oos?: boolean | null
          brand?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          discount_price?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          material?: string | null
          name: string
          price: number
          product_type?: string | null
          rating?: number | null
          reviews_count?: number | null
          sales_count?: number | null
          size?: string | null
          sku?: string | null
          specs?: Json | null
          stock?: number
          store_id?: string | null
          tags?: string[] | null
          updated_at?: string
          usage?: string | null
          variants?: Json | null
          visibility_status?: string
          warranty?: string | null
          weight?: string | null
        }
        Update: {
          auto_hide_when_oos?: boolean | null
          brand?: string | null
          category_id?: string | null
          condition?: string | null
          created_at?: string
          description?: string | null
          dimensions?: string | null
          discount_price?: number | null
          id?: string
          images?: string[] | null
          is_active?: boolean | null
          is_featured?: boolean | null
          material?: string | null
          name?: string
          price?: number
          product_type?: string | null
          rating?: number | null
          reviews_count?: number | null
          sales_count?: number | null
          size?: string | null
          sku?: string | null
          specs?: Json | null
          stock?: number
          store_id?: string | null
          tags?: string[] | null
          updated_at?: string
          usage?: string | null
          variants?: Json | null
          visibility_status?: string
          warranty?: string | null
          weight?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          is_archived: boolean
          last_seen_at: string | null
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_archived?: boolean
          last_seen_at?: string | null
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_archived?: boolean
          last_seen_at?: string | null
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          product_id: string
          rating: number
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id: string
          rating: number
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          user_id?: string
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
      site_settings: {
        Row: {
          created_at: string | null
          id: number
          site_name: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          site_name?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          site_name?: string | null
        }
        Relationships: []
      }
      store_announcements: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          is_active: boolean | null
          priority: number | null
          store_id: string
          title: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          priority?: number | null
          store_id: string
          title: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          priority?: number | null
          store_id?: string
          title?: string
        }
        Relationships: []
      }
      store_contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_read: boolean | null
          message: string
          name: string
          phone: string | null
          sender_id: string | null
          store_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          name: string
          phone?: string | null
          sender_id?: string | null
          store_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          name?: string
          phone?: string | null
          sender_id?: string | null
          store_id?: string
        }
        Relationships: []
      }
      store_followers: {
        Row: {
          created_at: string
          id: string
          store_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string
          user_id?: string
        }
        Relationships: []
      }
      store_promotions: {
        Row: {
          created_at: string
          description: string | null
          discount_pct: number | null
          ends_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          starts_at: string | null
          store_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_pct?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          starts_at?: string | null
          store_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_pct?: number | null
          ends_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          starts_at?: string | null
          store_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      store_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          product_id: string | null
          reason: string
          reporter_id: string
          status: string
          store_id: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          product_id?: string | null
          reason: string
          reporter_id: string
          status?: string
          store_id: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          product_id?: string | null
          reason?: string
          reporter_id?: string
          status?: string
          store_id?: string
        }
        Relationships: []
      }
      store_rewards: {
        Row: {
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_order: number | null
          reward_type: string
          store_id: string
          used_count: number | null
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          reward_type?: string
          store_id: string
          used_count?: number | null
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_order?: number | null
          reward_type?: string
          store_id?: string
          used_count?: number | null
          value?: number
        }
        Relationships: []
      }
      store_settings: {
        Row: {
          accent_color: string | null
          accepts_jobs: boolean | null
          background_url: string | null
          business_hours: Json | null
          currency: string | null
          email: string | null
          id: string
          layout: string | null
          location_address: string | null
          location_lat: number | null
          location_lng: number | null
          payment_methods: Json | null
          primary_color: string | null
          privacy_policy: string | null
          return_policy: string | null
          shipping_policy: string | null
          social_links: Json | null
          store_id: string
          telegram: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          accent_color?: string | null
          accepts_jobs?: boolean | null
          background_url?: string | null
          business_hours?: Json | null
          currency?: string | null
          email?: string | null
          id?: string
          layout?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          payment_methods?: Json | null
          primary_color?: string | null
          privacy_policy?: string | null
          return_policy?: string | null
          shipping_policy?: string | null
          social_links?: Json | null
          store_id: string
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          accent_color?: string | null
          accepts_jobs?: boolean | null
          background_url?: string | null
          business_hours?: Json | null
          currency?: string | null
          email?: string | null
          id?: string
          layout?: string | null
          location_address?: string | null
          location_lat?: number | null
          location_lng?: number | null
          payment_methods?: Json | null
          primary_color?: string | null
          privacy_policy?: string | null
          return_policy?: string | null
          shipping_policy?: string | null
          social_links?: Json | null
          store_id?: string
          telegram?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      store_subscriptions: {
        Row: {
          ad_credits_balance: number
          auto_renew: boolean
          billing_cycle: string
          created_at: string
          expires_at: string
          id: string
          plan_id: string
          starts_at: string
          status: string
          store_id: string
          total_paid: number
          updated_at: string
        }
        Insert: {
          ad_credits_balance?: number
          auto_renew?: boolean
          billing_cycle?: string
          created_at?: string
          expires_at: string
          id?: string
          plan_id: string
          starts_at?: string
          status?: string
          store_id: string
          total_paid?: number
          updated_at?: string
        }
        Update: {
          ad_credits_balance?: number
          auto_renew?: boolean
          billing_cycle?: string
          created_at?: string
          expires_at?: string
          id?: string
          plan_id?: string
          starts_at?: string
          status?: string
          store_id?: string
          total_paid?: number
          updated_at?: string
        }
        Relationships: []
      }
      store_support_tickets: {
        Row: {
          created_at: string
          id: string
          message: string
          priority: string
          reply: string | null
          status: string
          store_id: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          priority?: string
          reply?: string | null
          status?: string
          store_id: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          priority?: string
          reply?: string | null
          status?: string
          store_id?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          admin_notes: string | null
          approval_status: string
          category_id: string | null
          city: string | null
          commission_pct_override: number | null
          cover_url: string | null
          created_at: string
          description: string | null
          featured_until: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean
          is_verified: boolean | null
          logo_url: string | null
          name: string
          owner_id: string
          phone: string | null
          rating: number | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          slug: string
          suspended: boolean
          suspended_reason: string | null
          theme_color: string | null
          total_sales: number | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          approval_status?: string
          category_id?: string | null
          city?: string | null
          commission_pct_override?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean
          is_verified?: boolean | null
          logo_url?: string | null
          name: string
          owner_id: string
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug: string
          suspended?: boolean
          suspended_reason?: string | null
          theme_color?: string | null
          total_sales?: number | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          approval_status?: string
          category_id?: string | null
          city?: string | null
          commission_pct_override?: number | null
          cover_url?: string | null
          created_at?: string
          description?: string | null
          featured_until?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean
          is_verified?: boolean | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          phone?: string | null
          rating?: number | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          slug?: string
          suspended?: boolean
          suspended_reason?: string | null
          theme_color?: string | null
          total_sales?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stores_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          advanced_analytics: boolean
          code: string
          created_at: string
          custom_domain: boolean
          display_order: number
          features: Json
          free_ad_credits: number
          id: string
          is_active: boolean
          max_products: number
          max_promotions: number
          name_ar: string
          premium_badge: boolean
          price_monthly: number
          price_yearly: number
          priority_boost: number
          tagline: string | null
          updated_at: string
          verified_badge: boolean
        }
        Insert: {
          advanced_analytics?: boolean
          code: string
          created_at?: string
          custom_domain?: boolean
          display_order?: number
          features?: Json
          free_ad_credits?: number
          id?: string
          is_active?: boolean
          max_products?: number
          max_promotions?: number
          name_ar: string
          premium_badge?: boolean
          price_monthly?: number
          price_yearly?: number
          priority_boost?: number
          tagline?: string | null
          updated_at?: string
          verified_badge?: boolean
        }
        Update: {
          advanced_analytics?: boolean
          code?: string
          created_at?: string
          custom_domain?: boolean
          display_order?: number
          features?: Json
          free_ad_credits?: number
          id?: string
          is_active?: boolean
          max_products?: number
          max_promotions?: number
          name_ar?: string
          premium_badge?: boolean
          price_monthly?: number
          price_yearly?: number
          priority_boost?: number
          tagline?: string | null
          updated_at?: string
          verified_badge?: boolean
        }
        Relationships: []
      }
      support_call_sessions: {
        Row: {
          channel_id: string
          created_at: string
          created_by: string
          ended_at: string | null
          id: string
          mode: string
          started_at: string
          status: string
          updated_at: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          created_by: string
          ended_at?: string | null
          id?: string
          mode?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          created_by?: string
          ended_at?: string | null
          id?: string
          mode?: string
          started_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_call_sessions_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "admin_channels"
            referencedColumns: ["id"]
          },
        ]
      }
      support_call_signals: {
        Row: {
          channel_id: string
          created_at: string
          id: string
          payload: Json
          sender_id: string
          session_id: string
          signal_type: string
        }
        Insert: {
          channel_id: string
          created_at?: string
          id?: string
          payload?: Json
          sender_id: string
          session_id: string
          signal_type: string
        }
        Update: {
          channel_id?: string
          created_at?: string
          id?: string
          payload?: Json
          sender_id?: string
          session_id?: string
          signal_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_call_signals_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "admin_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_call_signals_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "support_call_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          reference: string | null
          status: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["transaction_status"]
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bans: {
        Row: {
          banned_by: string
          banned_until: string | null
          created_at: string
          id: string
          is_active: boolean
          reason: string
          user_id: string
        }
        Insert: {
          banned_by: string
          banned_until?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          reason: string
          user_id: string
        }
        Update: {
          banned_by?: string
          banned_until?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_security: {
        Row: {
          created_at: string
          failed_attempts: number
          id: string
          locked_until: string | null
          otp_code: string | null
          otp_expires_at: string | null
          pin_hash: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          failed_attempts?: number
          id?: string
          locked_until?: string | null
          otp_code?: string | null
          otp_expires_at?: string | null
          pin_hash?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          failed_attempts?: number
          id?: string
          locked_until?: string | null
          otp_code?: string | null
          otp_expires_at?: string | null
          pin_hash?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          created_at: string
          currency: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_wallet: {
        Args: { _amount: number; _reason: string; _user_id: string }
        Returns: Json
      }
      admin_approve_store: {
        Args: { _approve: boolean; _reason?: string; _store_id: string }
        Returns: Json
      }
      admin_archive_user: {
        Args: { _archive: boolean; _user_id: string }
        Returns: Json
      }
      admin_assign_order_pilot: {
        Args: { _order_id: string; _pilot_id: string }
        Returns: Json
      }
      admin_ban_user: {
        Args: { _reason: string; _until?: string; _user_id: string }
        Returns: Json
      }
      admin_close_channel: {
        Args: {
          _channel_id: string
          _status: Database["public"]["Enums"]["admin_channel_status"]
        }
        Returns: Json
      }
      admin_create_store_for_user: {
        Args: { _owner_id: string; _payload: Json }
        Returns: Json
      }
      admin_delete_channel: { Args: { _channel_id: string }; Returns: boolean }
      admin_delete_channels_bulk: { Args: { _ids: string[] }; Returns: number }
      admin_delete_store: { Args: { _store_id: string }; Returns: Json }
      admin_feature_store: {
        Args: { _days?: number; _featured: boolean; _store_id: string }
        Returns: Json
      }
      admin_pilots_overview: { Args: never; Returns: Json }
      admin_refund_order: {
        Args: { _order_id: string; _reason?: string }
        Returns: Json
      }
      admin_save_integration_secret: {
        Args: { _provider: string; _value: string }
        Returns: Json
      }
      admin_security_overview: { Args: never; Returns: Json }
      admin_set_store_commission: {
        Args: { _pct: number; _store_id: string }
        Returns: Json
      }
      admin_set_user_role: {
        Args: {
          _add: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: Json
      }
      admin_store_stats: { Args: { _store_id: string }; Returns: Json }
      admin_suspend_store: {
        Args: { _reason?: string; _store_id: string; _suspend: boolean }
        Returns: Json
      }
      admin_trust_device: {
        Args: { _device_id: string; _trusted: boolean }
        Returns: Json
      }
      admin_unban_user: { Args: { _user_id: string }; Returns: Json }
      admin_update_order_status: {
        Args: {
          _order_id: string
          _status: Database["public"]["Enums"]["order_status"]
        }
        Returns: Json
      }
      admin_update_store: {
        Args: { _patch: Json; _store_id: string }
        Returns: Json
      }
      compute_split: {
        Args: { _shipping: number; _subtotal: number; _tip: number }
        Returns: Json
      }
      confirm_delivery: {
        Args: { _code: string; _order_id: string }
        Returns: Json
      }
      delete_admin_message: { Args: { _message_id: string }; Returns: Json }
      get_store_boost: { Args: { _store_id: string }; Returns: number }
      has_integration_secret: { Args: { _provider: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      mark_admin_channel_read: {
        Args: { _channel_id: string }
        Returns: undefined
      }
      purchase_ad_campaign: {
        Args: {
          _bid: number
          _campaign_type: string
          _daily_budget: number
          _days: number
          _image_url: string
          _product_id: string
          _store_id: string
          _target_category: string
          _target_city: string
          _title: string
          _total_budget: number
        }
        Returns: Json
      }
      set_wallet_pin: { Args: { _pin: string }; Returns: Json }
      subscribe_to_plan: {
        Args: { _cycle: string; _plan_id: string; _store_id: string }
        Returns: Json
      }
      track_ad_event: {
        Args: { _campaign_id: string; _event: string }
        Returns: Json
      }
      user_close_channel: { Args: { _channel_id: string }; Returns: Json }
      verify_wallet_pin: { Args: { _pin: string }; Returns: boolean }
      wallet_transact: {
        Args: {
          _amount: number
          _description?: string
          _reference?: string
          _type: string
          _user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      admin_channel_kind:
        | "support"
        | "ticket"
        | "complaint"
        | "report"
        | "contact"
        | "help"
      admin_channel_status: "open" | "in_progress" | "resolved" | "closed"
      app_role:
        | "customer"
        | "seller"
        | "factory"
        | "pilot"
        | "jobseeker"
        | "admin"
      application_status:
        | "pending"
        | "reviewing"
        | "interview"
        | "accepted"
        | "rejected"
      job_type: "full_time" | "part_time" | "contract" | "remote" | "internship"
      notification_type: "order" | "wallet" | "job" | "system" | "promo"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "shipping"
        | "delivered"
        | "cancelled"
        | "returned"
      payment_method: "wallet" | "cod" | "bank_transfer"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      transaction_status: "pending" | "completed" | "failed"
      transaction_type:
        | "deposit"
        | "withdraw"
        | "purchase"
        | "refund"
        | "commission"
        | "salary"
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
      admin_channel_kind: [
        "support",
        "ticket",
        "complaint",
        "report",
        "contact",
        "help",
      ],
      admin_channel_status: ["open", "in_progress", "resolved", "closed"],
      app_role: [
        "customer",
        "seller",
        "factory",
        "pilot",
        "jobseeker",
        "admin",
      ],
      application_status: [
        "pending",
        "reviewing",
        "interview",
        "accepted",
        "rejected",
      ],
      job_type: ["full_time", "part_time", "contract", "remote", "internship"],
      notification_type: ["order", "wallet", "job", "system", "promo"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "shipping",
        "delivered",
        "cancelled",
        "returned",
      ],
      payment_method: ["wallet", "cod", "bank_transfer"],
      payment_status: ["pending", "paid", "failed", "refunded"],
      transaction_status: ["pending", "completed", "failed"],
      transaction_type: [
        "deposit",
        "withdraw",
        "purchase",
        "refund",
        "commission",
        "salary",
      ],
    },
  },
} as const
