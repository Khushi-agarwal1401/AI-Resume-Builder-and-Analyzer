import { describe, it, expect } from "vitest";
import { createServerClient } from "@/lib/db/server";
import { hashPassword, verifyPassword } from "@/lib/password";
import { generateResetToken } from "@/lib/password";

const hasDb = !!process.env.DATABASE_URL;
const maybe = hasDb ? describe : describe.skip;

maybe("query-builder vs live Neon", () => {
  it("reads seeded templates + plans", async () => {
    const db = await createServerClient();
    const { data, error } = await db
      .from("templates")
      .select("*")
      .eq("is_active", true)
      .order("sort_order");
    expect(error).toBeNull();
    expect(data!.length).toBeGreaterThanOrEqual(8);

    const { data: plans } = await db
      .from("subscription_plans")
      .select("id, name")
      .order("sort_order");
    expect(plans!.map((p: { id: string }) => p.id)).toEqual(["free", "pro"]);
  });

  it("counts rows (head exact)", async () => {
    const db = await createServerClient();
    const { count, error } = await db
      .from("templates")
      .select("id", { count: "exact", head: true });
    expect(error).toBeNull();
    expect(count).toBeGreaterThanOrEqual(8);
  });

  it("creates, reads, updates, and deletes a profile", async () => {
    const db = await createServerClient();
    const email = `smoke-${Date.now()}@example.com`;

    const { data: inserted, error: insertErr } = await db
      .from("profiles")
      .insert({
        email,
        full_name: "Smoke Test",
        password_hash: await hashPassword("S3cure!Pass"),
      })
      .select()
      .single();
    expect(insertErr).toBeNull();
    expect(inserted!.id).toBeTruthy();

    const { data: found } = await db
      .from("profiles")
      .select("id, email, password_hash")
      .eq("email", email)
      .maybeSingle();
    expect(found?.id).toBe(inserted!.id);
    expect(await verifyPassword("S3cure!Pass", found!.password_hash)).toBe(true);
    expect(await verifyPassword("wrong", found!.password_hash)).toBe(false);

    const { data: updated } = await db
      .from("profiles")
      .update({ full_name: "Smoke Renamed" })
      .eq("id", inserted!.id)
      .select()
      .single();
    expect(updated!.full_name).toBe("Smoke Renamed");

    const { error: delErr } = await db
      .from("profiles")
      .delete()
      .eq("id", inserted!.id);
    expect(delErr).toBeNull();

    const { data: gone } = await db
      .from("profiles")
      .select("id")
      .eq("id", inserted!.id)
      .maybeSingle();
    expect(gone).toBeNull();
  });

  it("stores and matches a reset token", async () => {
    const db = await createServerClient();
    const email = `smoke-reset-${Date.now()}@example.com`;
    const token = generateResetToken();

    const { data: inserted } = await db
      .from("profiles")
      .insert({
        email,
        full_name: "Reset Smoke",
        password_reset_token: token,
        password_reset_expires_at: new Date(Date.now() + 3600_000).toISOString(),
      })
      .select()
      .single();

    const { data: found } = await db
      .from("profiles")
      .select("id, password_reset_expires_at")
      .eq("password_reset_token", token)
      .maybeSingle();
    expect(found?.id).toBe(inserted!.id);
    expect(new Date(found!.password_reset_expires_at as string).getTime()).toBeGreaterThan(Date.now());

    await db.from("profiles").delete().eq("id", inserted!.id);
  });

  it("joins child tables with nested select + referencedTable order", async () => {
    const db = await createServerClient();
    const email = `smoke-nested-${Date.now()}@example.com`;

    const { data: user } = await db
      .from("profiles")
      .insert({ email, full_name: "Nested Smoke" })
      .select()
      .single();

    const { data: resume } = await db
      .from("resumes")
      .insert({ user_id: user!.id, title: "Smoke Resume", template: "modern" })
      .select()
      .single();

    await db.from("experience").insert([
      { resume_id: resume!.id, role: "Intern", company: "A", sort_order: 2 },
      { resume_id: resume!.id, role: "Senior", company: "B", sort_order: 1 },
    ]);

    const { data: joined, error } = await db
      .from("resumes")
      .select("id, title, experience(role, company)")
      .eq("id", resume!.id)
      .order("sort_order", { referencedTable: "experience" })
      .single();
    expect(error).toBeNull();
    const joinedRow = joined as unknown as { experience: { role: string }[] };
    expect(joinedRow.experience).toHaveLength(2);
    expect(joinedRow.experience[0].role).toBe("Senior");

    await db.from("profiles").delete().eq("id", user!.id);
  });

  it("upserts on conflict", async () => {
    const db = await createServerClient();
    const email = `smoke-upsert-${Date.now()}@example.com`;
    const { data: user } = await db
      .from("profiles")
      .insert({ email, full_name: "Upsert Smoke" })
      .select()
      .single();

    const { data: sub } = await db
      .from("subscriptions")
      .upsert(
        { user_id: user!.id, plan_id: "free", status: "active", stripe_subscription_id: null },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    expect(sub!.user_id).toBe(user!.id);

    const { data: sub2 } = await db
      .from("subscriptions")
      .upsert(
        { user_id: user!.id, plan_id: "pro", status: "active", stripe_subscription_id: null },
        { onConflict: "user_id" }
      )
      .select()
      .single();
    expect(sub2!.plan_id).toBe("pro");

    await db.from("profiles").delete().eq("id", user!.id);
  });

  it("supports jsonb insert + is-null filter + range", async () => {
    const db = await createServerClient();
    const email = `smoke-json-${Date.now()}@example.com`;
    const { data: user } = await db
      .from("profiles")
      .insert({ email, full_name: "Json Smoke" })
      .select()
      .single();

    const { data: r1 } = await db
      .from("resumes")
      .insert({ user_id: user!.id, title: "JSON A", template: "modern", personal_info: { name: "X" } })
      .select()
      .single();
    await db.from("resumes").insert({ user_id: user!.id, title: "JSON B", template: "student", ats_score: 77 });

    const { data: rows } = await db
      .from("resumes")
      .select("id, title, ats_score")
      .eq("user_id", user!.id)
      .is("ats_score", null)
      .order("title")
      .range(0, 5);
    const titles = rows!.map((r: { title: string }) => r.title);
    expect(titles).toContain("JSON A");
    expect(titles).not.toContain("JSON B");

    const { data: withScore } = await db
      .from("resumes")
      .select("id, title")
      .eq("user_id", user!.id)
      .not("ats_score", "is", null);
    expect(withScore!.map((r: { title: string }) => r.title)).toContain("JSON B");

    const { data: stored } = await db
      .from("resumes")
      .select("personal_info")
      .eq("id", r1!.id)
      .single();
    expect(stored!.personal_info).toEqual({ name: "X" });

    await db.from("profiles").delete().eq("id", user!.id);
  });
});
