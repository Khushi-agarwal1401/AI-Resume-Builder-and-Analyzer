import type { ResumeData } from "@/types/resume";

/**
 * Shared, realistic sample resume used by every template preview across the
 * app (landing gallery, catalog page, template pickers). Kept deliberately
 * rich — multiple experience entries, education, projects with impact,
 * leadership, open source, certifications — so each template's unique
 * structure has real content to show off.
 */
export const SAMPLE_RESUME: ResumeData = {
  id: "preview",
  userId: "preview",
  title: "Sample Resume",
  template: "modern",
  targetLevel: "experienced",
  sectionOrder: [],
  personalInfo: {
    fullName: "Radheshyam Bhati",
    email: "radheshyam@email.com",
    phone: "+91 98765 43210",
    linkedin: "linkedin.com/in/radheshyam",
    github: "github.com/radheshyam",
    portfolio: "radheshyam.dev",
    photo: "",
  },
  summary:
    "Results-driven Software Engineer with 7+ years building scalable web applications and AI-powered products. Led engineering teams to ship features used by 1M+ users; passionate about clean architecture, developer productivity, and measurable business impact.",
  education: [
    {
      id: "edu1",
      institution: "Stanford University",
      degree: "M.S.",
      field: "Computer Science",
      startDate: "2018",
      endDate: "2020",
      cgpa: "3.9",
    },
    {
      id: "edu2",
      institution: "IIT Bombay",
      degree: "B.Tech",
      field: "Computer Engineering",
      startDate: "2013",
      endDate: "2017",
      cgpa: "8.7",
    },
  ],
  experience: [
    {
      id: "exp1",
      company: "TechNova Solutions",
      role: "Senior Software Engineer",
      location: "San Francisco, CA",
      startDate: "2022",
      endDate: "2026",
      current: true,
      responsibilities: [
        "Architected a microservices platform serving 1.2M daily active users across 3 continents",
        "Reduced API p95 latency by 42% through query optimization and edge caching",
        "Led a cross-functional team of 8 engineers delivering 4 major releases in 18 months",
        "Introduced CI/CD automation cutting deployment time from 40 minutes to 6 minutes",
      ],
      achievements: ["Promoted from Software Engineer II to Senior in 14 months"],
    },
    {
      id: "exp2",
      company: "CloudPeak Analytics",
      role: "Software Engineer",
      location: "Bengaluru, India",
      startDate: "2020",
      endDate: "2022",
      current: false,
      responsibilities: [
        "Built a real-time data pipeline processing 50M+ events per day",
        "Improved dashboard load times by 65% with React performance tuning",
        "Mentored 4 junior engineers and ran the team's interview loop",
      ],
      achievements: [],
    },
    {
      id: "exp3",
      company: "Nimbus Labs",
      role: "Software Engineering Intern",
      location: "Remote",
      startDate: "2019",
      endDate: "2020",
      current: false,
      responsibilities: [
        "Shipped 3 production features for a fintech dashboard used by 200+ clients",
        "Wrote integration tests raising coverage from 61% to 84%",
      ],
      achievements: [],
    },
  ],
  projects: [
    {
      id: "proj1",
      name: "AI Resume Analyzer",
      description: "ML-powered resume analysis tool with 94% accuracy on ATS keyword extraction.",
      technologies: ["Python", "TensorFlow", "React", "PostgreSQL"],
      liveUrl: "",
      githubUrl: "github.com/radheshyam/ai-resume-analyzer",
      impact: "4.2K GitHub stars",
    },
    {
      id: "proj2",
      name: "Distributed Task Scheduler",
      description: "Fault-tolerant job queue with retries, backoff, and webhooks — used in production at 3 companies.",
      technologies: ["Go", "Redis", "Docker", "Kubernetes"],
      liveUrl: "",
      githubUrl: "github.com/radheshyam/task-scheduler",
      impact: "12K monthly downloads",
    },
    {
      id: "proj3",
      name: "Open Source Contributions",
      description: "Top-100 contributor to an LLM tooling ecosystem; maintainer of a React state library.",
      technologies: ["TypeScript", "Vite", "Node.js"],
      liveUrl: "",
      githubUrl: "",
    },
  ],
  skills: {
    technical: ["Python", "TypeScript", "Go", "SQL", "GraphQL", "Rust"],
    soft: ["Leadership", "Communication", "Mentoring", "Product Thinking"],
    tools: ["Docker", "Kubernetes", "AWS", "Terraform", "Redis", "PostgreSQL"],
    frameworks: ["React", "Next.js", "Node.js", "FastAPI", "PyTorch"],
  },
  certifications: [
    {
      id: "cert1",
      name: "AWS Solutions Architect — Professional",
      issuer: "Amazon Web Services",
      date: "2024",
      url: "",
    },
    {
      id: "cert2",
      name: "Google Cloud Professional Developer",
      issuer: "Google",
      date: "2023",
      url: "",
    },
  ],
  achievements: [
    {
      id: "ach1",
      title: "Best Engineering Award",
      description: "Outstanding contribution to platform reliability at TechNova",
      date: "2025",
    },
    {
      id: "ach2",
      title: "Speaker, ReactConf 2024",
      description: "Presented 'Rendering at the Edge' to 2,000+ attendees",
      date: "2024",
    },
  ],
  languages: [
    { id: "lang1", name: "English", proficiency: "native" },
    { id: "lang2", name: "Hindi", proficiency: "native" },
    { id: "lang3", name: "German", proficiency: "intermediate" },
  ],
  leadership: [
    {
      id: "lead1",
      title: "Engineering Guild Lead",
      organization: "TechNova Solutions",
      startDate: "2023",
      endDate: "2026",
      description: "Founded the Frontend Guild; established coding standards adopted by 6 squads.",
    },
    {
      id: "lead2",
      title: "Chapter Lead — Women in Tech Mentorship",
      organization: "Community",
      startDate: "2021",
      endDate: "2024",
      description: "Mentored 30+ junior developers through mock interviews and career coaching.",
    },
  ],
  openSource: [
    {
      id: "os1",
      projectName: "react-query-kit",
      role: "Maintainer",
      url: "github.com/radheshyam/react-query-kit",
      description: "Maintain a widely adopted React data-fetching library (2.1K stars).",
    },
  ],
  publications: [
    {
      id: "pub1",
      title: "Edge Rendering at Scale",
      publisher: "Engineering Blog",
      date: "2024",
      url: "",
      description: "Case study on cutting TTFB by 60% with edge functions.",
    },
  ],
  volunteer: [
    {
      id: "vol1",
      organization: "Code for Good",
      role: "Technical Mentor",
      startDate: "2022",
      endDate: "2026",
      description: "Built school-management dashboards for 12 nonprofit partners.",
    },
  ],
  activities: [
    {
      id: "act1",
      title: "Hackathons",
      description: "Winner, 3 national hackathons (2019–2024)",
      date: "2024",
    },
  ],
  codingProfiles: [
    { id: "cp1", platform: "LeetCode", url: "leetcode.com/radheshyam", handle: "radheshyam" },
    { id: "cp2", platform: "GitHub", url: "github.com/radheshyam", handle: "radheshyam" },
  ],
  coursework: ["Distributed Systems", "Machine Learning", "Advanced Algorithms"],
  interests: ["Machine Learning", "System Design", "Open Source", "Technical Writing"],
  createdAt: "2024-01-01",
  updatedAt: "2026-07-01",
};
