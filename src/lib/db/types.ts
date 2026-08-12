// ─────────────────────────────────────────────────────────────
// Database types — AUTO-GENERATED from db/schema.sql.
//
// Do NOT edit by hand. Regenerate with:
//     pnpm db:gen-types
// Verify sync (CI gate) with:
//     pnpm db:check-types
//
// Type mapping rules:
//   • TEXT/UUID → string, INTEGER/BIGINT → number, BOOLEAN → boolean,
//     JSON/JSONB → Json, timestamps/dates → string, TEXT[] → string[]
//   • CREATE TYPE enums → string literal unions
//   • templates.category, applications.outcome_type, background_jobs
//     .job_type/.status keep literal unions (CHECK IN lists); other
//     CHECK-only TEXT columns stay `string`.
//   • A column is non-null in `Row` when it is NOT NULL or has a DEFAULT
//     (matches the app's existing convention).
//   • DB_TABLE_COLUMNS (runtime const) mirrors every table's columns so
//     services can derive persistable column whitelists without drift.
//   • The parser covers CREATE TABLE IF NOT EXISTS and CREATE TYPE AS ENUM
//     only — any other schema-changing DDL makes `db:check-types` fail loudly
//     (see detectUncoveredDdl).
//
// The `profiles` table carries the self-hosted auth columns
// (password_hash, password_reset_token, password_reset_expires_at).
// ─────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Runtime table → column map, derived from db/schema.sql (see generator header). */
export const DB_TABLE_COLUMNS = {
  achievements: ["id", "resume_id", "title", "description", "date", "sort_order"],
  activities: ["id", "resume_id", "title", "date", "description", "sort_order", "created_at", "updated_at"],
  admin_audit_log: ["id", "admin_id", "action", "target_type", "target_id", "changes", "created_at"],
  applications: ["id", "user_id", "resume_id", "company", "role", "date_applied", "status", "notes", "outcome_type", "outcome_notes", "interview_round", "created_at", "updated_at"],
  ats_analyses: ["id", "user_id", "resume_id", "resume_title", "score", "breakdown", "created_at"],
  background_jobs: ["id", "user_id", "job_type", "status", "payload", "result", "error", "attempts", "created_at", "started_at", "completed_at"],
  certifications: ["id", "resume_id", "name", "issuer", "date", "url", "sort_order"],
  coding_profiles: ["id", "resume_id", "platform", "handle", "url", "sort_order", "created_at", "updated_at"],
  education: ["id", "resume_id", "institution", "degree", "field", "start_date", "end_date", "cgpa", "branch", "classXII", "classX", "semester", "sort_order"],
  experience: ["id", "resume_id", "company", "role", "location", "start_date", "end_date", "current", "responsibilities", "achievements", "sort_order"],
  exports: ["id", "user_id", "resume_id", "format", "template", "file_size", "url", "created_at"],
  job_analyses: ["id", "user_id", "resume_id", "jd_snippet", "match_percentage", "result", "created_at"],
  languages: ["id", "resume_id", "name", "proficiency", "sort_order"],
  leadership: ["id", "resume_id", "title", "organization", "start_date", "end_date", "description", "sort_order", "created_at", "updated_at"],
  notifications: ["id", "user_id", "type", "title", "message", "link", "read", "created_at"],
  open_source: ["id", "resume_id", "project_name", "role", "description", "url", "sort_order", "created_at", "updated_at"],
  profiles: ["id", "email", "full_name", "avatar_url", "user_type", "college_name", "degree", "graduation_year", "current_position", "experience_years", "industry", "current_company", "desired_role", "desired_company", "desired_industry", "salary_range", "work_type", "github_connected", "github_token", "linkedin_connected", "skills", "created_at", "updated_at", "role", "is_active", "last_seen_at", "password_hash", "password_reset_token", "password_reset_expires_at"],
  projects: ["id", "resume_id", "name", "description", "technologies", "live_url", "github_url", "client", "team_size", "impact", "sort_order"],
  prompts: ["key", "label", "template", "created_at", "updated_at"],
  publications: ["id", "resume_id", "title", "publisher", "date", "url", "description", "sort_order", "created_at", "updated_at"],
  references: ["id", "user_id", "name", "title", "company", "email", "phone", "relationship", "notes", "created_at", "updated_at"],
  resume_updates: ["id", "user_id", "source", "repo_name", "repo_description", "repo_url", "repo_language", "repo_stars", "repo_forks", "detected_at", "status", "created_at", "updated_at"],
  resume_versions: ["id", "resume_id", "user_id", "label", "snapshot", "created_at"],
  resumes: ["id", "user_id", "title", "template", "personal_info", "summary", "target_level", "coursework", "interests", "created_at", "updated_at", "ats_score", "ats_breakdown", "accent_color", "font_family", "share_token", "share_enabled", "share_updated_at", "view_count", "section_order", "download_count", "custom_sections", "is_pinned"],
  settings: ["id", "user_id", "email_notifications", "dark_mode", "resume_updates", "job_alerts", "created_at", "updated_at"],
  skills: ["id", "resume_id", "technical", "soft", "tools", "frameworks"],
  subscription_plans: ["id", "name", "description", "price_monthly", "price_yearly", "stripe_price_id_monthly", "stripe_price_id_yearly", "features", "max_resumes", "max_ats_checks", "max_jd_analyses", "max_ai_actions", "has_advanced_templates", "has_export_pdf", "has_cover_letter", "has_priority_support", "sort_order", "active", "created_at"],
  subscriptions: ["id", "user_id", "plan_id", "stripe_customer_id", "stripe_subscription_id", "status", "current_period_start", "current_period_end", "cancel_at_period_end", "created_at", "updated_at"],
  templates: ["id", "name", "category", "description", "thumbnail_url", "component_key", "is_active", "sort_order", "target_roles", "experience_levels", "ats_friendly", "layout", "source_url", "source_license", "source_author", "created_at", "updated_at"],
  usage_counts: ["id", "user_id", "metric", "count", "reset_at", "created_at", "updated_at"],
  volunteer: ["id", "resume_id", "role", "organization", "start_date", "end_date", "description", "sort_order", "created_at", "updated_at"],
  webhook_events: ["id", "event_id", "processed_at"],
} as const;

export interface Database {
  public: {
    Tables: {
      achievements: {
        Row: {
          id: string;
          resume_id: string;
          title: string;
          description: string;
          date: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          resume_id: string;
          title: string;
          description?: string;
          date?: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          resume_id?: string;
          title?: string;
          description?: string;
          date?: string;
          sort_order?: number;
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
          date: string;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          title: string;
          date?: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          title?: string;
          date?: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "activities_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
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
          target_type?: string;
          target_id?: string;
          changes?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          action?: string;
          target_type?: string;
          target_id?: string;
          changes?: Json;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "admin_audit_log_admin_id_fkey"; columns: ["admin_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      applications: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          company: string;
          role: string;
          date_applied: string;
          status: "applied" | "interview" | "rejected" | "offer";
          notes: string;
          outcome_type: "round_reached" | "offer" | "rejected" | null;
          outcome_notes: string;
          interview_round: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          company: string;
          role: string;
          date_applied?: string;
          status?: "applied" | "interview" | "rejected" | "offer";
          notes?: string;
          outcome_type?: "round_reached" | "offer" | "rejected" | null;
          outcome_notes?: string;
          interview_round?: number | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          company?: string;
          role?: string;
          date_applied?: string;
          status?: "applied" | "interview" | "rejected" | "offer";
          notes?: string;
          outcome_type?: "round_reached" | "offer" | "rejected" | null;
          outcome_notes?: string;
          interview_round?: number | null;
          created_at?: string;
          updated_at?: string;
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
          resume_title: string;
          score: number;
          breakdown: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          resume_title?: string;
          score: number;
          breakdown?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          resume_title?: string;
          score?: number;
          breakdown?: Json;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "ats_analyses_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "ats_analyses_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
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
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          job_type?: "ats-analysis" | "resume-generation" | "job-match";
          status?: "queued" | "processing" | "completed" | "failed" | "cancelled";
          payload?: Json;
          result?: Json | null;
          error?: string | null;
          attempts?: number;
          created_at?: string;
          started_at?: string | null;
          completed_at?: string | null;
        };
        Relationships: [
          { foreignKeyName: "background_jobs_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      certifications: {
        Row: {
          id: string;
          resume_id: string;
          name: string;
          issuer: string;
          date: string;
          url: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          resume_id: string;
          name: string;
          issuer?: string;
          date?: string;
          url?: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          resume_id?: string;
          name?: string;
          issuer?: string;
          date?: string;
          url?: string;
          sort_order?: number;
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
          url: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          platform: string;
          handle: string;
          url?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          platform?: string;
          handle?: string;
          url?: string;
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
          field: string;
          start_date: string;
          end_date: string;
          cgpa: string;
          branch: string;
          classXII: string;
          classX: string;
          semester: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          resume_id: string;
          institution: string;
          degree: string;
          field?: string;
          start_date?: string;
          end_date?: string;
          cgpa?: string;
          branch?: string;
          classXII?: string;
          classX?: string;
          semester?: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          resume_id?: string;
          institution?: string;
          degree?: string;
          field?: string;
          start_date?: string;
          end_date?: string;
          cgpa?: string;
          branch?: string;
          classXII?: string;
          classX?: string;
          semester?: string;
          sort_order?: number;
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
          location: string;
          start_date: string;
          end_date: string;
          current: boolean;
          responsibilities: Json;
          achievements: Json;
          sort_order: number;
        };
        Insert: {
          id?: string;
          resume_id: string;
          company: string;
          role: string;
          location?: string;
          start_date?: string;
          end_date?: string;
          current?: boolean;
          responsibilities?: Json;
          achievements?: Json;
          sort_order?: number;
        };
        Update: {
          id?: string;
          resume_id?: string;
          company?: string;
          role?: string;
          location?: string;
          start_date?: string;
          end_date?: string;
          current?: boolean;
          responsibilities?: Json;
          achievements?: Json;
          sort_order?: number;
        };
        Relationships: [
          { foreignKeyName: "experience_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      exports: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string;
          format: string;
          template: string;
          file_size: number | null;
          url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id: string;
          format: string;
          template: string;
          file_size?: number | null;
          url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string;
          format?: string;
          template?: string;
          file_size?: number | null;
          url?: string | null;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "exports_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "exports_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      job_analyses: {
        Row: {
          id: string;
          user_id: string;
          resume_id: string | null;
          jd_snippet: string;
          match_percentage: number;
          result: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resume_id?: string | null;
          jd_snippet?: string;
          match_percentage?: number;
          result?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resume_id?: string | null;
          jd_snippet?: string;
          match_percentage?: number;
          result?: Json;
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
          sort_order: number;
        };
        Insert: {
          id?: string;
          resume_id: string;
          name: string;
          proficiency?: string | null;
          sort_order?: number;
        };
        Update: {
          id?: string;
          resume_id?: string;
          name?: string;
          proficiency?: string | null;
          sort_order?: number;
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
          start_date: string;
          end_date: string;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          title: string;
          organization: string;
          start_date?: string;
          end_date?: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          title?: string;
          organization?: string;
          start_date?: string;
          end_date?: string;
          description?: string;
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
          message: string;
          link: string;
          read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type?: string;
          title: string;
          message?: string;
          link?: string;
          read?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          link?: string;
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
          description: string;
          url: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          project_name: string;
          role: string;
          description?: string;
          url?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          project_name?: string;
          role?: string;
          description?: string;
          url?: string;
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
          github_connected: boolean;
          github_token: string | null;
          linkedin_connected: boolean;
          skills: Json;
          created_at: string;
          updated_at: string;
          role: string;
          is_active: boolean;
          last_seen_at: string | null;
          password_hash: string | null;
          password_reset_token: string | null;
          password_reset_expires_at: string | null;
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
          github_connected?: boolean;
          github_token?: string | null;
          linkedin_connected?: boolean;
          skills?: Json;
          created_at?: string;
          updated_at?: string;
          role?: string;
          is_active?: boolean;
          last_seen_at?: string | null;
          password_hash?: string | null;
          password_reset_token?: string | null;
          password_reset_expires_at?: string | null;
        };
        Update: {
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
          github_connected?: boolean;
          github_token?: string | null;
          linkedin_connected?: boolean;
          skills?: Json;
          created_at?: string;
          updated_at?: string;
          role?: string;
          is_active?: boolean;
          last_seen_at?: string | null;
          password_hash?: string | null;
          password_reset_token?: string | null;
          password_reset_expires_at?: string | null;
        };
        Relationships: [];
      };
      projects: {
        Row: {
          id: string;
          resume_id: string;
          name: string;
          description: string;
          technologies: Json;
          live_url: string;
          github_url: string;
          client: string;
          team_size: string;
          impact: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          resume_id: string;
          name: string;
          description?: string;
          technologies?: Json;
          live_url?: string;
          github_url?: string;
          client?: string;
          team_size?: string;
          impact?: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          resume_id?: string;
          name?: string;
          description?: string;
          technologies?: Json;
          live_url?: string;
          github_url?: string;
          client?: string;
          team_size?: string;
          impact?: string;
          sort_order?: number;
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
          key: string;
          label?: string;
          template?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
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
          date: string;
          url: string;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          title: string;
          publisher: string;
          date?: string;
          url?: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          title?: string;
          publisher?: string;
          date?: string;
          url?: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "publications_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      references: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          title: string;
          company: string;
          email: string;
          phone: string | null;
          relationship: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          title: string;
          company: string;
          email: string;
          phone?: string | null;
          relationship?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          title?: string;
          company?: string;
          email?: string;
          phone?: string | null;
          relationship?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "references_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      resume_updates: {
        Row: {
          id: string;
          user_id: string;
          source: "github";
          repo_name: string;
          repo_description: string;
          repo_url: string;
          repo_language: string;
          repo_stars: number;
          repo_forks: number;
          detected_at: string;
          status: "pending" | "added" | "ignored";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source?: "github";
          repo_name: string;
          repo_description?: string;
          repo_url?: string;
          repo_language?: string;
          repo_stars?: number;
          repo_forks?: number;
          detected_at?: string;
          status?: "pending" | "added" | "ignored";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source?: "github";
          repo_name?: string;
          repo_description?: string;
          repo_url?: string;
          repo_language?: string;
          repo_stars?: number;
          repo_forks?: number;
          detected_at?: string;
          status?: "pending" | "added" | "ignored";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "resume_updates_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      resume_versions: {
        Row: {
          id: string;
          resume_id: string;
          user_id: string;
          label: string;
          snapshot: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          user_id: string;
          label?: string;
          snapshot: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          user_id?: string;
          label?: string;
          snapshot?: Json;
          created_at?: string;
        };
        Relationships: [
          { foreignKeyName: "resume_versions_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] },
          { foreignKeyName: "resume_versions_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          template: string;
          personal_info: Json;
          summary: string;
          target_level: string;
          coursework: Json;
          interests: Json;
          created_at: string;
          updated_at: string;
          ats_score: number | null;
          ats_breakdown: Json;
          accent_color: string | null;
          font_family: string;
          share_token: string | null;
          share_enabled: boolean;
          share_updated_at: string | null;
          view_count: number;
          section_order: Json;
          download_count: number;
          custom_sections: Json;
          is_pinned: boolean;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          template?: string;
          personal_info?: Json;
          summary?: string;
          target_level?: string;
          coursework?: Json;
          interests?: Json;
          created_at?: string;
          updated_at?: string;
          ats_score?: number | null;
          ats_breakdown?: Json;
          accent_color?: string | null;
          font_family?: string;
          share_token?: string | null;
          share_enabled?: boolean;
          share_updated_at?: string | null;
          view_count?: number;
          section_order?: Json;
          download_count?: number;
          custom_sections?: Json;
          is_pinned?: boolean;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          template?: string;
          personal_info?: Json;
          summary?: string;
          target_level?: string;
          coursework?: Json;
          interests?: Json;
          created_at?: string;
          updated_at?: string;
          ats_score?: number | null;
          ats_breakdown?: Json;
          accent_color?: string | null;
          font_family?: string;
          share_token?: string | null;
          share_enabled?: boolean;
          share_updated_at?: string | null;
          view_count?: number;
          section_order?: Json;
          download_count?: number;
          custom_sections?: Json;
          is_pinned?: boolean;
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
          resume_updates: boolean;
          job_alerts: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_notifications?: boolean;
          dark_mode?: boolean;
          resume_updates?: boolean;
          job_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_notifications?: boolean;
          dark_mode?: boolean;
          resume_updates?: boolean;
          job_alerts?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "settings_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] }
        ];
      };
      skills: {
        Row: {
          id: string;
          resume_id: string;
          technical: Json;
          soft: Json;
          tools: Json;
          frameworks: Json;
        };
        Insert: {
          id?: string;
          resume_id: string;
          technical?: Json;
          soft?: Json;
          tools?: Json;
          frameworks?: Json;
        };
        Update: {
          id?: string;
          resume_id?: string;
          technical?: Json;
          soft?: Json;
          tools?: Json;
          frameworks?: Json;
        };
        Relationships: [
          { foreignKeyName: "skills_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
        ];
      };
      subscription_plans: {
        Row: {
          id: string;
          name: string;
          description: string;
          price_monthly: number;
          price_yearly: number;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          features: Json;
          max_resumes: number;
          max_ats_checks: number;
          max_jd_analyses: number;
          max_ai_actions: number;
          has_advanced_templates: boolean;
          has_export_pdf: boolean;
          has_cover_letter: boolean;
          has_priority_support: boolean;
          sort_order: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          description?: string;
          price_monthly?: number;
          price_yearly?: number;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          features?: Json;
          max_resumes?: number;
          max_ats_checks?: number;
          max_jd_analyses?: number;
          max_ai_actions?: number;
          has_advanced_templates?: boolean;
          has_export_pdf?: boolean;
          has_cover_letter?: boolean;
          has_priority_support?: boolean;
          sort_order?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price_monthly?: number;
          price_yearly?: number;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          features?: Json;
          max_resumes?: number;
          max_ats_checks?: number;
          max_jd_analyses?: number;
          max_ai_actions?: number;
          has_advanced_templates?: boolean;
          has_export_pdf?: boolean;
          has_cover_letter?: boolean;
          has_priority_support?: boolean;
          sort_order?: number;
          active?: boolean;
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
          cancel_at_period_end: boolean;
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
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: string;
          current_period_start?: string | null;
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
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
          category: "ats-professional" | "modern" | "minimal" | "executive" | "student" | "creative" | "executive-sidebar" | "modern-card" | "graduate-cv" | "classic-academic" | "deedy" | "imported" | "ats-friendly" | "professional" | "technical" | "academic" | "designer" | "premium";
          description: string;
          thumbnail_url: string;
          component_key: string;
          is_active: boolean;
          sort_order: number;
          target_roles: string[];
          experience_levels: string[];
          ats_friendly: boolean;
          layout: string | null;
          source_url: string | null;
          source_license: string | null;
          source_author: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category: "ats-professional" | "modern" | "minimal" | "executive" | "student" | "creative" | "executive-sidebar" | "modern-card" | "graduate-cv" | "classic-academic" | "deedy" | "imported" | "ats-friendly" | "professional" | "technical" | "academic" | "designer" | "premium";
          description?: string;
          thumbnail_url?: string;
          component_key: string;
          is_active?: boolean;
          sort_order?: number;
          target_roles?: string[];
          experience_levels?: string[];
          ats_friendly?: boolean;
          layout?: string | null;
          source_url?: string | null;
          source_license?: string | null;
          source_author?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: "ats-professional" | "modern" | "minimal" | "executive" | "student" | "creative" | "executive-sidebar" | "modern-card" | "graduate-cv" | "classic-academic" | "deedy" | "imported" | "ats-friendly" | "professional" | "technical" | "academic" | "designer" | "premium";
          description?: string;
          thumbnail_url?: string;
          component_key?: string;
          is_active?: boolean;
          sort_order?: number;
          target_roles?: string[];
          experience_levels?: string[];
          ats_friendly?: boolean;
          layout?: string | null;
          source_url?: string | null;
          source_license?: string | null;
          source_author?: string | null;
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
          count: number;
          reset_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          metric: string;
          count?: number;
          reset_at: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          metric?: string;
          count?: number;
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
          start_date: string;
          end_date: string;
          description: string;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_id: string;
          role: string;
          organization: string;
          start_date?: string;
          end_date?: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_id?: string;
          role?: string;
          organization?: string;
          start_date?: string;
          end_date?: string;
          description?: string;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          { foreignKeyName: "volunteer_resume_id_fkey"; columns: ["resume_id"]; isOneToOne: false; referencedRelation: "resumes"; referencedColumns: ["id"] }
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
          processed_at?: string;
        };
        Update: {
          id?: string;
          event_id?: string;
          processed_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      application_status: "applied" | "interview" | "rejected" | "offer";
      update_source: "github";
      update_status: "pending" | "added" | "ignored";
    };
    CompositeTypes: Record<string, never>;
  };
}
