/**
 * Throwaway end-to-end test for the optimize-resume action.
 * Calls the real callAi() client (Groq primary + Gemini fallback) with a
 * realistic resume + job description and prints the result.
 */
import { callAi } from "../src/services/ai/client";

const RESUME = `Riya Sharma | riya.sharma@gmail.com | +91 98765 43210 | linkedin.com/in/riyasharma | github.com/riyasharma

PROFESSIONAL SUMMARY
Full-stack developer with 4 years of experience building React and Node.js applications for e-commerce and fintech teams.

TECHNICAL SKILLS
Languages: JavaScript, TypeScript, Python, Java
Frameworks: React, Next.js, Node.js, Express, Tailwind CSS
Databases: PostgreSQL, MongoDB, Redis
Tools: Git, GitHub, Docker, AWS, GitHub Actions, Postman, Jest

WORK EXPERIENCE / INTERNSHIPS
Senior Frontend Developer at PayFast (2022 - Present)
- Built a payment dashboard used by 50k+ merchants.
- Reduced page load time by 40% through code splitting and lazy loading.
- Led a team of 3 developers on the checkout redesign.
Frontend Developer at ShopMate (2020 - 2022)
- Implemented product search and filtering with React.
- Integrated Stripe checkout and improved conversion by 15%.
- Wrote unit tests with Jest increasing coverage from 60% to 85%.

PROJECTS
OrderTrack [React, Node.js, PostgreSQL, Redis]
- Real-time order tracking system with WebSocket updates and Redis caching.
- Impact: handled 10k concurrent connections.

EDUCATION
B.Tech Computer Science, Delhi Technological University (2016 - 2020), CGPA: 8.4

CERTIFICATIONS
AWS Certified Developer - Associate — Amazon Web Services (2023)
`;

const JD = `Senior Full Stack Engineer at Finlytics
We are looking for a Senior Full Stack Engineer with 4+ years of experience to join our payments platform team. You will own end-to-end features across our React + TypeScript frontend and Node.js backend.
Requirements:
- Strong proficiency in JavaScript/TypeScript, React, and Node.js
- Experience with PostgreSQL and designing efficient database schemas
- Building and integrating REST APIs
- Experience with AWS, Docker, and CI/CD pipelines
- Writing automated tests (unit and integration)
- Experience with high-traffic systems and performance optimization is a big plus
- Familiarity with payment systems or fintech is preferred
- Nice to have: Redis caching, real-time systems (WebSockets)`;

async function main() {
  const startedAt = Date.now();
  const result = await callAi({
    action: "optimize-resume",
    input: `Target role: Senior Full Stack Engineer\n\nJob description:\n${JD}`,
    context: RESUME,
  });

  console.log(`\n=== RESULT (${Date.now() - startedAt}ms) ===`);
  console.log(`success: ${result.success}`);
  if (result.provider) console.log(`provider: ${result.provider} (${result.model})`);
  if (result.warnings?.length) console.log(`warnings: ${result.warnings.join(" | ")}`);
  if (result.error) console.log(`error: ${result.error}`);
  if (result.output) console.log("\n--- OUTPUT ---\n" + result.output + "\n--- END ---");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
