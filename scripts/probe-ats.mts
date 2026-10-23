import { analyzeDeepAts } from "../src/services/resume-analyzer/deep-ats";

const STRONG_RESUME = `John Doe
john@email.com | +1 555 123 4567 | linkedin.com/in/johndoe | github.com/johndoe

SUMMARY
Senior Software Engineer with 6+ years building scalable web applications.

EXPERIENCE
TechNova Solutions — Senior Software Engineer (2022 - Present)
- Architected microservices handling 100K+ daily active users
- Reduced API response time by 38% via query optimization
- Led a team of 6 engineers to ship 3 major releases

Acme Corp — Software Engineer (2019 - 2022)
- Built REST APIs in Node.js serving 300K users
- Automated CI/CD pipelines with Docker and GitHub Actions
- Migrated legacy monolith to Kubernetes on AWS

EDUCATION
B.Tech Computer Science, Stanford University (2015 - 2019), CGPA 3.8

SKILLS
JavaScript, TypeScript, React, Node.js, Python, SQL, Docker, Kubernetes, AWS, Git

PROJECTS
AI Resume Analyzer — ML-powered resume analysis tool with 94% accuracy
- Used TensorFlow and Python to classify resume sections`;

const WEAK_RESUME = `John Doe
john@email.com

SUMMARY
Hardworking team player with excellent communication skills. Passionate about technology.

EXPERIENCE
Some Company - Developer (2021-2023)
- Worked on various projects
- Responsible for fixing bugs
- Helped the team

EDUCATION
Some University

SKILLS
MS Office, Excel`;

const EXCELLENT_RESUME = `Sarah Johnson
sarah@example.com | +1 415 555 0100 | linkedin.com/in/sarahjohnson | github.com/sarahj

SUMMARY
Senior Staff Engineer with 12+ years of experience architecting large-scale distributed systems.

EXPERIENCE
BigTech Corp — Staff Engineer (2021 - Present)
- Architected multi-region microservices platform serving 5M+ daily users with 99.99% uptime
- Reduced infrastructure costs by 42% ($1.2M annual savings) through Kubernetes autoscaling
- Led 3 scrum teams of 15 engineers, mentoring 8 to senior level
- Drove migration of 200+ services from monolith to event-driven architecture

MidCorp — Senior Engineer (2017 - 2021)
- Built real-time data pipeline processing 10B events/day with Kafka and Spark
- Improved query performance 8x via database indexing and caching strategy
- Established CI/CD platform adopted by 40+ teams, cutting release time 70%

StartupXYZ — Software Engineer (2014 - 2017)
- Shipped user-facing features in React/TypeScript used by 1M monthly users
- Automated testing suite growing coverage from 30% to 92%

EDUCATION
MS Computer Science, MIT (2012 - 2014), GPA 3.9/4.0
BS Computer Science, UC Berkeley (2008 - 2012), Summa Cum Laude

SKILLS
TypeScript, Python, Go, React, Node.js, GraphQL, PostgreSQL, MongoDB, Redis, Kafka, Spark, Kubernetes, Docker, AWS, Terraform, CI/CD

CERTIFICATIONS
AWS Solutions Architect Professional
Google Cloud Professional Cloud Architect

PROJECTS
Open Source: Maintainer of 3 OSS libraries with 15K+ GitHub stars
- Designed distributed tracing SDK used in production by 200+ companies`;

function show(name: string, text: string, opts: Record<string, string> = {}) {
  const r = analyzeDeepAts({ text, ...opts });
  console.log(`\n=== ${name} ===`);
  console.log(`atsScore: ${r.atsScore} (${r.grade})  recruiter: ${r.recruiterScore}  hiring: ${r.hiringProbability}  interview: ${r.interviewChance}`);
  console.log(`jdMatch: ${r.jdMatchScore}  keywordRelevance sub: ${r.subscores.keywordRelevance}`);
  console.log(`subscores: ${JSON.stringify(r.subscores)}`);
  console.log(`parserConfidence: ${r.parserConfidence}`);
  console.log(`grammar: ${r.grammarScore}  english: ${r.englishScore}  density: ${r.densityScore}`);
  console.log(`bullets: ${JSON.stringify(r.bullets.total)} strong:${r.bullets.strong} weak:${r.bullets.weak.length}`);
}

show("STRONG (no JD)", STRONG_RESUME);
show("WEAK (no JD)", WEAK_RESUME);
show("EXCELLENT (no JD)", EXCELLENT_RESUME);

const JD = "We need a Senior Full Stack Engineer with React, Node.js, AWS, Kubernetes, Docker, CI/CD, GraphQL, PostgreSQL, TypeScript and system design experience. Bonus: Go and Kafka.";
show("STRONG + JD", STRONG_RESUME, { jobTitle: "Senior Full Stack Engineer", jobDescription: JD });
show("EXCELLENT + JD", EXCELLENT_RESUME, { jobTitle: "Senior Full Stack Engineer", jobDescription: JD });
