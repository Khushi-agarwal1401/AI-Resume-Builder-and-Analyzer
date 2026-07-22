import { describe, it, expect } from "vitest";
import { calculateAtsScore } from "./ats-scorer";

describe("calculateAtsScore", () => {
  it("returns all required fields in the result", () => {
    const result = calculateAtsScore("Test resume content");

    expect(result).toHaveProperty("overall");
    expect(result).toHaveProperty("subscores");
    expect(result).toHaveProperty("keywordDetails");
    expect(result).toHaveProperty("readabilityDetails");
    expect(result).toHaveProperty("sectionDetails");
    expect(result).toHaveProperty("suggestions");
    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("grade");
    expect(Array.isArray(result.suggestions)).toBe(true);
  });

  it("defaults to experienced category when no input object provided", () => {
    const result = calculateAtsScore("Test resume content");
    expect(result.category).toBe("experienced");
  });

  it("uses provided category when passed in input object", () => {
    const result = calculateAtsScore({ text: "Test resume content", category: "student" });
    expect(result.category).toBe("student");
  });

  it("scores 0 for empty string", () => {
    const result = calculateAtsScore("");
    expect(result.overall).toBe(0);
    expect(result.grade).toBe("F");
  });

  it("gives high score to a well-structured resume", () => {
    const resume = `John Doe
john@example.com | (555) 123-4567 | linkedin.com/in/john | github.com/johndoe

Summary
Experienced software engineer with 5 years building web applications.

Experience
Software Engineer at Acme Corp (2020 - Present)
• Implemented new features using React and TypeScript, improving performance by 40%
• Led a team of 5 developers to deliver projects on time
• Reduced deployment time by 60% using automated CI/CD pipelines

Education
BS Computer Science, University of Technology (2016 - 2020)

Skills
JavaScript, TypeScript, React, Node.js, Python, SQL, Docker, AWS
`;

    const result = calculateAtsScore(resume);
    expect(result.overall).toBeGreaterThanOrEqual(50);
    expect(result.sectionDetails.present.length).toBeGreaterThanOrEqual(3);
    expect(result.suggestions.length).toBeLessThan(8);
    expect(result.grade).toBeTruthy();
  });

  it("detects missing sections", () => {
    const resume = "John Doe\njohn@example.com\nI built some stuff.";
    const result = calculateAtsScore(resume);
    expect(result.sectionDetails.missing.length).toBeGreaterThanOrEqual(1);
  });

  it("generates suggestions for improvements", () => {
    const resume = "Just a simple resume with no sections or contact info";
    const result = calculateAtsScore(resume);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it("detects contact information properly", () => {
    const resume = "john@example.com\n(555) 123-4567\nlinkedin.com/in/john\ngithub.com/johndoe";
    const result = calculateAtsScore(resume);
    expect(result.subscores.contactInfo).toBeGreaterThanOrEqual(85);
  });

  it("calculates readability score for short sentences", () => {
    const resume = "Built apps. Led teams. Shipped products. Grew revenue.";
    const result = calculateAtsScore(resume);
    expect(result.readabilityDetails.avgSentenceLength).toBeLessThan(5);
  });

  it("detects bullet points in formatting score", () => {
    const resume = "Skills\n• JavaScript\n• TypeScript\n• React\n• Node.js\n• Python\n• Docker\n• AWS\n• PostgreSQL\n• Redis\n• Kubernetes";
    const result = calculateAtsScore(resume);
    expect(result.subscores.formatting).toBeGreaterThanOrEqual(70);
  });

  it("handles keyword matching across categories", () => {
    const resume = "achieved 50% growth using JavaScript and React";
    const result = calculateAtsScore(resume);
    expect(result.keywordDetails["action-verbs"]).toBeGreaterThanOrEqual(1);
    expect(result.keywordDetails["metrics"]).toBeGreaterThanOrEqual(1);
    expect(result.keywordDetails["tech-skills"]).toBeGreaterThanOrEqual(2);
  });

  // --- Category-specific tests ---

  it("boosts education weight for student category", () => {
    const resume = `Jane Smith
jane@example.com | linkedin.com/in/jane

Education
BS Computer Science, MIT (2022 - 2026)
GPA: 3.8/4.0
Relevant Coursework: Data Structures, Algorithms, Machine Learning
Dean's List: Fall 2023, Spring 2024

Projects
• Built a machine learning model to predict housing prices using Python and scikit-learn
• Developed a full-stack web application using React and Node.js

Skills
Python, JavaScript, React, SQL
`;

    const result = calculateAtsScore({ text: resume, category: "student" });
    expect(result.category).toBe("student");
    expect(result.subscores.educationRelevance).toBeGreaterThan(50);
  });

  it("weights projects heavily for fresher category", () => {
    const resume = `Alex Chen
alex@example.com | github.com/alexchen

Education
BS Computer Science, State University (2020 - 2024)

Projects
• E-commerce Platform: Built a full-stack e-commerce platform using React, Node.js, and PostgreSQL
• Task Manager App: Created a task management app with real-time updates using WebSockets
• Portfolio Website: Designed and deployed a personal portfolio using Next.js and Tailwind CSS

Skills
JavaScript, React, Node.js, PostgreSQL, Git, HTML, CSS

Internship
Software Engineering Intern at StartupXYZ (Summer 2023)
• Developed RESTful APIs using Node.js and Express
• Wrote unit tests achieving 90% code coverage
`;

    const result = calculateAtsScore({ text: resume, category: "fresher" });
    expect(result.subscores.projectQuality).toBeGreaterThan(50);
  });

  it("weights experience heavily for experienced category", () => {
    const resume = `Sarah Johnson
sarah@example.com | linkedin.com/in/sarahjohnson

Summary
Senior Software Engineer with 8+ years of experience building scalable distributed systems.

Experience
Senior Software Engineer at BigTech Corp (2020 - Present)
• Led architecture redesign of core platform, improving scalability by 300%
• Managed a team of 12 engineers across 3 scrum teams
• Established engineering best practices and mentored 5 junior engineers
• Reduced system latency by 60% through optimization of database queries

Software Engineer at MidCorp (2017 - 2020)
• Developed microservices architecture serving 1M+ daily users
• Implemented CI/CD pipelines reducing deployment time by 80%

Education
MS Computer Science, Tech University (2015 - 2017)

Skills
Java, Python, AWS, Docker, Kubernetes, System Design, Microservices
`;

    const result = calculateAtsScore({ text: resume, category: "experienced" });
    expect(result.subscores.experienceDepth).toBeGreaterThan(60);
    expect(result.keywordDetails["action-verbs"]).toBeGreaterThanOrEqual(3);
  });

  it("provides student-specific suggestions", () => {
    const resume = "Just a simple academic background without much detail";
    const result = calculateAtsScore({ text: resume, category: "student" });
    const hasStudentSuggestion = result.suggestions.some(
      (s) => s.toLowerCase().includes("gpa") || s.toLowerCase().includes("coursework") || s.toLowerCase().includes("academic")
    );
    expect(hasStudentSuggestion).toBe(true);
  });

  it("provides fresher-specific suggestions about projects", () => {
    const resume = "Simple resume with no projects mentioned";
    const result = calculateAtsScore({ text: resume, category: "fresher" });
    const hasProjectSuggestion = result.suggestions.some(
      (s) => s.toLowerCase().includes("project")
    );
    expect(hasProjectSuggestion).toBe(true);
  });

  it("provides experienced-specific suggestions about metrics", () => {
    const resume = "I did some work and helped the team";
    const result = calculateAtsScore({ text: resume, category: "experienced" });
    const hasMetricSuggestion = result.suggestions.some(
      (s) => s.toLowerCase().includes("metric") || s.toLowerCase().includes("quantif")
    );
    expect(hasMetricSuggestion).toBe(true);
  });

  it("matches keywords against job description when provided", () => {
    const resume = "Experienced React developer with TypeScript knowledge";
    const jd = "Looking for a React developer with TypeScript, Node.js, AWS, and Docker experience";
    const result = calculateAtsScore({ text: resume, jobDescription: jd });
    expect(result.keywordDetails).toHaveProperty("jd-match");
  });

  it("detects projects section in section analysis", () => {
    const resume = `Summary: Experienced developer
Experience: Built things
Education: BS CS
Skills: JavaScript, React
Projects: My portfolio project`;
    const result = calculateAtsScore(resume);
    expect(result.sectionDetails.present).toContain("projects");
  });

  it("returns high B grade or better for a strong resume", () => {
    const resume = `John Doe
john@example.com | (555) 123-4567 | linkedin.com/in/john | github.com/johndoe

Summary
Experienced software engineer with 10+ years building web applications.

Experience
Senior Engineer at TechCorp (2018 - Present)
• Led a team of 10 engineers to deliver critical infrastructure improvements
• Achieved 95% reduction in deployment time using automated CI/CD pipelines
• Implemented new features that increased revenue by $2M annually
• Optimized system performance achieving 200% improvement
• Reduced operational costs by 40% through strategic optimization

Education
MS Computer Science, Stanford University (2014 - 2016)
GPA: 3.9/4.0

Skills
JavaScript, TypeScript, React, Node.js, Python, SQL, Docker, AWS, Kubernetes

Achievements
• Increased system performance by 200%
• Reduced costs by 40% through optimization
`;
    const result = calculateAtsScore(resume);
    expect(result.grade).toMatch(/^[AB]/);
    expect(result.overall).toBeGreaterThanOrEqual(60);
  });
});
