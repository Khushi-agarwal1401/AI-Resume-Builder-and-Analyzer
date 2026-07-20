interface ValidationError {
  field: string;
  message: string;
}

export function validatePersonalInfo(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.fullName || typeof data.fullName !== "string" || !data.fullName.trim()) {
    errors.push({ field: "fullName", message: "Full name is required" });
  }
  if (!data.email || typeof data.email !== "string" || !data.email.includes("@")) {
    errors.push({ field: "email", message: "Valid email is required" });
  }
  return errors;
}

export function validateEducation(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.institution || typeof data.institution !== "string" || !data.institution.trim()) {
    errors.push({ field: "institution", message: "Institution is required" });
  }
  if (!data.degree || typeof data.degree !== "string" || !data.degree.trim()) {
    errors.push({ field: "degree", message: "Degree is required" });
  }
  return errors;
}

export function validateExperience(data: Record<string, unknown>): ValidationError[] {
  const errors: ValidationError[] = [];
  if (!data.company || typeof data.company !== "string" || !data.company.trim()) {
    errors.push({ field: "company", message: "Company is required" });
  }
  if (!data.role || typeof data.role !== "string" || !data.role.trim()) {
    errors.push({ field: "role", message: "Role is required" });
  }
  return errors;
}
