export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)";
  };
  public: {
    Tables: {
      access_codes: {
        Row: {
          code: string;
          created_at: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean;
          updated_at: string;
        };
        Insert: {
          code: string;
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Update: {
          code?: string;
          created_at?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      access_links: {
        Row: {
          access_code: string | null;
          access_code_id: string | null;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          is_admin: boolean;
          kakao_nickname: string | null;
          kakao_profile_url: string | null;
          kakao_user_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          access_code?: string | null;
          access_code_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_admin?: boolean;
          kakao_nickname?: string | null;
          kakao_profile_url?: string | null;
          kakao_user_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          access_code?: string | null;
          access_code_id?: string | null;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_admin?: boolean;
          kakao_nickname?: string | null;
          kakao_profile_url?: string | null;
          kakao_user_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "access_links_access_code_id_fkey";
            columns: ["access_code_id"];
            isOneToOne: false;
            referencedRelation: "access_codes";
            referencedColumns: ["id"];
          },
        ];
      };
      admin: {
        Row: {
          created_at: string | null;
          id: string;
          last_login_at: string | null;
          password_hash: string;
          username: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          last_login_at?: string | null;
          password_hash: string;
          username: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          last_login_at?: string | null;
          password_hash?: string;
          username?: string;
        };
        Relationships: [];
      };
      admin_action_logs: {
        Row: {
          action_type: string;
          admin_id: string;
          created_at: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          target_user_id: string;
          target_user_nickname: string | null;
          user_agent: string | null;
        };
        Insert: {
          action_type: string;
          admin_id: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          target_user_id: string;
          target_user_nickname?: string | null;
          user_agent?: string | null;
        };
        Update: {
          action_type?: string;
          admin_id?: string;
          created_at?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          target_user_id?: string;
          target_user_nickname?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "admin_action_logs_admin_id_fkey";
            columns: ["admin_id"];
            isOneToOne: false;
            referencedRelation: "access_links";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "admin_action_logs_target_user_id_fkey";
            columns: ["target_user_id"];
            isOneToOne: false;
            referencedRelation: "access_links";
            referencedColumns: ["id"];
          },
        ];
      };
      app_settings: {
        Row: {
          id: string;
          setting_key: string;
          setting_value: Json | null;
        };
        Insert: {
          id?: string;
          setting_key: string;
          setting_value?: Json | null;
        };
        Update: {
          id?: string;
          setting_key?: string;
          setting_value?: Json | null;
        };
        Relationships: [];
      };
      course_categories: {
        Row: {
          cover_image_url: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          key: string;
          name: string;
          sort_order: number | null;
        };
        Insert: {
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key: string;
          name: string;
          sort_order?: number | null;
        };
        Update: {
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key?: string;
          name?: string;
          sort_order?: number | null;
        };
        Relationships: [];
      };
      course_comment_photos: {
        Row: {
          comment_id: string;
          created_at: string | null;
          file_url: string;
          id: string;
          sort_order: number | null;
        };
        Insert: {
          comment_id: string;
          created_at?: string | null;
          file_url: string;
          id?: string;
          sort_order?: number | null;
        };
        Update: {
          comment_id?: string;
          created_at?: string | null;
          file_url?: string;
          id?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "course_comment_photos_comment_id_fkey";
            columns: ["comment_id"];
            isOneToOne: false;
            referencedRelation: "course_comments";
            referencedColumns: ["id"];
          },
        ];
      };
      course_comments: {
        Row: {
          author_nickname: string;
          author_user_key: string | null;
          avatar_url: string | null;
          course_id: string;
          created_at: string | null;
          distance_marker: number | null;
          edited_at: string | null;
          hidden_by_admin: boolean | null;
          id: string;
          is_deleted: boolean | null;
          is_flagged: boolean | null;
          is_visible_in_flight: boolean | null;
          latitude: number | null;
          likes_count: number;
          longitude: number | null;
          message: string;
        };
        Insert: {
          author_nickname: string;
          author_user_key?: string | null;
          avatar_url?: string | null;
          course_id: string;
          created_at?: string | null;
          distance_marker?: number | null;
          edited_at?: string | null;
          hidden_by_admin?: boolean | null;
          id?: string;
          is_deleted?: boolean | null;
          is_flagged?: boolean | null;
          is_visible_in_flight?: boolean | null;
          latitude?: number | null;
          likes_count?: number;
          longitude?: number | null;
          message: string;
        };
        Update: {
          author_nickname?: string;
          author_user_key?: string | null;
          avatar_url?: string | null;
          course_id?: string;
          created_at?: string | null;
          distance_marker?: number | null;
          edited_at?: string | null;
          hidden_by_admin?: boolean | null;
          id?: string;
          is_deleted?: boolean | null;
          is_flagged?: boolean | null;
          is_visible_in_flight?: boolean | null;
          latitude?: number | null;
          likes_count?: number;
          longitude?: number | null;
          message?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_comments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      course_location_notes: {
        Row: {
          content: string | null;
          course_id: string;
          created_at: string | null;
          id: string;
          is_active: boolean | null;
          latitude: number;
          longitude: number;
          memo_type: string | null;
          route_index: number | null;
          show_during_animation: boolean | null;
          title: string;
        };
        Insert: {
          content?: string | null;
          course_id: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          latitude: number;
          longitude: number;
          memo_type?: string | null;
          route_index?: number | null;
          show_during_animation?: boolean | null;
          title: string;
        };
        Update: {
          content?: string | null;
          course_id?: string;
          created_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          latitude?: number;
          longitude?: number;
          memo_type?: string | null;
          route_index?: number | null;
          show_during_animation?: boolean | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "course_location_notes_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      course_photos: {
        Row: {
          caption: string | null;
          course_id: string | null;
          created_at: string | null;
          file_url: string;
          id: string;
          user_id: string | null;
        };
        Insert: {
          caption?: string | null;
          course_id?: string | null;
          created_at?: string | null;
          file_url: string;
          id?: string;
          user_id?: string | null;
        };
        Update: {
          caption?: string | null;
          course_id?: string | null;
          created_at?: string | null;
          file_url?: string;
          id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "course_photos_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      courses: {
        Row: {
          avg_time_min: number | null;
          category_id: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          description: string | null;
          detail_description: string | null;
          difficulty: string | null;
          distance_km: number;
          elevation_gain: number | null;
          gpx_data: Json | null;
          id: string;
          is_active: boolean | null;
          sort_order: number | null;
          start_latitude: number;
          start_longitude: number;
          tags: Json | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          avg_time_min?: number | null;
          category_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          detail_description?: string | null;
          difficulty?: string | null;
          distance_km: number;
          elevation_gain?: number | null;
          gpx_data?: Json | null;
          id?: string;
          is_active?: boolean | null;
          sort_order?: number | null;
          start_latitude: number;
          start_longitude: number;
          tags?: Json | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          avg_time_min?: number | null;
          category_id?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          description?: string | null;
          detail_description?: string | null;
          difficulty?: string | null;
          distance_km?: number;
          elevation_gain?: number | null;
          gpx_data?: Json | null;
          id?: string;
          is_active?: boolean | null;
          sort_order?: number | null;
          start_latitude?: number;
          start_longitude?: number;
          tags?: Json | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "courses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "course_categories";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;
