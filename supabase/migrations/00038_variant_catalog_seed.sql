-- Variant catalog seed: the 59 marketplace variants (archetypes seeded in 00037).
-- Config-driven catalog (src/features/resume-builder/config/template-variants.ts) is the
-- source of truth; this migration mirrors it into templates so the public /api/templates
-- endpoint and admin panel expose the full marketplace. Idempotent via component_key UNIQUE.
-- Never deletes rows; only inserts/updates.

-- Include the marketplace 'portfolio' category in the templates.category CHECK.
ALTER TABLE templates DROP CONSTRAINT IF EXISTS templates_category_check;
ALTER TABLE templates
ADD CONSTRAINT templates_category_check CHECK (
    category IN (
      'ats-professional',
      'modern',
      'minimal',
      'executive',
      'student',
      'creative',
      'executive-sidebar',
      'modern-card',
      'imported',
      'ats-friendly',
      'professional',
      'technical',
      'academic',
      'designer',
      'premium',
      'portfolio'
    )
  );

INSERT INTO templates (
    name,
    category,
    description,
    component_key,
    is_active,
    sort_order,
    target_roles,
    experience_levels,
    ats_friendly,
    layout,
    source_url,
    source_license,
    source_author
  )
VALUES
  (
    'ATS Classic',
    'ats-friendly',
    'The timeless one-page resume: centered masthead, bold uppercase name, and textbook section order. Nothing a parser hasn''t seen a thousand times.',
    'ats-classic',
    true,
    100,
    ARRAY[
      'Marketing / Sales',
      'HR / Recruiter',
      'Finance / Consultant'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS Minimal',
    'ats-friendly',
    'A stripped-down parser-friendly single column with generous whitespace and no decoration whatsoever. Maximum signal, minimum noise.',
    'ats-minimal',
    true,
    101,
    ARRAY[
      'Product / UX Designer',
      'Data Scientist / Analyst',
      'Marketing / Sales'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS Software Engineer',
    'technical',
    'An ATS-safe single column tuned for engineering keywords: technical skills up front, projects with tech stacks, and a standard experience section.',
    'ats-software-engineer',
    true,
    102,
    ARRAY[
      'Software Engineer',
      'Full Stack Developer',
      'Backend Developer'
    ],
    ARRAY[
      'entry',
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS Full Stack',
    'technical',
    'A parser-first layout that leads with a full-stack skill matrix, then projects and experience. Built for engineers who span frontend and backend.',
    'ats-fullstack',
    true,
    103,
    ARRAY[
      'Full Stack Developer',
      'Software Engineer',
      'Frontend Developer',
      'Backend Developer'
    ],
    ARRAY[
      'entry',
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS Backend',
    'technical',
    'A single-column, systems-focused layout: architecture, databases, APIs, and performance metrics in a parser-friendly reading order.',
    'ats-backend',
    true,
    104,
    ARRAY[
      'Backend Developer',
      'Software Engineer',
      'Data Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS Frontend',
    'technical',
    'A clean single column that puts UI engineering skills, component work, and frontend projects in parser-friendly order.',
    'ats-frontend',
    true,
    105,
    ARRAY[
      'Frontend Developer',
      'Full Stack Developer',
      'Software Engineer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS DevOps',
    'technical',
    'A parser-safe single column for CI/CD, infrastructure, and automation roles — tools and pipelines described in plain text a parser can index.',
    'ats-devops',
    true,
    106,
    ARRAY[
      'DevOps Engineer',
      'Cloud Engineer',
      'SRE / Platform Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS Cloud',
    'technical',
    'A single-column layout organized around cloud platforms, certifications, and infrastructure projects — all selectable text.',
    'ats-cloud',
    true,
    107,
    ARRAY[
      'Cloud Engineer',
      'DevOps Engineer',
      'SRE / Platform Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS Data Engineer',
    'technical',
    'A parser-first layout for pipelines, warehouses, and ETL work — skills, tools, and outcomes in standard single-column order.',
    'ats-data-engineer',
    true,
    108,
    ARRAY[
      'Data Engineer',
      'Data Scientist / Analyst',
      'Backend Developer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS AI Engineer',
    'technical',
    'A conservative single column that lets ML/AI experience, model work, and frameworks shine in plain, parseable text.',
    'ats-ai-engineer',
    true,
    109,
    ARRAY[
      'AI Engineer',
      'Machine Learning Engineer',
      'Software Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'ATS Security',
    'technical',
    'A no-frills single column for security, compliance, and AppSec roles — certifications and incident outcomes in standard order.',
    'ats-security',
    true,
    110,
    ARRAY[
      'Security Engineer',
      'Cloud Engineer',
      'SRE / Platform Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Modern Developer',
    'modern',
    'A clean, accent-forward single column that balances a developer''s skills, projects, and experience with modern typography.',
    'modern-developer',
    true,
    111,
    ARRAY[
      'Software Engineer',
      'Full Stack Developer',
      'Frontend Developer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Modern Tech',
    'technical',
    'A single-column tech layout with a cyan accent and a technical-skills-led hierarchy for engineering and infrastructure roles.',
    'modern-tech',
    true,
    112,
    ARRAY[
      'Software Engineer',
      'DevOps Engineer',
      'Cloud Engineer',
      'SRE / Platform Engineer'
    ],
    ARRAY[
      'entry',
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Modern Startup',
    'modern',
    'A warm, high-energy single column with an amber accent — built for startup generalists, PMs, and early-stage operators.',
    'modern-startup',
    true,
    113,
    ARRAY[
      'Product Manager',
      'Software Engineer',
      'Marketing / Sales',
      'CEO / Founder / Executive'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Modern Product Engineer',
    'technical',
    'A single-column layout that foregrounds shipped products, impact metrics, and cross-functional work — for engineer-PM hybrids.',
    'modern-product-engineer',
    true,
    114,
    ARRAY[
      'Product Manager',
      'Software Engineer',
      'Product / UX Designer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Modern Full Stack',
    'technical',
    'An emerald-accent single column that gives equal weight to frontend and backend skills, projects, and shipped features.',
    'modern-fullstack',
    true,
    115,
    ARRAY[
      'Full Stack Developer',
      'Software Engineer',
      'Frontend Developer',
      'Backend Developer'
    ],
    ARRAY[
      'entry',
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Modern Minimal',
    'minimal',
    'A restrained take on the Modern archetype — slate accent, quiet dividers, and generous whitespace for a calm, professional feel.',
    'modern-minimal',
    true,
    116,
    ARRAY[
      'Product / UX Designer',
      'Marketing / Sales',
      'Data Scientist / Analyst'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Student Developer',
    'technical',
    'An education-first developer resume: coursework and projects lead, internship experience and coding profiles support.',
    'student-developer',
    true,
    117,
    ARRAY[
      'Student / Intern / Fresher',
      'Software Engineer',
      'Frontend Developer'
    ],
    ARRAY[
      'student',
      'entry'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Graduate',
    'student',
    'A bright, optimistic layout for new graduates — education first, projects prominent, and internships placed where they matter.',
    'graduate',
    true,
    118,
    ARRAY[
      'Student / Intern / Fresher',
      'Academic / Researcher / Professor'
    ],
    ARRAY[
      'student',
      'entry'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Internship',
    'student',
    'A warm, approachable layout that makes internships the hero — work experience placed right after education for current students.',
    'internship',
    true,
    119,
    ARRAY[
      'Student / Intern / Fresher',
      'Academic / Researcher / Professor'
    ],
    ARRAY[
      'student',
      'entry'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Entry Level',
    'student',
    'A green-accent layout for first full-time roles: education, projects, skills, and a focused summary lead the page.',
    'entry-level',
    true,
    120,
    ARRAY[
      'Student / Intern / Fresher',
      'Software Engineer',
      'Marketing / Sales'
    ],
    ARRAY[
      'student',
      'entry'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'College Developer',
    'technical',
    'A student-engineer resume with indigo energy — coursework, hackathons, and open-source projects above the fold.',
    'college-developer',
    true,
    121,
    ARRAY[
      'Student / Intern / Fresher',
      'Software Engineer',
      'Full Stack Developer'
    ],
    ARRAY[
      'student',
      'entry'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Bootcamp Graduate',
    'technical',
    'A bold, project-led layout for bootcamp grads — capstone projects and certifications carry the story.',
    'bootcamp-graduate',
    true,
    122,
    ARRAY[
      'Student / Intern / Fresher',
      'Frontend Developer',
      'Full Stack Developer'
    ],
    ARRAY[
      'student',
      'entry'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Minimal Developer',
    'technical',
    'A quiet, monochrome developer resume where skills read like a typed list and experience gets all the breathing room.',
    'minimal-developer',
    true,
    123,
    ARRAY[
      'Software Engineer',
      'Full Stack Developer',
      'Frontend Developer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Minimal ATS',
    'ats-friendly',
    'The cleanest parser-friendly layout in the catalog — a centered monochrome masthead and textbook section order with zero decoration.',
    'minimal-ats',
    true,
    124,
    ARRAY[
      'Software Engineer',
      'Finance / Consultant',
      'HR / Recruiter'
    ],
    ARRAY[
      'entry',
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Minimal One Page',
    'minimal',
    'A disciplined one-page layout with tight leading and hairline rules — everything fits, nothing feels cramped.',
    'minimal-one-page',
    true,
    125,
    ARRAY[
      'Product Manager',
      'Marketing / Sales',
      'Software Engineer'
    ],
    ARRAY[
      'entry',
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Minimal Technical',
    'technical',
    'A monospace take on Minimal — a typewriter-clean developer resume where every label is uppercase and every skill is a line.',
    'minimal-technical',
    true,
    126,
    ARRAY[
      'Software Engineer',
      'DevOps Engineer',
      'SRE / Platform Engineer'
    ],
    ARRAY[
      'entry',
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Minimal Executive',
    'executive',
    'A serif, restrained executive layout — leadership summary, quantified achievements, and competencies with an understated indigo accent.',
    'minimal-executive',
    true,
    127,
    ARRAY[
      'Engineering Manager',
      'Engineering Director / Tech Lead',
      'CTO / VP Engineering'
    ],
    ARRAY[
      'senior',
      'executive'
    ],
    false,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Executive Tech',
    'technical',
    'A serif leadership layout built for technical executives — architecture ownership, platform strategy, and team scale.',
    'executive-tech',
    true,
    128,
    ARRAY[
      'Engineering Director / Tech Lead',
      'CTO / VP Engineering',
      'Engineering Manager'
    ],
    ARRAY[
      'senior',
      'executive'
    ],
    false,
    'two-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Engineering Manager',
    'executive',
    'A leadership layout that foregrounds team size, delivery, hiring, and mentorship alongside hands-on engineering history.',
    'engineering-manager',
    true,
    129,
    ARRAY[
      'Engineering Manager',
      'Engineering Director / Tech Lead'
    ],
    ARRAY[
      'senior',
      'executive'
    ],
    false,
    'two-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Engineering Director',
    'executive',
    'A formal serif layout for multi-team leadership — org ownership, P&L impact, and transformation programs in boardroom language.',
    'engineering-director',
    true,
    130,
    ARRAY[
      'Engineering Director / Tech Lead',
      'CTO / VP Engineering'
    ],
    ARRAY[
      'senior',
      'executive'
    ],
    false,
    'two-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Technical Leader',
    'technical',
    'A staff-plus leadership layout — architecture decisions, cross-team influence, and system design leadership.',
    'technical-leader',
    true,
    131,
    ARRAY[
      'Engineering Director / Tech Lead',
      'Engineering Manager',
      'CTO / VP Engineering'
    ],
    ARRAY[
      'senior',
      'executive'
    ],
    false,
    'two-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'CTO',
    'executive',
    'A dark-sidebar executive layout for founders and CTOs — vision, platform building, team scale, and board-level communication.',
    'cto',
    true,
    132,
    ARRAY[
      'CTO / VP Engineering',
      'CEO / Founder / Executive'
    ],
    ARRAY[
      'senior',
      'executive'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'VP Engineering',
    'executive',
    'A senior-executive sidebar layout emphasizing org transformation, hiring velocity, and multi-team delivery.',
    'vp-engineering',
    true,
    133,
    ARRAY[
      'CTO / VP Engineering',
      'Engineering Director / Tech Lead',
      'CEO / Founder / Executive'
    ],
    ARRAY[
      'executive'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Creative Developer',
    'technical',
    'A warm, orange-accent sidebar layout for creative technologists — skills and languages in the rail, experience and projects up front.',
    'creative-developer',
    true,
    134,
    ARRAY[
      'Frontend Developer',
      'Product / UX Designer',
      'Software Engineer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Portfolio Developer',
    'portfolio',
    'A project-led sidebar layout built around GitHub work, live demos, and open-source contributions.',
    'portfolio-developer',
    true,
    135,
    ARRAY[
      'Frontend Developer',
      'Software Engineer',
      'Product / UX Designer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Designer Developer',
    'creative',
    'A vivid fuchsia sidebar layout for designer-developers — design process, tooling, and shipped interfaces in one visual story.',
    'designer-developer',
    true,
    136,
    ARRAY[
      'Product / UX Designer',
      'Frontend Developer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Frontend Creative',
    'technical',
    'A red-accent sidebar layout that pairs frontend engineering depth with visual polish — component work and design systems.',
    'frontend-creative',
    true,
    137,
    ARRAY[
      'Frontend Developer',
      'Product / UX Designer',
      'Full Stack Developer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Modern Creative',
    'creative',
    'A purple-accent sidebar layout that keeps the bold Creative structure while leaning into modern brand work.',
    'modern-creative',
    true,
    138,
    ARRAY[
      'Marketing / Sales',
      'Product / UX Designer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Software Engineer',
    'technical',
    'The go-to developer resume: balanced single column, technical skills grouped, projects with impact, and standard ATS-safe order.',
    'software-engineer',
    true,
    139,
    ARRAY[
      'Software Engineer',
      'Full Stack Developer',
      'Backend Developer'
    ],
    ARRAY[
      'entry',
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Full Stack Developer',
    'technical',
    'A single-column layout with a teal accent that gives frontend and backend skills equal billing and ships both stacks in projects.',
    'fullstack-developer',
    true,
    140,
    ARRAY[
      'Full Stack Developer',
      'Software Engineer',
      'Frontend Developer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Frontend Developer',
    'technical',
    'A card-based single column with an indigo accent that showcases UI work, component libraries, and design-system experience.',
    'frontend-developer',
    true,
    141,
    ARRAY[
      'Frontend Developer',
      'Software Engineer',
      'Product / UX Designer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Backend Developer',
    'technical',
    'A conservative single column for backend engineers — APIs, databases, distributed systems, and reliability metrics.',
    'backend-developer',
    true,
    142,
    ARRAY[
      'Backend Developer',
      'Software Engineer',
      'Data Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'DevOps Engineer',
    'technical',
    'An amber-accent layout for automation and delivery — CI/CD pipelines, observability, and infrastructure-as-code.',
    'devops-engineer',
    true,
    143,
    ARRAY[
      'DevOps Engineer',
      'SRE / Platform Engineer',
      'Cloud Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Cloud Engineer',
    'technical',
    'A card-based layout with a sky-blue accent organized around platforms, certifications, and cost/reliability wins.',
    'cloud-engineer',
    true,
    144,
    ARRAY[
      'Cloud Engineer',
      'DevOps Engineer',
      'SRE / Platform Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    false,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Data Engineer',
    'technical',
    'A green-accent single column for pipelines, warehouses, and analytics engineering — tools and data volumes front and center.',
    'data-engineer',
    true,
    145,
    ARRAY[
      'Data Engineer',
      'Data Scientist / Analyst',
      'Backend Developer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Machine Learning Engineer',
    'technical',
    'A violet-accent layout for ML work — model development, training pipelines, evaluation, and production deployment.',
    'machine-learning-engineer',
    true,
    146,
    ARRAY[
      'Machine Learning Engineer',
      'AI Engineer',
      'Data Scientist / Analyst'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'AI Engineer',
    'technical',
    'A modern card layout for AI product work — LLM apps, agents, RAG systems, and shipped AI features.',
    'ai-engineer',
    true,
    147,
    ARRAY[
      'AI Engineer',
      'Machine Learning Engineer',
      'Software Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    false,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Security Engineer',
    'technical',
    'A conservative single column for AppSec, compliance, and security engineering — findings, certifications, and incident outcomes.',
    'security-engineer',
    true,
    148,
    ARRAY[
      'Security Engineer',
      'Cloud Engineer',
      'SRE / Platform Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Mobile Developer',
    'technical',
    'A cyan-accent single column for iOS/Android engineers — shipped apps, stores, SDKs, and mobile-specific metrics.',
    'mobile-developer',
    true,
    149,
    ARRAY[
      'Mobile Developer',
      'Software Engineer',
      'Frontend Developer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Platform Engineer',
    'technical',
    'A slate-accent card layout for internal platforms — developer tooling, self-service infrastructure, and adoption metrics.',
    'platform-engineer',
    true,
    150,
    ARRAY[
      'SRE / Platform Engineer',
      'DevOps Engineer',
      'Cloud Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    false,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'SRE',
    'technical',
    'A reliability-first single column — SLOs, incident response, capacity planning, and automation in parser-friendly order.',
    'sre',
    true,
    151,
    ARRAY[
      'SRE / Platform Engineer',
      'DevOps Engineer',
      'Cloud Engineer'
    ],
    ARRAY[
      'mid',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Academic',
    'academic',
    'A serif, publication-led CV layout — education, research, publications, and teaching in a calm editorial structure.',
    'academic',
    true,
    152,
    ARRAY[
      'Academic / Researcher / Professor',
      'Student / Intern / Fresher'
    ],
    ARRAY[
      'student',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Researcher',
    'academic',
    'A research-first CV: publications, grants, presentations, and projects with a warm serif accent.',
    'researcher',
    true,
    153,
    ARRAY[
      'Academic / Researcher / Professor',
      'Data Scientist / Analyst'
    ],
    ARRAY[
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'PhD',
    'academic',
    'A serif CV for doctoral work — dissertation, research experience, teaching, and publications in a focused single column.',
    'phd',
    true,
    154,
    ARRAY[
      'Academic / Researcher / Professor',
      'Student / Intern / Fresher'
    ],
    ARRAY[
      'student',
      'senior'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Scientific',
    'academic',
    'A formal serif CV for scientific roles — peer-reviewed publications, grants, collaborations, and lab leadership.',
    'scientific',
    true,
    155,
    ARRAY[
      'Academic / Researcher / Professor',
      'Data Scientist / Analyst'
    ],
    ARRAY[
      'senior',
      'executive'
    ],
    true,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Portfolio',
    'portfolio',
    'A project-first sidebar layout built around case studies, live work, and a strong visual identity.',
    'portfolio',
    true,
    156,
    ARRAY[
      'Product / UX Designer',
      'Frontend Developer',
      'Software Engineer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Design Portfolio',
    'portfolio',
    'A card-based portfolio resume — each project its own card with role, impact, and links, in a fuchsia-accent single column.',
    'design-portfolio',
    true,
    157,
    ARRAY[
      'Product / UX Designer',
      'Marketing / Sales'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'single-column',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  ),
  (
    'Case Study Portfolio',
    'portfolio',
    'A rose-accent sidebar layout that treats each project like a mini case study — problem, process, and outcome.',
    'case-study-portfolio',
    true,
    158,
    ARRAY[
      'Product / UX Designer',
      'Marketing / Sales',
      'Frontend Developer'
    ],
    ARRAY[
      'entry',
      'mid'
    ],
    false,
    'sidebar',
    'https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer',
    'MIT',
    'Freebuff'
  )
ON CONFLICT (component_key) DO
UPDATE
SET name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = true,
  sort_order = EXCLUDED.sort_order,
  target_roles = EXCLUDED.target_roles,
  experience_levels = EXCLUDED.experience_levels,
  ats_friendly = EXCLUDED.ats_friendly,
  layout = EXCLUDED.layout,
  source_url = EXCLUDED.source_url,
  source_license = EXCLUDED.source_license,
  source_author = EXCLUDED.source_author;
