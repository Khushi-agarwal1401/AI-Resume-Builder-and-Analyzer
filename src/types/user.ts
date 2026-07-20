type UserType = "student" | "experienced";

interface CareerGoal {
  desiredRole: string;
  desiredCompany: string;
  desiredIndustry: string;
  salaryRange: string;
  workType: "remote" | "hybrid" | "onsite";
}

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  userType: UserType;
  careerGoal: CareerGoal;
  collegeName?: string;
  degree?: string;
  graduationYear?: string;
  currentRole?: string;
  experienceYears?: number;
  industry?: string;
  currentCompany?: string;
}

export type { UserType, CareerGoal, UserProfile };
