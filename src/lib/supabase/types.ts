// ─────────────────────────────────────────────────────────────
// GENERATED FILE — do not edit by hand.
//
// Source: the LIVE Supabase project's PostgREST OpenAPI spec (service-role
// key) merged with the repo migrations for columns/tables that exist in code
// but are not yet in the deployed DB (MIGRATION_ONLY overlays).
//
// Regenerate with:
//   node scripts/generate-supabase-types.mjs          (reads .env.local)
//   node scripts/generate-supabase-types.mjs --openapi <file>
// Then run `pnpm typecheck`.
// ────────────────────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string;
          resume_id: string;
          title: string;
          description: string | null;
          date: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          resume_id: string;
          title: string;
          description?: string | null;
          date?: string | null;
          sort_order?: number | null;
        };
        Update: {
          resume_id?: string;
          title?: string;
          description?: string | null;
          date?: string | null;
          sort_order?: number | null;
        };
        Relationships: [
          { foreignKeyName: "achievements_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      activities: {
        Row: {
          id: string;
          resume_id: string;
          title: string;
          date: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          title: string;
          date?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resume_id?: string;
          title?: string;
          date?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "activities_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          company: string;
          role: string;
          date_applied: string | null;
          status: "applied" | "interview" | "rejected" | "offer";
          notes: string | null;
          created_at: string;
          updated_at: string;
          outcome_type: "round_reached" | "offer" | "rejected" | null;
          outcome_notes: string | null;
          interview_round: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          company: string;
          role: string;
          date_applied?: string | null;
          status?: "applied" | "interview" | "rejected" | "offer";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          outcome_type?: "round_reached" | "offer" | "rejected" | null;
          outcome_notes?: string | null;
          interview_round?: number | null;
        };
        Update: {
          resume_id?: string | null;
          company?: string;
          role?: string;
          date_applied?: string | null;
          status?: "applied" | "interview" | "rejected" | "offer";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          outcome_type?: "round_reached" | "offer" | "rejected" | null;
          outcome_notes?: string | null;
          interview_round?: number | null;
        };
        Relationships: [
          { foreignKeyName: "applications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "applications_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      ats_analyses: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          resume_title: string | null;
          score: number;
          breakdown: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          resume_title?: string | null;
          score: number;
          breakdown?: Json | null;
          created_at?: string;
        };
        Update: {
          resume_id?: string | null;
          resume_title?: string | null;
          score?: number;
          breakdown?: Json | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "ats_analyses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "ats_analyses_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      certifications: {
        Row: {
          id: string;
          resume_id: string;
          name: string;
          issuer: string | null;
          date: string | null;
          url: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          resume_id: string;
          name: string;
          issuer?: string | null;
          date?: string | null;
          url?: string | null;
          sort_order?: number | null;
        };
        Update: {
          resume_id?: string;
          name?: string;
          issuer?: string | null;
          date?: string | null;
          url?: string | null;
          sort_order?: number | null;
        };
        Relationships: [
          { foreignKeyName: "certifications_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      coding_profiles: {
        Row: {
          id: string;
          resume_id: string;
          platform: string;
          handle: string;
          url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          platform: string;
          handle: string;
          url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resume_id?: string;
          platform?: string;
          handle?: string;
          url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "coding_profiles_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      education: {
        Row: {
          id: string;
          resume_id: string;
          institution: string;
          degree: string;
          field: string | null;
          start_date: string | null;
          end_date: string | null;
          cgpa: string | null;
          sort_order: number | null;
          branch: string | null;
          classXII: string | null;
          classX: string | null;
          semester: string | null;
        };
        Insert: {
          id?: string;
          resume_id: string;
          institution: string;
          degree: string;
          field?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          cgpa?: string | null;
          sort_order?: number | null;
          branch?: string | null;
          classXII?: string | null;
          classX?: string | null;
          semester?: string | null;
        };
        Update: {
          resume_id?: string;
          institution?: string;
          degree?: string;
          field?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          cgpa?: string | null;
          sort_order?: number | null;
          branch?: string | null;
          classXII?: string | null;
          classX?: string | null;
          semester?: string | null;
        };
        Relationships: [
          { foreignKeyName: "education_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      experience: {
        Row: {
          id: string;
          resume_id: string;
          company: string;
          role: string;
          location: string | null;
          start_date: string | null;
          end_date: string | null;
          current: boolean | null;
          responsibilities: Json | null;
          achievements: Json | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          resume_id: string;
          company: string;
          role: string;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          current?: boolean | null;
          responsibilities?: Json | null;
          achievements?: Json | null;
          sort_order?: number | null;
        };
        Update: {
          resume_id?: string;
          company?: string;
          role?: string;
          location?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          current?: boolean | null;
          responsibilities?: Json | null;
          achievements?: Json | null;
          sort_order?: number | null;
        };
        Relationships: [
          { foreignKeyName: "experience_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      job_analyses: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          jd_snippet: string | null;
          match_percentage: number | null;
          result: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          jd_snippet?: string | null;
          match_percentage?: number | null;
          result?: Json | null;
          created_at?: string;
        };
        Update: {
          resume_id?: string | null;
          jd_snippet?: string | null;
          match_percentage?: number | null;
          result?: Json | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "job_analyses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "job_analyses_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      languages: {
        Row: {
          id: string;
          resume_id: string;
          name: string;
          proficiency: string | null;
          sort_order: number | null;
        };
        Insert: {
          id?: string;
          resume_id: string;
          name: string;
          proficiency?: string | null;
          sort_order?: number | null;
        };
        Update: {
          resume_id?: string;
          name?: string;
          proficiency?: string | null;
          sort_order?: number | null;
        };
        Relationships: [
          { foreignKeyName: "languages_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      leadership: {
        Row: {
          id: string;
          resume_id: string;
          title: string;
          organization: string;
          start_date: string | null;
          end_date: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          title: string;
          organization: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resume_id?: string;
          title?: string;
          organization?: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "leadership_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          link: string | null;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title: string;
          message?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          type?: string;
          title?: string;
          message?: string | null;
          link?: string | null;
          read?: boolean;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "notifications_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      open_source: {
        Row: {
          id: string;
          resume_id: string;
          project_name: string;
          role: string;
          description: string | null;
          url: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          project_name: string;
          role: string;
          description?: string | null;
          url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resume_id?: string;
          project_name?: string;
          role?: string;
          description?: string | null;
          url?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "open_source_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      profiles: {
        Row: {
          id: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          user_type: string | null;
          college_name: string | null;
          degree: string | null;
          graduation_year: string | null;
          current_position: string | null;
          experience_years: number | null;
          industry: string | null;
          current_company: string | null;
          desired_role: string | null;
          desired_company: string | null;
          desired_industry: string | null;
          salary_range: string | null;
          work_type: string | null;
          github_connected: boolean | null;
          github_token: string | null;
          linkedin_connected: boolean | null;
          created_at: string;
          updated_at: string;
          role: string | null;
          is_active: boolean | null;
          last_seen_at: string | null;
        };
        Insert: {
          id?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          user_type?: string | null;
          college_name?: string | null;
          degree?: string | null;
          graduation_year?: string | null;
          current_position?: string | null;
          experience_years?: number | null;
          industry?: string | null;
          current_company?: string | null;
          desired_role?: string | null;
          desired_company?: string | null;
          desired_industry?: string | null;
          salary_range?: string | null;
          work_type?: string | null;
          github_connected?: boolean | null;
          github_token?: string | null;
          linkedin_connected?: boolean | null;
          created_at?: string;
          updated_at?: string;
          role?: string | null;
          is_active?: boolean | null;
          last_seen_at?: string | null;
        };
        Update: {
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          user_type?: string | null;
          college_name?: string | null;
          degree?: string | null;
          graduation_year?: string | null;
          current_position?: string | null;
          experience_years?: number | null;
          industry?: string | null;
          current_company?: string | null;
          desired_role?: string | null;
          desired_company?: string | null;
          desired_industry?: string | null;
          salary_range?: string | null;
          work_type?: string | null;
          github_connected?: boolean | null;
          github_token?: string | null;
          linkedin_connected?: boolean | null;
          created_at?: string;
          updated_at?: string;
          role?: string | null;
          is_active?: boolean | null;
          last_seen_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          resume_id: string;
          name: string;
          description: string | null;
          technologies: Json | null;
          live_url: string | null;
          github_url: string | null;
          sort_order: number | null;
          client: string | null;
          teamSize: string | null;
          impact: string | null;
        };
        Insert: {
          id?: string;
          resume_id: string;
          name: string;
          description?: string | null;
          technologies?: Json | null;
          live_url?: string | null;
          github_url?: string | null;
          sort_order?: number | null;
          client?: string | null;
          teamSize?: string | null;
          impact?: string | null;
        };
        Update: {
          resume_id?: string;
          name?: string;
          description?: string | null;
          technologies?: Json | null;
          live_url?: string | null;
          github_url?: string | null;
          sort_order?: number | null;
          client?: string | null;
          teamSize?: string | null;
          impact?: string | null;
        };
        Relationships: [
          { foreignKeyName: "projects_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      prompts: {
        Row: {
          key: string;
          label: string;
          template: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key?: string;
          label?: string;
          template?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          label?: string;
          template?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      publications: {
        Row: {
          id: string;
          resume_id: string;
          title: string;
          publisher: string;
          date: string | null;
          url: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          title: string;
          publisher: string;
          date?: string | null;
          url?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resume_id?: string;
          title?: string;
          publisher?: string;
          date?: string | null;
          url?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "publications_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      resume_updates: {
        Row: {
          id: string;
          user_id: string;
          source: "github";
          repo_name: string;
          repo_description: string | null;
          repo_url: string | null;
          repo_language: string | null;
          detected_at: string;
          status: "pending" | "added" | "ignored";
          created_at: string;
          updated_at: string;
          repo_stars: number | null;
          repo_forks: number | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          source?: "github";
          repo_name: string;
          repo_description?: string | null;
          repo_url?: string | null;
          repo_language?: string | null;
          detected_at?: string;
          status?: "pending" | "added" | "ignored";
          created_at?: string;
          updated_at?: string;
          repo_stars?: number | null;
          repo_forks?: number | null;
        };
        Update: {
          source?: "github";
          repo_name?: string;
          repo_description?: string | null;
          repo_url?: string | null;
          repo_language?: string | null;
          detected_at?: string;
          status?: "pending" | "added" | "ignored";
          created_at?: string;
          updated_at?: string;
          repo_stars?: number | null;
          repo_forks?: number | null;
        };
        Relationships: [
          { foreignKeyName: "resume_updates_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          template: string;
          personal_info: Json | null;
          summary: string | null;
          created_at: string;
          updated_at: string;
          target_level: string;
          coursework: Json;
          interests: Json;
          ats_score: number | null;
          ats_breakdown: Json | null;
          accent_color: string | null;
          font_family: string | null;
          section_order: Json | null;
          custom_sections: Json | null;
          download_count: number | null;
          view_count: number | null;
          share_token: string | null;
          share_enabled: boolean | null;
          share_updated_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          template?: string;
          personal_info?: Json | null;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
          target_level?: string;
          coursework?: Json;
          interests?: Json;
          ats_score?: number | null;
          ats_breakdown?: Json | null;
          accent_color?: string | null;
          font_family?: string | null;
          section_order?: Json | null;
          custom_sections?: Json | null;
          download_count?: number | null;
          view_count?: number | null;
          share_token?: string | null;
          share_enabled?: boolean | null;
          share_updated_at?: string | null;
        };
        Update: {
          title?: string;
          template?: string;
          personal_info?: Json | null;
          summary?: string | null;
          created_at?: string;
          updated_at?: string;
          target_level?: string;
          coursework?: Json;
          interests?: Json;
          ats_score?: number | null;
          ats_breakdown?: Json | null;
          accent_color?: string | null;
          font_family?: string | null;
          section_order?: Json | null;
          custom_sections?: Json | null;
          download_count?: number | null;
          view_count?: number | null;
          share_token?: string | null;
          share_enabled?: boolean | null;
          share_updated_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "resumes_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      settings: {
        Row: {
          id: string;
          user_id: string;
          email_notifications: boolean;
          dark_mode: boolean;
          created_at: string;
          updated_at: string;
          resume_updates: boolean;
          job_alerts: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_notifications?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
          resume_updates?: boolean;
          job_alerts?: boolean;
        };
        Update: {
          email_notifications?: boolean;
          dark_mode?: boolean;
          created_at?: string;
          updated_at?: string;
          resume_updates?: boolean;
          job_alerts?: boolean;
        };
        Relationships: [
          { foreignKeyName: "settings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      skills: {
        Row: {
          id: string;
          resume_id: string;
          technical: Json | null;
          soft: Json | null;
          tools: Json | null;
          frameworks: Json | null;
        };
        Insert: {
          id?: string;
          resume_id: string;
          technical?: Json | null;
          soft?: Json | null;
          tools?: Json | null;
          frameworks?: Json | null;
        };
        Update: {
          resume_id?: string;
          technical?: Json | null;
          soft?: Json | null;
          tools?: Json | null;
          frameworks?: Json | null;
        };
        Relationships: [
          { foreignKeyName: "skills_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          features: Json | null;
          max_resumes: number;
          max_ats_checks: number;
          max_jd_analyses: number;
          max_ai_actions: number;
          has_advanced_templates: boolean | null;
          has_export_pdf: boolean | null;
          has_cover_letter: boolean | null;
          has_priority_support: boolean | null;
          sort_order: number | null;
          active: boolean | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          features?: Json | null;
          max_resumes?: number;
          max_ats_checks?: number;
          max_jd_analyses?: number;
          max_ai_actions?: number;
          has_advanced_templates?: boolean | null;
          has_export_pdf?: boolean | null;
          has_cover_letter?: boolean | null;
          has_priority_support?: boolean | null;
          sort_order?: number | null;
          active?: boolean | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          features?: Json | null;
          max_resumes?: number;
          max_ats_checks?: number;
          max_jd_analyses?: number;
          max_ai_actions?: number;
          has_advanced_templates?: boolean | null;
          has_export_pdf?: boolean | null;
          has_cover_letter?: boolean | null;
          has_priority_support?: boolean | null;
          sort_order?: number | null;
          active?: boolean | null;
          created_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: string;
          current_period_start: string | null;
          current_period_end: string | null;
          cancel_at_period_end: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          plan_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "subscriptions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "subscriptions_plan_id_fkey"; columns: ["plan_id"]; isOneToOne: false; referencedRelation: "subscription_plans"; referencedColumns: ["id"] }
        ];
      };
      templates: {
        Row: {
          id: string;
          name: string;
          category:             | "ats-professional"
            | "modern"
            | "minimal"
            | "executive"
            | "student"
            | "creative"
            | "executive-sidebar"
            | "modern-card";
          description: string | null;
          thumbnail_url: string | null;
          component_key: string;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category:             | "ats-professional"
            | "modern"
            | "minimal"
            | "executive"
            | "student"
            | "creative"
            | "executive-sidebar"
            | "modern-card";
          description?: string | null;
          thumbnail_url?: string | null;
          component_key: string;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          category?:             | "ats-professional"
            | "modern"
            | "minimal"
            | "executive"
            | "student"
            | "creative"
            | "executive-sidebar"
            | "modern-card";
          description?: string | null;
          thumbnail_url?: string | null;
          component_key?: string;
          is_active?: boolean | null;
          sort_order?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      usage_counts: {
        Row: {
          id: string;
          user_id: string;
          metric: string;
          count: number | null;
          reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          metric: string;
          count?: number | null;
          reset_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          metric?: string;
          count?: number | null;
          reset_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "usage_counts_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      volunteer: {
        Row: {
          id: string;
          resume_id: string;
          role: string;
          organization: string;
          start_date: string | null;
          end_date: string | null;
          description: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          role: string;
          organization: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          resume_id?: string;
          role?: string;
          organization?: string;
          start_date?: string | null;
          end_date?: string | null;
          description?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "volunteer_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      background_jobs: {
        Row: {
          id: string;
          user_id: string;
          job_type: "ats-analysis" | "resume-generation" | "job-match";
          status: "queued" | "processing" | "completed" | "failed" | "cancelled";
          payload: Json;
          result: Json | null;
          error: string | null;
          attempts: number;
          created_at: string;
          started_at: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          job_type: "ats-analysis" | "resume-generation" | "job-match";
          status?: "queued" | "processing" | "completed" | "failed" | "cancelled";
          payload?: Json;
          result?: Json | null;
          error?: string | null;
          attempts?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          job_type?: "ats-analysis" | "resume-generation" | "job-match";
          status?: "queued" | "processing" | "completed" | "failed" | "cancelled";
          payload?: Json;
          result?: Json | null;
          error?: string | null;
          attempts?: number;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "background_jobs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      webhook_events: {
        Row: {
          id: string;
          event_id: string;
          processed_at: string;
        };
        Insert: {
          id?: string;
          event_id: string;
        };
        Update: {
          event_id?: string;
        };
        Relationships: [];
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id: string;
          changes: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          action: string;
          target_type: string;
          target_id: string;
          changes: Json;
        };
        Update: {
          action?: string;
          target_type?: string;
          target_id?: string;
          changes?: Json;
        };
        Relationships: [
          { foreignKeyName: "admin_audit_log_admin_id_fkey"; columns: ["admin_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
