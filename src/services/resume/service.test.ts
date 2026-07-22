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
const { getResumes, getResume, createResume, deleteResume, updateResume } = await import("./service");

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
});
