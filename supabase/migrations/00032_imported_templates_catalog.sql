-- Imported template catalog: 89 total designs (8 built-in + 81 curated
-- imported from CVAurum, reactive-resume, resumake.io, rendercv,
-- open-resume, Freebuff originals, and Overleaf-published LaTeX designs;
-- non-professional / non-company-safe designs excluded).
--
-- The imported templates are DATA-DRIVEN: a single generic renderer consumes
-- each config, so the app can grow the catalog without adding React components.
-- The DB stores them so the admin catalog + /api/templates stay in sync, and
-- the resumes.template CHECK constraint is dropped since the set is open-ended
-- (app-level validation is the guard now).
-- 1. Resume template column: drop the fixed 8-key CHECK constraint.
ALTER TABLE resumes DROP CONSTRAINT IF EXISTS resumes_template_check;
-- 2. templates.category: allow the 'imported' category.
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
      'imported'
    )
  );
-- 3. Seed the 75 imported templates (idempotent via component_key UNIQUE).
INSERT INTO templates (
    name,
    category,
    description,
    component_key,
    is_active,
    sort_order
  )
VALUES (
    'Clarity',
    'imported',
    'The modern professional standard: heavy ruled headings, dotted entry dividers, accent-blue employers, a right rail on white, score blocks for education, and underlined skill tags. Rich, structured, endlessly scannable.',
    'cv-aurum-clarity',
    true,
    50
  ),
  (
    'Cascade',
    'imported',
    'A confident two-column with a deep-teal sidebar carrying your photo, skills and languages, and a clean white main column for experience. Bold, colorful, instantly modern.',
    'cv-aurum-cascade',
    true,
    51
  ),
  (
    'Sapphire',
    'imported',
    'Corporate two-column with a deep-navy sidebar, a squared photo, and dot-meter skills — the polished, recruiter-ready look that dominates modern builders.',
    'cv-aurum-sapphire',
    true,
    52
  ),
  (
    'Garnet',
    'imported',
    'A warm, editorial two-column with a burgundy sidebar on the right, a rounded photo, and bar-meter skills — distinctive and premium without shouting.',
    'cv-aurum-garnet',
    true,
    53
  ),
  (
    'Initials',
    'imported',
    'Monogram-led two-column: your initials in a diamond badge atop a deep sidebar, with a crisp white main column. Distinctive, confident, unmistakably modern.',
    'cv-aurum-initials',
    true,
    54
  ),
  (
    'Emblem',
    'imported',
    'A centered single-column with a circular monogram crest over a tracked serif name — formal, balanced, and ruthlessly ATS-clean.',
    'cv-aurum-emblem',
    true,
    55
  ),
  (
    'Verde',
    'imported',
    'Fresh two-column with a forest-green sidebar, a circular photo, and skill pills — natural, modern, approachable.',
    'cv-aurum-verde',
    true,
    56
  ),
  (
    'Pinnacle',
    'imported',
    'Executive two-column: a circular monogram over a charcoal sidebar, dot-meter skills, and a clean main column.',
    'cv-aurum-pinnacle',
    true,
    57
  ),
  (
    'Crest',
    'imported',
    'Traditional single-column with a squared monogram crest, centered serif name, and ruled headings — formal and ATS-perfect.',
    'cv-aurum-crest',
    true,
    58
  ),
  (
    'Orchid',
    'imported',
    'A refined two-column with a plum sidebar on the right, a rounded photo, and bar-meter skills — distinctive and warm.',
    'cv-aurum-orchid',
    true,
    59
  ),
  (
    'Aurum',
    'imported',
    'The signature design: editorial ink layout with a serif name and a hairline gold accent — premium and unmistakably yours, still fully ATS-safe.',
    'cv-aurum-aurum',
    true,
    60
  ),
  (
    'Aurum Editorial',
    'imported',
    'Editorial gold: Cormorant serif headings, a small-caps gold name, and a single hairline gold rule under each heading. Magazine-grade and premium.',
    'cv-aurum-aurum-editorial',
    true,
    61
  ),
  (
    'Swiss Aurum',
    'imported',
    'Swiss-modernist grid: Inter, generous white space, tracked caps labels with a gold tick. Crisp, contemporary, unmistakably premium.',
    'cv-aurum-swiss-aurum',
    true,
    62
  ),
  (
    'Atelier',
    'imported',
    'Couture editorial: a Playfair serif name over a gold monospace tagline, gold gutter labels, and a single gold accent tick. Jewellery-grade — the one that turns heads.',
    'cv-aurum-atelier',
    true,
    63
  ),
  (
    'Harvard',
    'imported',
    'The classic Harvard format recruiters know: centered serif name, bold uppercase section rules, impeccable structure. Pure black, maximally ATS.',
    'cv-aurum-harvard',
    true,
    64
  ),
  (
    'Garamond',
    'imported',
    'The timeless Garamond résumé recruiters trust — a bold old-style serif name, clean ruled sections, impeccable single-column structure. Classic and ATS-perfect.',
    'cv-aurum-garamond',
    true,
    65
  ),
  (
    'Aria',
    'imported',
    'Clean single-column with a confident accent. The safe, sharp default.',
    'cv-aurum-aria',
    true,
    66
  ),
  (
    'Oxford',
    'imported',
    'Timeless serif résumé. Conservative, recruiter-friendly, ATS-perfect.',
    'cv-aurum-oxford',
    true,
    67
  ),
  (
    'Cambridge',
    'imported',
    'RenderCV-grade clean layout: Source Sans, navy accent, ruled headings, right-aligned dates. The academic/engineer favorite.',
    'cv-aurum-cambridge',
    true,
    68
  ),
  (
    'Vector',
    'imported',
    'The beloved single-column tech format (Jake''s Resume lineage): small-caps ruled headings, italic roles, ruthless ATS clarity. A favorite for software roles.',
    'cv-aurum-vector',
    true,
    69
  ),
  (
    'Frost',
    'imported',
    'Maximum whitespace, no chrome. Lets the words carry the page.',
    'cv-aurum-frost',
    true,
    70
  ),
  (
    'Sterling',
    'imported',
    'Senior, authoritative. Playfair headings over a clean body.',
    'cv-aurum-sterling',
    true,
    71
  ),
  (
    'Vertex',
    'imported',
    'A vertical timeline rail threads your experience into a story.',
    'cv-aurum-vertex',
    true,
    72
  ),
  (
    'Apex',
    'imported',
    'Dark sidebar for skills & contact, generous main column for impact.',
    'cv-aurum-apex',
    true,
    73
  ),
  (
    'Prism',
    'imported',
    'A bold color sidebar. Confident, contemporary, memorable.',
    'cv-aurum-prism',
    true,
    74
  ),
  (
    'Linen',
    'imported',
    'A soft right sidebar keeps the focus on your story, then your skills.',
    'cv-aurum-linen',
    true,
    75
  ),
  (
    'Quartz',
    'imported',
    'Dense and efficient. Fits a deep career on a single page.',
    'cv-aurum-quartz',
    true,
    76
  ),
  (
    'Lumière',
    'imported',
    'Refined Garamond with airy spacing. Quietly luxurious.',
    'cv-aurum-lumiere',
    true,
    77
  ),
  (
    'Editorial',
    'imported',
    'Editorial gutter headings. Magazine-grade structure.',
    'cv-aurum-editorial',
    true,
    78
  ),
  (
    'Terminal',
    'imported',
    'Monospace headings and skill tags. Built for engineers.',
    'cv-aurum-terminal',
    true,
    79
  ),
  (
    'Scholar',
    'imported',
    'Academic, Times-set, single column. The gold standard for tradition.',
    'cv-aurum-scholar',
    true,
    80
  ),
  (
    'Onyx',
    'imported',
    'Monochrome and architectural. Quiet confidence in black and white.',
    'cv-aurum-onyx',
    true,
    81
  ),
  (
    'Academia',
    'imported',
    'A scholarly serif CV with room for publications. Built for academia.',
    'cv-aurum-academia',
    true,
    82
  ),
  (
    'Verdant',
    'imported',
    'A calm green sidebar. Fresh, friendly, and easy to read.',
    'cv-aurum-verdant',
    true,
    83
  ),
  (
    'Sienna',
    'imported',
    'Warm Spectral serif with terracotta accents. Editorial and inviting.',
    'cv-aurum-sienna',
    true,
    84
  ),
  (
    'Newton',
    'imported',
    'A scholarly, LaTeX-style single column. Serif, centered, timeless.',
    'cv-aurum-newton',
    true,
    85
  ),
  (
    'Deedy',
    'imported',
    'The iconic two-column résumé — tight, bold, and recruiter-loved.',
    'cv-aurum-deedy',
    true,
    86
  ),
  (
    'Slate',
    'imported',
    'Editorial gutter headings in cool teal. Quiet, confident, modern.',
    'cv-aurum-slate',
    true,
    87
  ),
  (
    'Mercury',
    'imported',
    'Corporate navy with Playfair headings. Executive and trustworthy.',
    'cv-aurum-mercury',
    true,
    88
  ),
  (
    'Halcyon',
    'imported',
    'A calm cyan sidebar with a photo. Friendly, fresh, easy to scan.',
    'cv-aurum-halcyon',
    true,
    89
  ),
  (
    'Graphite',
    'imported',
    'Monochrome ink with accent bars. Sharp, structured, engineer-ready.',
    'cv-aurum-graphite',
    true,
    90
  ),
  (
    'Portrait',
    'imported',
    'Photo-forward with a deep sidebar. A personal, memorable first impression.',
    'cv-aurum-portrait',
    true,
    91
  ),
  (
    'Mono',
    'imported',
    'Stark black-on-white minimalism. Pure typography, zero noise.',
    'cv-aurum-mono',
    true,
    92
  ),
  (
    'Opal',
    'imported',
    'A soft pastel sidebar with a photo. Calm, polished, approachable.',
    'cv-aurum-opal',
    true,
    93
  ),
  (
    'Azurill',
    'imported',
    'Reactive Resume''s signature: a clean two-column layout with a light sidebar, blue accent and a serif body. Balanced, readable, and fast to scan.',
    'rr-azurill',
    true,
    94
  ),
  (
    'Bronzor',
    'imported',
    'A calm, minimal single-column with a bronze accent bar and generous whitespace. Clean lines, muted palette.',
    'rr-bronzor',
    true,
    95
  ),
  (
    'Ditgar',
    'imported',
    'Bold editorial single-column with a deep ink palette and strong serif headings. Confident and structured.',
    'rr-ditgar',
    true,
    96
  ),
  (
    'Ditto',
    'imported',
    'A soft, neutral layout with a purple accent — adaptable to any field. Clean single-column structure.',
    'rr-ditto',
    true,
    97
  ),
  (
    'Glalie',
    'imported',
    'Cool slate-blue single-column with a crisp top border. Clean, technical, and easy on the eyes.',
    'rr-glalie',
    true,
    98
  ),
  (
    'Kakuna',
    'imported',
    'Warm amber two-column with a tinted sidebar and pill skills. Approachable and distinct.',
    'rr-kakuna',
    true,
    99
  ),
  (
    'Lapras',
    'imported',
    'A large-name, ice-blue single column with soft card sections. Spacious and modern.',
    'rr-lapras',
    true,
    100
  ),
  (
    'Meowth',
    'imported',
    'Two-column with a warm gold accent and a light sidebar. A confident, distinctive take.',
    'rr-meowth',
    true,
    101
  ),
  (
    'Rhyhorn',
    'imported',
    'Grounded terracotta single-column with sturdy serif headings. Reliable and professional.',
    'rr-rhyhorn',
    true,
    102
  ),
  (
    'Scizor',
    'imported',
    'Sharp red single-column with a crisp top accent. Precise, technical, and clean.',
    'rr-scizor',
    true,
    103
  ),
  (
    'Resumake Plain',
    'imported',
    'A plain LaTeX article resume: centered small-caps name, dotted separators, classic ruled sections. The timeless default.',
    'rm-article',
    true,
    104
  ),
  (
    'Awesome CV',
    'imported',
    'Resumake''s AwesomeCV port: a bold two-column with a colored left rail, uppercase name, and icon-driven sections.',
    'rm-awesome-cv',
    true,
    105
  ),
  (
    'Deedy Classic',
    'imported',
    'The famous Deedy layout: clean serif, two-column with a left sidebar, uppercase section rules and a single accent.',
    'rm-deedy',
    true,
    106
  ),
  (
    'Jake''s Resume',
    'imported',
    'The legendary Jake''s Resume single column: serif, bold name, small-caps headers. Software engineers'' favorite.',
    'rm-jakes-resume',
    true,
    107
  ),
  (
    'ModernCV',
    'imported',
    'ModernCV''s structured single column: uppercase name band, tinted section bars, and tight entries.',
    'rm-moderncv',
    true,
    108
  ),
  (
    'McDowell',
    'imported',
    'McDowellCV''s clean professional layout: navy accent, ruled headings, right-aligned dates. Recruiter-tested.',
    'rm-mcdowell',
    true,
    109
  ),
  (
    'Resumake Serif',
    'imported',
    'A classic serif article resume with centered name and generous line spacing. Quiet, formal, timeless.',
    'rm-article-serif',
    true,
    110
  ),
  (
    'Resumake Tech',
    'imported',
    'A compact article variant tuned for engineers: dense entries, mono accent, and clean rule headers.',
    'rm-article-tech',
    true,
    111
  ),
  (
    'Resumake Minimal',
    'imported',
    'The lightest resumake article: thin rules, muted labels, maximum whitespace. Nothing but content.',
    'rm-article-minimal',
    true,
    112
  ),
  (
    'RenderCV Classic',
    'imported',
    'RenderCV''s original classic theme: serif body, centered name, full-line section rules, right-aligned details. Academic-grade.',
    'rc-classic',
    true,
    113
  ),
  (
    'Engineering Classic',
    'imported',
    'RenderCV''s engineering-classic theme: Raleway sans-serif, left-aligned name, full-line section rules. Engineer-friendly.',
    'rc-engineeringclassic',
    true,
    114
  ),
  (
    'Engineering Resumes',
    'imported',
    'The beloved engineering-resumes theme: serif, pipe-separated contact, full-line rules. The all-time GitHub favorite.',
    'rc-engineeringresumes',
    true,
    115
  ),
  (
    'RenderCV Harvard',
    'imported',
    'RenderCV''s Harvard theme: pure black on white, serif, centered header with a full-width rule. Maximally formal.',
    'rc-harvard',
    true,
    116
  ),
  (
    'SB2Nov',
    'imported',
    'SB2Nov''s famous resume theme: Computer Modern serif, underlined links, full-line section rules. The template everyone starts with.',
    'rc-sb2nov',
    true,
    117
  ),
  (
    'Ember',
    'imported',
    'RenderCV''s Ember theme: warm Gentium serif name over Ubuntu body with justified text. Cozy and elegant.',
    'rc-ember',
    true,
    118
  ),
  (
    'Ink',
    'imported',
    'RenderCV''s Ink theme: EB Garamond throughout, justified text, no icons. Editorially serene.',
    'rc-ink',
    true,
    119
  ),
  (
    'RenderCV ModernCV',
    'imported',
    'RenderCV''s ModernCV theme: Fontin serif with a left-aligned header, photo slot, and clean section bars.',
    'rc-moderncv',
    true,
    120
  ),
  (
    'RenderCV Opal',
    'imported',
    'RenderCV''s Opal theme: Lato sans with generous margins and a clean, friendly header. Simple and effective.',
    'rc-opal',
    true,
    121
  ),
  (
    'Open Resume Blue',
    'imported',
    'Open Resume''s clean single column in its signature sky blue — bold name, thin rules, tight, modern.',
    'or-blue',
    true,
    122
  ),
  (
    'Open Resume Green',
    'imported',
    'Open Resume''s clean single column in a fresh emerald accent. Crisp and recruiter-friendly.',
    'or-green',
    true,
    123
  ),
  (
    'Open Resume Indigo',
    'imported',
    'Open Resume''s clean single column in a confident indigo. Professional, modern, universally readable.',
    'or-indigo',
    true,
    124
  ),
  (
    'Executive Band',
    'imported',
    'A thin colored band crowns the page, then a letterspaced serif masthead, split contact and numbered uppercase headers. Quiet power with one stripe of color — a distinct executive silhouette.',
    'fb-exec-band',
    true,
    125
  ),
  (
    'Showcase',
    'imported',
    'Portfolio-first two-column: a photo-led sidebar carries your identity and skills while the main column becomes a project case-study grid. Built for designers who need the work to speak first.',
    'fb-showcase',
    true,
    126
  ),
  (
    'Mono Grid',
    'imported',
    'An asymmetric two-column grid with monospace labels, geometric side rules and numbered sections. The resume as a designed artifact for art directors and editorial designers.',
    'fb-mono-grid',
    true,
    127
  ),
  (
    'Color Field',
    'imported',
    'One bold color band, generous whitespace and a confident minimal sans hierarchy. Color is the message — a designer-friendly middle ground between safe and portfolio.',
    'fb-color-field',
    true,
    128
  ),
  (
    'Abey Resume',
    'imported',
    'Clean single-column fresher resume: centered contact header, serif headings under horizontal rules, and bullet-driven sections for Education, Coursework/Skills, Projects, Internship, Technical Skills, Extracurricular and Certifications. Simple, professional, and ATS-clean.',
    'ol-abey',
    true,
    129
  ),
  (
    'Ashley McGee Short Résumé',
    'imported',
    'The classic short résumé: a compact one-pager with a centered serif masthead, ALL-CAPS section headers under full hairlines (Education, Projects, Computer Skills, Experience) and dot-separated contact. Pure black on white — the LaTeX article default done right.',
    'ol-ashley',
    true,
    130
  ) ON CONFLICT (component_key) DO
UPDATE
SET name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = true,
  sort_order = EXCLUDED.sort_order;
-- 4. Reconcile rows from an earlier import iteration (old key scheme) so the
-- catalog matches the app exactly. Only touches keys that are no longer part
-- of the catalog; admin-created rows with other keys are left untouched.
DELETE FROM templates
WHERE (
    component_key LIKE 'aurum-%'
    OR component_key LIKE 'reactive-%'
    OR component_key LIKE 'rendercv-%'
    OR component_key LIKE 'resumake-%'
  );