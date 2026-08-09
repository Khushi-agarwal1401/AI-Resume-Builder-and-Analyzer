import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/db/server", () => ({
  createServerClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function thenableChain<T = any>(resolveValue: T) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const self: Record<string, any> = {
    select: vi.fn(() => self),
    eq: vi.fn(() => self),
    order: vi.fn(() => self),
    single: vi.fn(() => self),
    insert: vi.fn(() => self),
    upsert: vi.fn(() => self),
    update: vi.fn(() => self),
    delete: vi.fn(() => self),
    in: vi.fn(() => self),
    maybeSingle: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

// Import functions after mocks are set up
const { getResumes, getResume, createResume, deleteResume, updateResume, duplicateResume, updateSections } = await import("./service");

describe("Resume Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // mockReturnValueOnce values are NOT cleared by clearAllMocks — reset the
    // queue too so an unconsumed value can't cascade into later tests.
    mockFrom.mockReset();
  });

  describe("getResumes", () => {
    it("returns list of resumes for valid user", async () => {
      const mockResponse = {
        data: [
          { id: "1", title: "Resume 1", template: "modern", created_at: "2024-01-01", updated_at: "2024-01-02" },
        ],
        error: null,
      };
      const chain = thenableChain(mockResponse);
      mockFrom.mockReturnValue(chain);

      const result = await getResumes("user-123");

      expect(mockFrom).toHaveBeenCalledWith("resumes");
      expect(chain.select).toHaveBeenCalledWith("id, title, template, ats_score, view_count, download_count, created_at, updated_at, is_pinned");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(result).toEqual(mockResponse.data);
    });

    it("throws error when the DB query fails", async () => {
      const mockResponse = { data: null, error: new Error("DB error") };
      mockFrom.mockReturnValue(thenableChain(mockResponse));

      await expect(getResumes("user-123")).rejects.toThrow("DB error");
    });

    it("walks down the column tiers when the live DB lacks newer columns (PGRST204)", async () => {
      const firstChain = thenableChain({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'is_pinned' column of 'resumes' in the schema cache.",
        },
      });
      const retryData = [
        { id: "1", title: "Resume 1", template: "modern", created_at: "2024-01-01", updated_at: "2024-01-02" },
      ];
      const retryChain = thenableChain({ data: retryData, error: null });
      mockFrom
        .mockReturnValueOnce(firstChain)
        .mockReturnValueOnce(retryChain);

      const result = await getResumes("user-123");

      // First attempt requests the newest column set (counters + pin flag).
      expect(firstChain.select).toHaveBeenCalledWith(
        "id, title, template, ats_score, view_count, download_count, created_at, updated_at, is_pinned"
      );
      // Retry drops the newest column (is_pinned) so the query succeeds on older schemas.
      expect(retryChain.select).toHaveBeenCalledWith(
        "id, title, template, ats_score, view_count, download_count, created_at, updated_at"
      );
      expect(result).toEqual(retryData);
    });
  });

  describe("getResume", () => {
    it("returns resume data for valid id and user", async () => {
      const mockResume = {
        id: "res-1",
        user_id: "user-123",
        title: "My Resume",
        template: "modern",
        personal_info: { fullName: "John Doe", email: "john@test.com" },
        summary: "A summary",
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
      };

      const successResponse = { data: mockResume, error: null };
      const emptyResponse = { data: [], error: null };

      // First call: resume query. Remaining calls: section queries (all return empty arrays)
      mockFrom
        .mockReturnValueOnce(thenableChain(successResponse))
        .mockReturnValue(thenableChain(emptyResponse));

      const result = await getResume("res-1", "user-123");

      expect(result.id).toBe("res-1");
      expect(result.title).toBe("My Resume");
      expect(result.personalInfo.fullName).toBe("John Doe");
    });
  });

  describe("createResume", () => {
    /** Mock for the pre-fill profile fetch — no onboarding data by default. */
    function mockProfile(row: Record<string, unknown> | null = null) {
      return thenableChain({ data: row, error: null });
    }

    it("creates a resume with default values", async () => {
      const mockCreated = { id: "new-1", title: "Untitled Resume", template: "modern" };
      const successResponse = { data: mockCreated, error: null };
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(thenableChain(successResponse));

      const result = await createResume("user-123", {});

      expect(mockFrom).toHaveBeenCalledWith("resumes");
      expect(result).toEqual(mockCreated);
    });

    it("pre-fills personal info, education, experience, and skills from the profile", async () => {
      const profile = {
        full_name: "Jane Doe",
        email: "jane@test.com",
        avatar_url: "https://avatar/jane.png",
        college_name: "MIT",
        degree: "B.Tech",
        graduation_year: "2024",
        current_position: "Software Engineer",
        current_company: "Acme",
        industry: "Technology",
        experience_years: 5,
        skills: ["JavaScript", "React"],
      };
      const created = { id: "new-1", title: "Untitled Resume", template: "modern" };
      const resumeChain = thenableChain({ data: created, error: null });
      const eduChain = thenableChain({ data: null, error: null });
      const expChain = thenableChain({ data: null, error: null });
      const skillChain = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile(profile)) // profiles fetch
        .mockReturnValueOnce(resumeChain)          // resumes insert
        .mockReturnValueOnce(eduChain)             // education insert
        .mockReturnValueOnce(expChain)             // experience insert
        .mockReturnValueOnce(skillChain);          // skills insert

      const result = await createResume("user-123", {});

      // Personal info merged into the resumes insert payload
      const insertPayload = (resumeChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(insertPayload.personal_info.fullName).toBe("Jane Doe");
      expect(insertPayload.personal_info.email).toBe("jane@test.com");
      expect(insertPayload.personal_info.photo).toBe("https://avatar/jane.png");

      // Factual summary built from onboarding facts (current role + industry + years)
      expect(insertPayload.summary).toBe("Experienced Software Engineer in the Technology industry with 5+ years of experience.");

      // Education row mapped to DB columns
      const eduRows = (eduChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(eduRows[0]).toEqual(expect.objectContaining({
        institution: "MIT",
        degree: "B.Tech",
        field: "",
        end_date: "2024",
        resume_id: "new-1",
        sort_order: 0,
      }));

      // Experience row (current role/company)
      const expRows = (expChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(expRows[0]).toEqual(expect.objectContaining({
        company: "Acme",
        role: "Software Engineer",
        current: true,
        resume_id: "new-1",
        sort_order: 0,
      }));

      // Skills row (onboarding skills → technical)
      const skillRows = (skillChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(skillRows[0]).toEqual(expect.objectContaining({
        technical: ["JavaScript", "React"],
        resume_id: "new-1",
      }));

      expect(result).toEqual(created);
    });

    it("lets client-provided personal info win over profile data", async () => {
      const resumeChain = thenableChain({ data: { id: "new-1" }, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile({ full_name: "Jane Doe", email: "jane@test.com" }))
        .mockReturnValueOnce(resumeChain);

      await createResume("user-123", {
        personalInfo: {
          fullName: "Custom Name",
          email: "custom@test.com",
          phone: "555",
          linkedin: "",
          github: "",
          portfolio: "",
          photo: "",
        },
      });

      const insertPayload = (resumeChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(insertPayload.personal_info.fullName).toBe("Custom Name");
      expect(insertPayload.personal_info.email).toBe("custom@test.com");
    });

    it("skips the profile fetch entirely when prefill: false", async () => {
      const mockCreated = { id: "new-1", title: "Untitled Resume", template: "modern" };
      const resumeChain = thenableChain({ data: mockCreated, error: null });
      mockFrom.mockReturnValueOnce(resumeChain);

      const result = await createResume("user-123", { prefill: false });

      // Only the resumes insert fires — no profiles fetch, no section inserts.
      expect(mockFrom).toHaveBeenCalledTimes(1);
      expect(mockFrom).toHaveBeenCalledWith("resumes");
      expect(result).toEqual(mockCreated);
    });

    it("does not pre-fill sections when the profile has no relevant fields", async () => {
      const resumeChain = thenableChain({ data: { id: "new-1" }, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile({ full_name: "Only Name" }))
        .mockReturnValueOnce(resumeChain);

      await createResume("user-123", {});

      // Profile fetch + resume insert only — no education/experience/skills inserts.
      expect(mockFrom).toHaveBeenCalledTimes(2);
      const insertPayload = (resumeChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(insertPayload.personal_info.fullName).toBe("Only Name");
    });

    it("still creates the resume when the profile fetch fails", async () => {
      const mockCreated = { id: "new-1", title: "Untitled Resume", template: "modern" };
      const resumeChain = thenableChain({ data: mockCreated, error: null });
      mockFrom
        .mockReturnValueOnce(thenableChain({ data: null, error: new Error("Profile fetch failed") }))
        .mockReturnValueOnce(resumeChain);

      const result = await createResume("user-123", {});

      expect(result).toEqual(mockCreated);
    });

    it("auto-fills section_order from the template's recommended preset", async () => {
      const resumeChain = thenableChain({ data: { id: "new-1" }, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(resumeChain);

      await createResume("user-123", { template: "executive" });

      const insertPayload = (resumeChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      // Executive preset: summary, experience, achievements first (role-aware structure).
      expect(insertPayload.section_order[0]).toBe("summary");
      expect(insertPayload.section_order.indexOf("experience")).toBeLessThan(
        insertPayload.section_order.indexOf("education")
      );
      expect(insertPayload.section_order.indexOf("achievements")).toBeLessThan(
        insertPayload.section_order.indexOf("languages")
      );
    });

    it("refines the preset order from the target role and level", async () => {
      const resumeChain = thenableChain({ data: { id: "new-1" }, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(resumeChain);

      await createResume("user-123", {
        template: "modern",
        role: "Academic Researcher",
        targetLevel: "student",
      });

      const insertPayload = (resumeChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      // Academic role + student level push education early, before experience.
      expect(insertPayload.section_order.indexOf("education")).toBeLessThan(
        insertPayload.section_order.indexOf("experience")
      );
      expect(insertPayload.section_order.indexOf("publications")).toBeLessThan(
        insertPayload.section_order.indexOf("languages")
      );
    });

    it("drops section_order when the live DB predates migration 00024 (PGRST204)", async () => {
      const firstChain = thenableChain({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'section_order' column of 'resumes' in the schema cache.",
        },
      });
      const retryChain = thenableChain({ data: { id: "new-1" }, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(firstChain)
        .mockReturnValueOnce(retryChain);

      await createResume("user-123", { template: "executive" });

      // First attempt carries the preset order.
      const firstAttempt = (firstChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(firstAttempt.section_order).toBeDefined();
      // Retry strips the missing column so the insert succeeds on old schemas.
      const retryAttempt = (retryChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(retryAttempt.section_order).toBeUndefined();
    });

    it("honors an explicit client-provided sectionOrder (including empty to opt out)", async () => {
      const resumeChain = thenableChain({ data: { id: "new-1" }, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(resumeChain);

      await createResume("user-123", { template: "executive", sectionOrder: [] });

      const insertPayload = (resumeChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(insertPayload.section_order).toEqual([]);
    });

    it("retries without the theme columns when the live DB lacks them (PGRST204)", async () => {
      const firstChain = thenableChain({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'accent_color' column of 'resumes' in the schema cache.",
        },
      });
      const retryChain = thenableChain({ data: { id: "new-1", title: "Untitled Resume", template: "modern" }, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(firstChain)
        .mockReturnValueOnce(retryChain);

      const result = await createResume("user-123", { accentColor: "#0ea5e9", fontFamily: "serif" });

      // First attempt includes the theme columns.
      const firstAttempt = (firstChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(firstAttempt.accent_color).toBe("#0ea5e9");
      expect(firstAttempt.font_family).toBe("serif");

      // Retry drops them but keeps everything else.
      const retryAttempt = (retryChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(retryAttempt.accent_color).toBeUndefined();
      expect(retryAttempt.font_family).toBeUndefined();
      expect(retryAttempt.title).toBe("Untitled Resume");
      expect(retryAttempt.user_id).toBe("user-123");

      expect(result).toEqual({ id: "new-1", title: "Untitled Resume", template: "modern" });
    });

    it("throws immediately on non-missing-column errors (no retry)", async () => {
      const uniqueViolation = { code: "23505", message: "duplicate key value violates unique constraint" };
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(thenableChain({ data: null, error: uniqueViolation }));

      await expect(createResume("user-123", { accentColor: "#0ea5e9" })).rejects.toThrow(
        "duplicate key value violates unique constraint"
      );

      // Profile fetch + one insert attempt — the retry only fires for missing-column errors.
      expect(mockFrom).toHaveBeenCalledTimes(2);
    });

    it("treats a raw 42703 column-does-not-exist error the same way", async () => {
      const firstChain = thenableChain({
        data: null,
        error: { code: "42703", message: "column resumes.accent_color does not exist" },
      });
      const retryChain = thenableChain({ data: { id: "new-2" }, error: null });
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(firstChain)
        .mockReturnValueOnce(retryChain);

      const result = await createResume("user-123", { accentColor: "#0ea5e9" });

      const retryAttempt = (retryChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(retryAttempt.accent_color).toBeUndefined();
      expect(result).toEqual({ id: "new-2" });
    });

    it("throws when the retry without theme columns also fails", async () => {
      mockFrom
        .mockReturnValueOnce(mockProfile())
        .mockReturnValueOnce(thenableChain({
          data: null,
          error: {
            code: "PGRST204",
            message: "Could not find the 'accent_color' column of 'resumes' in the schema cache.",
          },
        }))
        .mockReturnValueOnce(thenableChain({ data: null, error: new Error("Insert failed") }));

      await expect(createResume("user-123", { accentColor: "#0ea5e9" })).rejects.toThrow("Insert failed");
    });
  });

  describe("updateResume", () => {
    it("updates resume fields", async () => {
      const successResponse = { error: null };
      mockFrom.mockReturnValue(thenableChain(successResponse));

      await expect(
        updateResume("res-1", "user-123", { title: "Updated Title", template: "ats-professional" })
      ).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith("resumes");
    });

    it("throws error when update fails", async () => {
      const errorResponse = { error: new Error("Update failed") };
      mockFrom.mockReturnValue(thenableChain(errorResponse));

      await expect(
        updateResume("res-1", "user-123", { title: "Updated" })
      ).rejects.toThrow("Update failed");
    });

    it("persists the is_pinned flag (Epic 3, Task 3.1)", async () => {
      const successResponse = { error: null };
      const chain = thenableChain(successResponse);
      mockFrom.mockReturnValue(chain);

      await expect(
        updateResume("res-1", "user-123", { isPinned: true })
      ).resolves.toBeUndefined();

      expect(mockFrom).toHaveBeenCalledWith("resumes");
      const updatePayload = (chain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(updatePayload.is_pinned).toBe(true);
    });

    it("retries without the theme columns when the live DB lacks them (PGRST204)", async () => {
      const firstChain = thenableChain({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'font_family' column of 'resumes' in the schema cache.",
        },
      });
      const retryChain = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(firstChain)
        .mockReturnValueOnce(retryChain);

      await expect(
        updateResume("res-1", "user-123", { title: "Updated Title", accentColor: "#0ea5e9", fontFamily: "serif" })
      ).resolves.toBeUndefined();

      const firstAttempt = (firstChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(firstAttempt.accent_color).toBe("#0ea5e9");
      expect(firstAttempt.font_family).toBe("serif");

      const retryAttempt = (retryChain.update as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(retryAttempt.accent_color).toBeUndefined();
      expect(retryAttempt.font_family).toBeUndefined();
      expect(retryAttempt.title).toBe("Updated Title");
    });

    it("treats a theme-only update as a no-op success when the live DB lacks the columns", async () => {
      mockFrom.mockReturnValueOnce(thenableChain({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'accent_color' column of 'resumes' in the schema cache.",
        },
      }));

      await expect(updateResume("res-1", "user-123", { accentColor: "#0ea5e9" })).resolves.toBeUndefined();

      // Nothing but theme columns to update → no empty retry request is sent.
      expect(mockFrom).toHaveBeenCalledTimes(1);
    });

    it("throws when the update retry without theme columns also fails", async () => {
      mockFrom
        .mockReturnValueOnce(thenableChain({
          data: null,
          error: {
            code: "PGRST204",
            message: "Could not find the 'accent_color' column of 'resumes' in the schema cache.",
          },
        }))
        .mockReturnValueOnce(thenableChain({ data: null, error: new Error("Update failed") }));

      // A non-theme field keeps the fallback payload non-empty, so the retry fires.
      await expect(
        updateResume("res-1", "user-123", { title: "Updated", accentColor: "#0ea5e9" })
      ).rejects.toThrow("Update failed");
    });
  });

  describe("duplicateResume", () => {
    it("duplicates a resume, retrying without the theme columns when the live DB lacks them", async () => {
      const resumeRow = {
        id: "res-1",
        user_id: "user-123",
        title: "My Resume",
        template: "modern",
        target_level: "fresher",
        personal_info: {},
        summary: "A summary",
        accent_color: null,
        font_family: "sans",
        section_order: ["summary", "experience", "custom-abc"],
        custom_sections: { "custom-abc": { title: "Awards", items: [] } },
        created_at: "2024-01-01",
        updated_at: "2024-01-02",
        // All section tables come back empty from the batched select.
        education: [], experience: [], projects: [], skills: [], certifications: [],
        achievements: [], languages: [], coding_profiles: [], leadership: [],
        open_source: [], publications: [], volunteer: [], activities: [],
        coursework: [], interests: [],
      };
      const failChain = thenableChain({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'accent_color' column of 'resumes' in the schema cache.",
        },
      });
      const retryChain = thenableChain({ data: { id: "dup-1", title: "My Resume (Copy)" }, error: null });
      mockFrom
        .mockReturnValueOnce(thenableChain({ data: resumeRow, error: null })) // getResume
        .mockReturnValueOnce(failChain) // insertResumeRow first attempt
        .mockReturnValueOnce(retryChain) // insertResumeRow retry
        .mockReturnValueOnce(thenableChain({ data: null, error: null })); // skills copy

      const result = await duplicateResume("res-1", "user-123");

      expect(result?.id).toBe("dup-1");
      // First attempt still carries the theme columns from the source resume.
      const firstAttempt = (failChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(firstAttempt.accent_color).toBeNull();
      expect(firstAttempt.font_family).toBe("sans");
      // Retry drops them but keeps everything else.
      const retryAttempt = (retryChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(retryAttempt.accent_color).toBeUndefined();
      expect(retryAttempt.font_family).toBeUndefined();
      expect(retryAttempt.title).toBe("My Resume (Copy)");
      expect(retryAttempt.user_id).toBe("user-123");

      // Custom section order + user-created custom sections must survive a
      // duplicate (K-04) — both first attempt and retry carry them.
      expect(firstAttempt.section_order).toEqual(["summary", "experience", "custom-abc"]);
      expect(firstAttempt.custom_sections).toEqual({
        "custom-abc": { title: "Awards", items: [] },
      });
      expect(retryAttempt.section_order).toEqual(["summary", "experience", "custom-abc"]);
      expect(retryAttempt.custom_sections).toEqual({
        "custom-abc": { title: "Awards", items: [] },
      });
    });
  });

  describe("deleteResume", () => {
    it("deletes resume for authorized user", async () => {
      const successResponse = { error: null };
      const deleteThenable = thenableChain(successResponse);
      const fromResult = { delete: vi.fn(() => deleteThenable) };
      mockFrom.mockReturnValue(fromResult);

      await expect(deleteResume("res-1", "user-123")).resolves.toBeUndefined();
    });

    it("throws error when delete fails", async () => {
      const errorResponse = { error: new Error("Delete failed") };
      const deleteThenable = thenableChain(errorResponse);
      const fromResult = { delete: vi.fn(() => deleteThenable) };
      mockFrom.mockReturnValue(fromResult);

      await expect(deleteResume("res-1", "user-123")).rejects.toThrow("Delete failed");
    });
  });

  describe("updateSections", () => {
    /** Runs updateSections against mocked db and returns the upsert chain. */
    async function runUpdateSections(sectionType: string, data: unknown) {
      // Call 1: ownership check; call 2: select existing ids; call 3: upsert.
      const ownershipChain = thenableChain({ data: { id: "res-1" }, error: null });
      const existingChain = thenableChain({ data: [], error: null });
      const upsertChain = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(ownershipChain)
        .mockReturnValueOnce(existingChain)
        .mockReturnValueOnce(upsertChain);

      await updateSections("res-1", "user-1", sectionType, data);

      return { existingChain, upsertChain };
    }

    it("upserts rows onConflict id with snake_case columns; strips non-UUID ids and column-less fields", async () => {
      const { existingChain, upsertChain } = await runUpdateSections("experience", [
        {
          id: "11111111-1111-4111-8111-111111111111",
          company: "Acme",
          role: "Engineer",
          location: "NYC",
          startDate: "2020-01",
          endDate: "2021-01",
          current: false,
          responsibilities: ["Shipped feature"],
          achievements: ["Boosted perf"],
          teamSize: "8", // no DB column → must be stripped
        },
        { id: "not-a-uuid", company: "Stripe Me", role: "Engineer" }, // non-UUID id → stripped
      ]);

      // Existing ids are read to support diff-delete of removed rows.
      expect(existingChain.select).toHaveBeenCalledWith("id");
      expect(existingChain.eq).toHaveBeenCalledWith("resume_id", "res-1");

      // UPSERT on the id conflict target — no delete-then-reinsert.
      expect(upsertChain.upsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            id: "11111111-1111-4111-8111-111111111111",
            company: "Acme",
            role: "Engineer",
            location: "NYC",
            start_date: "2020-01",
            end_date: "2021-01",
            current: false,
            responsibilities: ["Shipped feature"],
            achievements: ["Boosted perf"],
            resume_id: "res-1",
            sort_order: 0,
          }),
          expect.objectContaining({
            company: "Stripe Me",
            role: "Engineer",
            resume_id: "res-1",
            sort_order: 1,
          }),
        ],
        { onConflict: "id" }
      );
      const firstRow = (upsertChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
      expect(firstRow.id).toBe("11111111-1111-4111-8111-111111111111");
      expect(firstRow.teamSize).toBeUndefined();
      const secondRow = (upsertChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0][1];
      expect(secondRow.id).toBeUndefined();
    });

    it("diff-deletes rows the client removed, keeping the kept rows untouched", async () => {
      const ownershipChain = thenableChain({ data: { id: "res-1" }, error: null });
      const existingChain = thenableChain({
        data: [
          { id: "11111111-1111-4111-8111-111111111111" },
          { id: "22222222-2222-4222-8222-222222222222" },
          { id: "33333333-3333-4333-8333-333333333333" },
        ],
        error: null,
      });
      const upsertChain = thenableChain({ data: null, error: null });
      const deleteChain = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(ownershipChain)
        .mockReturnValueOnce(existingChain)
        .mockReturnValueOnce(upsertChain)
        .mockReturnValueOnce(deleteChain);

      // Client keeps row 1 and 2, removes row 3.
      await updateSections("res-1", "user-1", "experience", [
        { id: "11111111-1111-4111-8111-111111111111", company: "Acme", role: "Engineer" },
        { id: "22222222-2222-4222-8222-222222222222", company: "Beta", role: "Designer" },
      ]);

      expect(upsertChain.upsert).toHaveBeenCalledTimes(1);
      // Only the removed row is deleted — and by id, not a blanket resume wipe.
      expect(deleteChain.delete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith("resume_id", "res-1");
      expect(deleteChain.in).toHaveBeenCalledWith("id", ["33333333-3333-4333-8333-333333333333"]);
    });

    it("does not delete anything when the client sends an empty section but existing rows exist", async () => {
      const ownershipChain = thenableChain({ data: { id: "res-1" }, error: null });
      const existingChain = thenableChain({
        data: [{ id: "11111111-1111-4111-8111-111111111111" }],
        error: null,
      });
      const upsertChain = thenableChain({ data: null, error: null });
      const deleteChain = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(ownershipChain)
        .mockReturnValueOnce(existingChain)
        .mockReturnValueOnce(upsertChain)
        .mockReturnValueOnce(deleteChain);

      await updateSections("res-1", "user-1", "experience", []);

      // Empty payload = every existing row is removed → still diff-deleted.
      expect(deleteChain.in).toHaveBeenCalledWith("id", ["11111111-1111-4111-8111-111111111111"]);
    });

    it("maps education extended fields (branch/semester/classXII/classX) to their columns", async () => {
      const { upsertChain } = await runUpdateSections("education", [
        {
          id: "e-1",
          institution: "MIT",
          degree: "B.Tech",
          field: "CSE",
          startDate: "2019",
          endDate: "2023",
          cgpa: "9.2",
          branch: "CSE",
          semester: "8",
          classXII: "96%",
          classX: "95%",
        },
      ]);

      const insertedRow = (upsertChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
      expect(insertedRow).toEqual({
        institution: "MIT",
        degree: "B.Tech",
        field: "CSE",
        start_date: "2019",
        end_date: "2023",
        cgpa: "9.2",
        branch: "CSE",
        semester: "8",
        classXII: "96%",
        classX: "95%",
        resume_id: "res-1",
        sort_order: 0,
      });
    });

    it("maps projects liveUrl/githubUrl to snake_case and drops teamSize", async () => {
      const { upsertChain } = await runUpdateSections("projects", [
        {
          id: "p-1",
          name: "Resume Builder",
          description: "A tool",
          technologies: ["Next.js"],
          liveUrl: "https://example.com",
          githubUrl: "https://github.com/x",
          client: "Acme",
          teamSize: "4",
          impact: "Increased signups 2x",
        },
      ]);

      const insertedRow = (upsertChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
      expect(insertedRow).toEqual({
        name: "Resume Builder",
        description: "A tool",
        technologies: ["Next.js"],
        live_url: "https://example.com",
        github_url: "https://github.com/x",
        client: "Acme",
        impact: "Increased signups 2x",
        resume_id: "res-1",
        sort_order: 0,
      });
    });

    it("retries upsert without extended columns when the live DB lacks them (PGRST204)", async () => {
      const ownershipChain = thenableChain({ data: { id: "res-1" }, error: null });
      const existingChain = thenableChain({ data: [], error: null });
      const upsertFail = thenableChain({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'branch' column of 'education' in the schema cache.",
        },
      });
      const upsertRetry = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(ownershipChain)
        .mockReturnValueOnce(existingChain)
        .mockReturnValueOnce(upsertFail)
        .mockReturnValueOnce(upsertRetry);

      await updateSections("res-1", "user-1", "education", [
        { institution: "MIT", branch: "CSE", classXII: "96%" },
      ]);

      const firstAttempt = (upsertFail.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(firstAttempt[0]).toEqual({
        institution: "MIT",
        branch: "CSE",
        classXII: "96%",
        resume_id: "res-1",
        sort_order: 0,
      });
      // Only the column named in the error is stripped — classXII (which the
      // live DB still has) is preserved.
      const retryAttempt = (upsertRetry.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(retryAttempt[0]).toEqual({
        institution: "MIT",
        classXII: "96%",
        resume_id: "res-1",
        sort_order: 0,
      });
    });

    it("passes through already-snake_case keys (LinkedIn import payload) and still strips unknowns", async () => {
      const { upsertChain } = await runUpdateSections("education", [
        {
          institution: "MIT",
          degree: "B.Tech",
          field: "CSE",
          end_date: "2023", // LinkedIn import sends snake_case directly
          id: "client-id",
          teamSize: "5",
        },
      ]);

      const insertedRow = (upsertChain.upsert as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
      expect(insertedRow).toEqual({
        institution: "MIT",
        degree: "B.Tech",
        field: "CSE",
        end_date: "2023",
        resume_id: "res-1",
        sort_order: 0,
      });
    });

    it("persists skills as a single row via upsert on resume_id", async () => {
      const ownershipChain = thenableChain({ data: { id: "res-1" }, error: null });
      const upsertChain = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(ownershipChain)
        .mockReturnValueOnce(upsertChain);

      await updateSections("res-1", "user-1", "skills", {
        technical: ["JavaScript", "Python"],
        soft: ["Communication"],
        tools: ["Git"],
        frameworks: ["React"],
      });

      expect(upsertChain.upsert).toHaveBeenCalledWith(
        [
          expect.objectContaining({
            technical: ["JavaScript", "Python"],
            soft: ["Communication"],
            tools: ["Git"],
            frameworks: ["React"],
            resume_id: "res-1",
          }),
        ],
        { onConflict: "resume_id" }
      );
    });

    it("throws when the resume does not belong to the user", async () => {
      const ownershipChain = thenableChain({ data: null, error: null });
      mockFrom.mockReturnValueOnce(ownershipChain);

      await expect(updateSections("res-1", "user-1", "experience", [])).rejects.toThrow(
        "Resume not found"
      );
    });
  });
});
