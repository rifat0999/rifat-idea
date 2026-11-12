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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          accepted_at: string | null
          amount_bdt: number
          business_id: string
          campaign_id: string | null
          commission_bdt: number
          commission_rate: number
          completed_at: string | null
          created_at: string
          creator_id: string
          creator_payout_bdt: number
          creator_user_id: string
          decline_reason: string | null
          deliverable_url: string | null
          delivered_at: string | null
          due_date: string | null
          id: string
          package_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          requirements: string | null
          status: Database["public"]["Enums"]["booking_status"]
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          amount_bdt: number
          business_id: string
          campaign_id?: string | null
          commission_bdt?: number
          commission_rate?: number
          completed_at?: string | null
          created_at?: string
          creator_id: string
          creator_payout_bdt?: number
          creator_user_id: string
          decline_reason?: string | null
          deliverable_url?: string | null
          delivered_at?: string | null
          due_date?: string | null
          id?: string
          package_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          requirements?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          amount_bdt?: number
          business_id?: string
          campaign_id?: string | null
          commission_bdt?: number
          commission_rate?: number
          completed_at?: string | null
          created_at?: string
          creator_id?: string
          creator_payout_bdt?: number
          creator_user_id?: string
          decline_reason?: string | null
          deliverable_url?: string | null
          delivered_at?: string | null
          due_date?: string | null
          id?: string
          package_id?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          requirements?: string | null
          status?: Database["public"]["Enums"]["booking_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          about: string | null
          company_name: string
          created_at: string
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
          website: string | null
        }
        Insert: {
          about?: string | null
          company_name: string
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Update: {
          about?: string | null
          company_name?: string
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
          website?: string | null
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          brief: string | null
          budget_bdt: number
          business_id: string
          created_at: string
          end_date: string | null
          id: string
          niches: string[]
          objective: string | null
          platforms: Database["public"]["Enums"]["social_platform"][]
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at: string
        }
        Insert: {
          brief?: string | null
          budget_bdt?: number
          business_id: string
          created_at?: string
          end_date?: string | null
          id?: string
          niches?: string[]
          objective?: string | null
          platforms?: Database["public"]["Enums"]["social_platform"][]
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title: string
          updated_at?: string
        }
        Update: {
          brief?: string | null
          budget_bdt?: number
          business_id?: string
          created_at?: string
          end_date?: string | null
          id?: string
          niches?: string[]
          objective?: string | null
          platforms?: Database["public"]["Enums"]["social_platform"][]
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      conversations: {
        Row: {
          business_id: string
          created_at: string
          creator_id: string
          creator_user_id: string
          id: string
          last_message_at: string
        }
        Insert: {
          business_id: string
          created_at?: string
          creator_id: string
          creator_user_id: string
          id?: string
          last_message_at?: string
        }
        Update: {
          business_id?: string
          created_at?: string
          creator_id?: string
          creator_user_id?: string
          id?: string
          last_message_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      creator_profiles: {
        Row: {
          audience: Json
          avatar_url: string | null
          avg_engagement: number
          bio: string | null
          bio_bn: string | null
          cover_url: string | null
          created_at: string
          display_name: string
          headline: string | null
          headline_bn: string | null
          id: string
          is_featured: boolean
          is_published: boolean
          languages: string[]
          location: string
          niches: string[]
          rating_avg: number
          rating_count: number
          slug: string
          starting_price: number
          total_followers: number
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          audience?: Json
          avatar_url?: string | null
          avg_engagement?: number
          bio?: string | null
          bio_bn?: string | null
          cover_url?: string | null
          created_at?: string
          display_name: string
          headline?: string | null
          headline_bn?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          languages?: string[]
          location?: string
          niches?: string[]
          rating_avg?: number
          rating_count?: number
          slug: string
          starting_price?: number
          total_followers?: number
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          audience?: Json
          avatar_url?: string | null
          avg_engagement?: number
          bio?: string | null
          bio_bn?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string
          headline?: string | null
          headline_bn?: string | null
          id?: string
          is_featured?: boolean
          is_published?: boolean
          languages?: string[]
          location?: string
          niches?: string[]
          rating_avg?: number
          rating_count?: number
          slug?: string
          starting_price?: number
          total_followers?: number
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: []
      }
      creator_socials: {
        Row: {
          avg_views: number
          created_at: string
          creator_id: string
          engagement_rate: number
          followers: number
          handle: string
          id: string
          platform: Database["public"]["Enums"]["social_platform"]
          url: string | null
        }
        Insert: {
          avg_views?: number
          created_at?: string
          creator_id: string
          engagement_rate?: number
          followers?: number
          handle: string
          id?: string
          platform: Database["public"]["Enums"]["social_platform"]
          url?: string | null
        }
        Update: {
          avg_views?: number
          created_at?: string
          creator_id?: string
          engagement_rate?: number
          followers?: number
          handle?: string
          id?: string
          platform?: Database["public"]["Enums"]["social_platform"]
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "creator_socials_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      disputes: {
        Row: {
          booking_id: string
          created_at: string
          details: string | null
          id: string
          raised_by: string
          reason: string
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["dispute_status"]
        }
        Insert: {
          booking_id: string
          created_at?: string
          details?: string | null
          id?: string
          raised_by: string
          reason: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Update: {
          booking_id?: string
          created_at?: string
          details?: string | null
          id?: string
          raised_by?: string
          reason?: string
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["dispute_status"]
        }
        Relationships: [
          {
            foreignKeyName: "disputes_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          conversation_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          conversation_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          conversation_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          creator_id: string
          deliverables: string[]
          delivery_days: number
          description: string | null
          id: string
          is_active: boolean
          platform: Database["public"]["Enums"]["social_platform"]
          price_bdt: number
          title: string
          title_bn: string | null
        }
        Insert: {
          created_at?: string
          creator_id: string
          deliverables?: string[]
          delivery_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          platform: Database["public"]["Enums"]["social_platform"]
          price_bdt: number
          title: string
          title_bn?: string | null
        }
        Update: {
          created_at?: string
          creator_id?: string
          deliverables?: string[]
          delivery_days?: number
          description?: string | null
          id?: string
          is_active?: boolean
          platform?: Database["public"]["Enums"]["social_platform"]
          price_bdt?: number
          title?: string
          title_bn?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_note: string | null
          amount_bdt: number
          booking_id: string
          business_id: string
          created_at: string
          id: string
          method: string
          reviewed_at: string | null
          reviewed_by: string | null
          sender_account: string | null
          status: string
          transaction_ref: string
        }
        Insert: {
          admin_note?: string | null
          amount_bdt: number
          booking_id: string
          business_id: string
          created_at?: string
          id?: string
          method: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_account?: string | null
          status?: string
          transaction_ref: string
        }
        Update: {
          admin_note?: string | null
          amount_bdt?: number
          booking_id?: string
          business_id?: string
          created_at?: string
          id?: string
          method?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          sender_account?: string | null
          status?: string
          transaction_ref?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          commission_rate: number
          id: number
          payment_instructions: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          commission_rate?: number
          id?: number
          payment_instructions?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          commission_rate?: number
          id?: number
          payment_instructions?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          preferred_language: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          business_id: string
          comment: string | null
          created_at: string
          creator_id: string
          id: string
          rating: number
        }
        Insert: {
          booking_id?: string | null
          business_id: string
          comment?: string | null
          created_at?: string
          creator_id: string
          id?: string
          rating: number
        }
        Update: {
          booking_id?: string | null
          business_id?: string
          comment?: string | null
          created_at?: string
          creator_id?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "creator_profiles"
            referencedColumns: ["id"]
          },
        ]
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
      verification_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          id: string
          kind: string
          message: string | null
          proof_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          id?: string
          kind: string
          message?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
          proof_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      choose_role: {
        Args: { _name: string; _role: Database["public"]["Enums"]["app_role"] }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      setup_account: {
        Args: {
          _name: string
          _role: Database["public"]["Enums"]["app_role"]
          _uid: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "business" | "creator"
      booking_status:
        | "pending"
        | "accepted"
        | "declined"
        | "cancelled"
        | "in_progress"
        | "delivered"
        | "completed"
        | "disputed"
      campaign_status: "draft" | "active" | "completed" | "cancelled"
      dispute_status: "open" | "under_review" | "resolved" | "rejected"
      payment_status:
        | "unpaid"
        | "submitted"
        | "verified"
        | "rejected"
        | "released"
        | "refunded"
      social_platform:
        | "facebook"
        | "instagram"
        | "youtube"
        | "tiktok"
        | "linkedin"
        | "x"
        | "other"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "business", "creator"],
      booking_status: [
        "pending",
        "accepted",
        "declined",
        "cancelled",
        "in_progress",
        "delivered",
        "completed",
        "disputed",
      ],
      campaign_status: ["draft", "active", "completed", "cancelled"],
      dispute_status: ["open", "under_review", "resolved", "rejected"],
      payment_status: [
        "unpaid",
        "submitted",
        "verified",
        "rejected",
        "released",
        "refunded",
      ],
      social_platform: [
        "facebook",
        "instagram",
        "youtube",
        "tiktok",
        "linkedin",
        "x",
        "other",
      ],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
