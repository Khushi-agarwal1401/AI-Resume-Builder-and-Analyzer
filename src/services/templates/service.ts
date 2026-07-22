import { createServerSupabaseClient } from "@/lib/supabase/server";

type TemplateCategory = "ats-professional" | "modern" | "minimal" | "executive" | "student" | "creative";

interface CreateTemplateInput {
  name: string;
  category: TemplateCategory;
  description?: string;
  thumbnail_url?: string;
  component_key: string;
  is_active?: boolean;
  sort_order?: number;
}

interface UpdateTemplateInput {
  name?: string;
  category?: TemplateCategory;
  description?: string;
  thumbnail_url?: string;
  component_key?: string;
  is_active?: boolean;
  sort_order?: number;
}

export async function getActiveTemplates() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAllTemplates() {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("templates")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createTemplate(input: CreateTemplateInput) {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("templates")
    .insert({
      name: input.name,
      category: input.category,
      description: input.description || "",
      thumbnail_url: input.thumbnail_url || "",
      component_key: input.component_key,
      is_active: input.is_active ?? true,
      sort_order: input.sort_order ?? 0,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTemplate(id: string, input: UpdateTemplateInput) {
  const supabase = await createServerSupabaseClient();

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fields: (keyof UpdateTemplateInput)[] = [
    "name", "category", "description", "thumbnail_url",
    "component_key", "is_active", "sort_order",
  ];
  for (const field of fields) {
    if (input[field] !== undefined) updates[field] = input[field];
  }

  const { error } = await supabase
    .from("templates")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteTemplate(id: string) {
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("templates")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
