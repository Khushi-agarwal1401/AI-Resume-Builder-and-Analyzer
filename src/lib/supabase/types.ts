export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
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
          current_role: string | null;
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
        };
        Insert: {
          id: string;
          email?: string;
          full_name?: string;
          avatar_url?: string;
          user_type?: string;
          college_name?: string;
          degree?: string;
          graduation_year?: string;
          current_role?: string;
          experience_years?: number;
          industry?: string;
          current_company?: string;
          desired_role?: string;
          desired_company?: string;
          desired_industry?: string;
          salary_range?: string;
          work_type?: string;
        };
        Update: {
          email?: string;
          full_name?: string;
          avatar_url?: string;
          user_type?: string;
          college_name?: string;
          degree?: string;
          graduation_year?: string;
          current_role?: string;
          experience_years?: number;
          industry?: string;
          current_company?: string;
          desired_role?: string;
          desired_company?: string;
          desired_industry?: string;
          salary_range?: string;
          work_type?: string;
        };
      };
      resumes: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          template: string;
          personal_info: Json;
          summary: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title?: string;
          template?: string;
          personal_info?: Json;
          summary?: string;
        };
        Update: {
          title?: string;
          template?: string;
          personal_info?: Json;
          summary?: string;
        };
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
          sort_order?: number;
        };
        Update: {
          institution?: string;
          degree?: string;
          field?: string;
          start_date?: string;
          end_date?: string;
          cgpa?: string;
          sort_order?: number;
        };
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
          sort_order?: number;
        };
        Update: {
          name?: string;
          description?: string;
          technologies?: Json;
          live_url?: string;
          github_url?: string;
          sort_order?: number;
        };
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
          technical?: Json;
          soft?: Json;
          tools?: Json;
          frameworks?: Json;
        };
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
          name?: string;
          issuer?: string;
          date?: string;
          url?: string;
          sort_order?: number;
        };
      };
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
          title?: string;
          description?: string;
          date?: string;
          sort_order?: number;
        };
      };
      languages: {
        Row: {
          id: string;
          resume_id: string;
          name: string;
          proficiency: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          resume_id: string;
          name: string;
          proficiency: string;
          sort_order?: number;
        };
        Update: {
          name?: string;
          proficiency?: string;
          sort_order?: number;
        };
      };
    };
  };
}
