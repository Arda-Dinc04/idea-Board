export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          display_name: string;
          normalized_name: string;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          display_name: string;
          normalized_name: string;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string;
          normalized_name?: string;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      week_boards: {
        Row: {
          id: string;
          title: string;
          starts_at: string;
          ends_at: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          starts_at: string;
          ends_at: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          starts_at?: string;
          ends_at?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      ideas: {
        Row: {
          id: string;
          board_id: string;
          idea_text: string;
          submitter_name: string;
          normalized_submitter_name: string;
          category: string | null;
          status: "submitted" | "working" | "completed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          board_id: string;
          idea_text: string;
          submitter_name?: string;
          normalized_submitter_name?: string;
          category?: string | null;
          status?: "submitted" | "working" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          board_id?: string;
          idea_text?: string;
          submitter_name?: string;
          normalized_submitter_name?: string;
          category?: string | null;
          status?: "submitted" | "working" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ideas_board_id_fkey";
            columns: ["board_id"];
            referencedRelation: "week_boards";
            referencedColumns: ["id"];
          },
        ];
      };
      idea_stars: {
        Row: {
          id: string;
          idea_id: string;
          admin_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          admin_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          admin_user_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "idea_stars_idea_id_fkey";
            columns: ["idea_id"];
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
        ];
      };
      builders: {
        Row: {
          id: string;
          display_name: string;
          normalized_name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          display_name: string;
          normalized_name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          normalized_name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      idea_assignments: {
        Row: {
          id: string;
          idea_id: string;
          builder_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          builder_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          builder_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "idea_assignments_idea_id_fkey";
            columns: ["idea_id"];
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "idea_assignments_builder_id_fkey";
            columns: ["builder_id"];
            referencedRelation: "builders";
            referencedColumns: ["id"];
          },
        ];
      };
      idea_completions: {
        Row: {
          id: string;
          idea_id: string;
          deployment_url: string | null;
          github_url: string | null;
          twitter_url: string | null;
          notes: string | null;
          completed_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          deployment_url?: string | null;
          github_url?: string | null;
          twitter_url?: string | null;
          notes?: string | null;
          completed_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          deployment_url?: string | null;
          github_url?: string | null;
          twitter_url?: string | null;
          notes?: string | null;
          completed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "idea_completions_idea_id_fkey";
            columns: ["idea_id"];
            referencedRelation: "ideas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_admin: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type WeekBoard = Database["public"]["Tables"]["week_boards"]["Row"];
export type Idea = Database["public"]["Tables"]["ideas"]["Row"];
export type Builder = Database["public"]["Tables"]["builders"]["Row"];
export type IdeaCompletion = Database["public"]["Tables"]["idea_completions"]["Row"];
export type AdminUser = Database["public"]["Tables"]["admin_users"]["Row"];
