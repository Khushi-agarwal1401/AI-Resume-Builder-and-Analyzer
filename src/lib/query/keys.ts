/** Centralized query key factory — keep keys in sync by always deriving here. */
export const queryKeys = {
  resumes: ["resumes"] as const,
  resume: (id: string) => ["resumes", id] as const,
  notifications: ["notifications"] as const,
} as const;
