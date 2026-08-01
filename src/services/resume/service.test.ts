import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFrom = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  createServerSupabaseClient: vi.fn(() => ({
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
    update: vi.fn(() => self),
    delete: vi.fn(() => self),
    maybeSingle: vi.fn(() => self),
    then: (resolve: (val: T) => void) => resolve(resolveValue),
  };
  return self;
}

// Import functions after mocks are set up
const { getResumes, getResume, createResume, deleteResume, updateResume, updateSections } = await import("./service");

describe("Resume Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      expect(chain.select).toHaveBeenCalledWith("id, title, template, created_at, updated_at");
      expect(chain.eq).toHaveBeenCalledWith("user_id", "user-123");
      expect(result).toEqual(mockResponse.data);
    });

    it("throws error when Supabase query fails", async () => {
      const mockResponse = { data: null, error: new Error("DB error") };
      mockFrom.mockReturnValue(thenableChain(mockResponse));

      await expect(getResumes("user-123")).rejects.toThrow("DB error");
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
    it("creates a resume with default values", async () => {
      const mockCreated = { id: "new-1", title: "Untitled Resume", template: "modern" };
      const successResponse = { data: mockCreated, error: null };
      mockFrom.mockReturnValue(thenableChain(successResponse));

      const result = await createResume("user-123", {});

      expect(mockFrom).toHaveBeenCalledWith("resumes");
      expect(result).toEqual(mockCreated);
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
    /** Runs updateSections against mocked supabase and returns the delete + insert chains. */
    async function runUpdateSections(sectionType: string, data: unknown) {
      // Call 1: ownership check on resumes; calls 2-3: delete + insert on the section table.
      const ownershipChain = thenableChain({ data: { id: "res-1" }, error: null });
      const deleteChain = thenableChain({ data: null, error: null });
      const insertChain = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(ownershipChain)
        .mockReturnValueOnce(deleteChain)
        .mockReturnValueOnce(insertChain);

      await updateSections("res-1", "user-1", sectionType, data);

      return { deleteChain, insertChain };
    }

    it("maps camelCase keys to snake_case columns and strips client-generated ids and column-less fields", async () => {
      const { deleteChain, insertChain } = await runUpdateSections("experience", [
        {
          id: "client-id-1",
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
      ]);

      // deletes existing rows first (delete-then-reinsert per section)
      expect(deleteChain.delete).toHaveBeenCalled();
      expect(deleteChain.eq).toHaveBeenCalledWith("resume_id", "res-1");

      expect(insertChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
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
      ]);
      const insertedRow = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
      expect(insertedRow.id).toBeUndefined();
      expect(insertedRow.teamSize).toBeUndefined();
    });

    it("maps education extended fields (branch/semester/classXII/classX) to their columns", async () => {
      const { insertChain } = await runUpdateSections("education", [
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

      const insertedRow = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
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
      const { insertChain } = await runUpdateSections("projects", [
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

      const insertedRow = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
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

    it("retries insert without extended columns when the live DB lacks them (PGRST204)", async () => {
      const ownershipChain = thenableChain({ data: { id: "res-1" }, error: null });
      const deleteChain = thenableChain({ data: null, error: null });
      const insertFail = thenableChain({
        data: null,
        error: {
          code: "PGRST204",
          message: "Could not find the 'branch' column of 'education' in the schema cache.",
        },
      });
      const insertRetry = thenableChain({ data: null, error: null });
      mockFrom
        .mockReturnValueOnce(ownershipChain)
        .mockReturnValueOnce(deleteChain)
        .mockReturnValueOnce(insertFail)
        .mockReturnValueOnce(insertRetry);

      await updateSections("res-1", "user-1", "education", [
        { institution: "MIT", branch: "CSE", classXII: "96%" },
      ]);

      const firstAttempt = (insertFail.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(firstAttempt[0]).toEqual({
        institution: "MIT",
        branch: "CSE",
        classXII: "96%",
        resume_id: "res-1",
        sort_order: 0,
      });
      // Only the column named in the error is stripped — classXII (which the
      // live DB still has) is preserved.
      const retryAttempt = (insertRetry.insert as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(retryAttempt[0]).toEqual({
        institution: "MIT",
        classXII: "96%",
        resume_id: "res-1",
        sort_order: 0,
      });
    });

    it("passes through already-snake_case keys (LinkedIn import payload) and still strips unknowns", async () => {
      const { insertChain } = await runUpdateSections("education", [
        {
          institution: "MIT",
          degree: "B.Tech",
          field: "CSE",
          end_date: "2023", // LinkedIn import sends snake_case directly
          id: "client-id",
          teamSize: "5",
        },
      ]);

      const insertedRow = (insertChain.insert as ReturnType<typeof vi.fn>).mock.calls[0][0][0];
      expect(insertedRow).toEqual({
        institution: "MIT",
        degree: "B.Tech",
        field: "CSE",
        end_date: "2023",
        resume_id: "res-1",
        sort_order: 0,
      });
    });

    it("persists skills as a single row on the skills table", async () => {
      const { insertChain } = await runUpdateSections("skills", {
        technical: ["JavaScript", "Python"],
        soft: ["Communication"],
        tools: ["Git"],
        frameworks: ["React"],
      });

      expect(insertChain.insert).toHaveBeenCalledWith([
        expect.objectContaining({
          technical: ["JavaScript", "Python"],
          soft: ["Communication"],
          tools: ["Git"],
          frameworks: ["React"],
          resume_id: "res-1",
        }),
      ]);
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
