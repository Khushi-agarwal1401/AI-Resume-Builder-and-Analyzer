import { createServerClient } from "@/lib/db/server";

type TemplateCategory =
  | "ats-professional"
  | "modern"
  | "minimal"
  | "executive"
  | "student"
  | "creative"
  | "executive-sidebar"
  | "modern-card"
  | "imported";

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
  const db = await createServerClient();
  const { data, error } = await db
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function getAllTemplates() {
  const db = await createServerClient();
  const { data, error } = await db
    .from("templates")
    .select("*")
    .order("sort_order");

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createTemplate(input: CreateTemplateInput) {
  const db = await createServerClient();

  const { data, error } = await db
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
  const db = await createServerClient();

  const updates: {
    updated_at: string;
    name?: string;
    category?: TemplateCategory;
    description?: string;
    thumbnail_url?: string;
    component_key?: string;
    is_active?: boolean;
    sort_order?: number;
  } = { updated_at: new Date().toISOString() };
  const fields: (keyof UpdateTemplateInput)[] = [
    "name", "category", "description", "thumbnail_url",
    "component_key", "is_active", "sort_order",
  ];
  for (const field of fields) {
    if (input[field] !== undefined) (updates as Record<string, unknown>)[field] = input[field];
  }

  const { error } = await db
    .from("templates")
    .update(updates)
    .eq("id", id);

  if (error) throw new Error(error.message);
}

export async function deleteTemplate(id: string) {
  const db = await createServerClient();
  const { error } = await db
    .from("templates")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
