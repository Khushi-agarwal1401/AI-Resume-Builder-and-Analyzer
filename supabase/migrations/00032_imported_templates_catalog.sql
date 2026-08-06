-- Imported template catalog: 96 total designs (8 built-in + 88 imported
-- from CVAurum, reactive-resume, resumake.io, rendercv, and open-resume).
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
ALTER TABLE templates ADD CONSTRAINT templates_category_check
  CHECK (category IN ('ats-professional', 'modern', 'minimal', 'executive', 'student', 'creative', 'executive-sidebar', 'modern-card', 'imported'));

-- 3. Seed the 88 imported templates (idempotent via component_key UNIQUE).
INSERT INTO templates (name, category, description, component_key, is_active, sort_order)
VALUES
(name, category, description, component_key, is_active, sort_order) VALUES ('Clarity', 'imported', 'The modern professional standard: heavy ruled headings, dotted entry dividers, accent-blue employers, a right rail on white, score blocks for education, and underlined skill tags. Rich, structured, endlessly scannable.', 'cv-aurum-clarity', true, 50),
(name, category, description, component_key, is_active, sort_order) VALUES ('Obsidian', 'imported', 'Layered blacks, tactile entry cards, and tracked gold labels — a dark, luxury-fintech aesthetic. Every word stays selectable text, so the drama costs nothing in parsing.', 'cv-aurum-obsidian', true, 51),
(name, category, description, component_key, is_active, sort_order) VALUES ('Onyx Noir', 'imported', 'A full-bleed charcoal résumé with an electric-teal accent and crisp white type — the dark, high-contrast look that turns heads. Selectable text throughout, so it still reads clean for ATS.', 'cv-aurum-onyx-noir', true, 52),
(name, category, description, component_key, is_active, sort_order) VALUES ('Cascade', 'imported', 'A confident two-column with a deep-teal sidebar carrying your photo, skills and languages, and a clean white main column for experience. Bold, colorful, instantly modern.', 'cv-aurum-cascade', true, 53),
(name, category, description, component_key, is_active, sort_order) VALUES ('Sapphire', 'imported', 'Corporate two-column with a deep-navy sidebar, a squared photo, and dot-meter skills — the polished, recruiter-ready look that dominates modern builders.', 'cv-aurum-sapphire', true, 54),
(name, category, description, component_key, is_active, sort_order) VALUES ('Garnet', 'imported', 'A warm, editorial two-column with a burgundy sidebar on the right, a rounded photo, and bar-meter skills — distinctive and premium without shouting.', 'cv-aurum-garnet', true, 55),
(name, category, description, component_key, is_active, sort_order) VALUES ('Initials', 'imported', 'Monogram-led two-column: your initials in a diamond badge atop a deep sidebar, with a crisp white main column. Distinctive, confident, unmistakably modern.', 'cv-aurum-initials', true, 56),
(name, category, description, component_key, is_active, sort_order) VALUES ('Emblem', 'imported', 'A centered single-column with a circular monogram crest over a tracked serif name — formal, balanced, and ruthlessly ATS-clean.', 'cv-aurum-emblem', true, 57),
(name, category, description, component_key, is_active, sort_order) VALUES ('Verde', 'imported', 'Fresh two-column with a forest-green sidebar, a circular photo, and skill pills — natural, modern, approachable.', 'cv-aurum-verde', true, 58),
(name, category, description, component_key, is_active, sort_order) VALUES ('Onyx Gold', 'imported', 'The charcoal résumé in warm gold — the same bold dark canvas with a luxe amber accent. Selectable text, ATS-clean.', 'cv-aurum-onyx-gold', true, 59),
(name, category, description, component_key, is_active, sort_order) VALUES ('Pinnacle', 'imported', 'Executive two-column: a circular monogram over a charcoal sidebar, dot-meter skills, and a clean main column.', 'cv-aurum-pinnacle', true, 60),
(name, category, description, component_key, is_active, sort_order) VALUES ('Crest', 'imported', 'Traditional single-column with a squared monogram crest, centered serif name, and ruled headings — formal and ATS-perfect.', 'cv-aurum-crest', true, 61),
(name, category, description, component_key, is_active, sort_order) VALUES ('Ribbon', 'imported', 'A bold full-width color banner masthead over a clean single column — striking and modern, every word still selectable.', 'cv-aurum-ribbon', true, 62),
(name, category, description, component_key, is_active, sort_order) VALUES ('Orchid', 'imported', 'A refined two-column with a plum sidebar on the right, a rounded photo, and bar-meter skills — distinctive and warm.', 'cv-aurum-orchid', true, 63),
(name, category, description, component_key, is_active, sort_order) VALUES ('Aurum', 'imported', 'The signature design: editorial ink layout with a serif name and a hairline gold accent — premium and unmistakably yours, still fully ATS-safe.', 'cv-aurum-aurum', true, 64),
(name, category, description, component_key, is_active, sort_order) VALUES ('Aurum Editorial', 'imported', 'Editorial gold: Cormorant serif headings, a small-caps gold name, and a single hairline gold rule under each heading. Magazine-grade and premium.', 'cv-aurum-aurum-editorial', true, 65),
(name, category, description, component_key, is_active, sort_order) VALUES ('Swiss Aurum', 'imported', 'Swiss-modernist grid: Inter, generous white space, tracked caps labels with a gold tick. Crisp, contemporary, unmistakably premium.', 'cv-aurum-swiss-aurum', true, 66),
(name, category, description, component_key, is_active, sort_order) VALUES ('Atelier', 'imported', 'Couture editorial: a Playfair serif name over a gold monospace tagline, gold gutter labels, and a single gold accent tick. Jewellery-grade — the one that turns heads.', 'cv-aurum-atelier', true, 67),
(name, category, description, component_key, is_active, sort_order) VALUES ('Harvard', 'imported', 'The classic Harvard format recruiters know: centered serif name, bold uppercase section rules, impeccable structure. Pure black, maximally ATS.', 'cv-aurum-harvard', true, 68),
(name, category, description, component_key, is_active, sort_order) VALUES ('Garamond', 'imported', 'The timeless Garamond résumé recruiters trust — a bold old-style serif name, clean ruled sections, impeccable single-column structure. Classic and ATS-perfect.', 'cv-aurum-garamond', true, 69),
(name, category, description, component_key, is_active, sort_order) VALUES ('Aria', 'imported', 'Clean single-column with a confident accent. The safe, sharp default.', 'cv-aurum-aria', true, 70),
(name, category, description, component_key, is_active, sort_order) VALUES ('Oxford', 'imported', 'Timeless serif résumé. Conservative, recruiter-friendly, ATS-perfect.', 'cv-aurum-oxford', true, 71),
(name, category, description, component_key, is_active, sort_order) VALUES ('Cambridge', 'imported', 'RenderCV-grade clean layout: Source Sans, navy accent, ruled headings, right-aligned dates. The academic/engineer favorite.', 'cv-aurum-cambridge', true, 72),
(name, category, description, component_key, is_active, sort_order) VALUES ('Vector', 'imported', 'The beloved single-column tech format (Jake''''s Resume lineage): small-caps ruled headings, italic roles, ruthless ATS clarity. A favorite for software roles.', 'cv-aurum-vector', true, 73),
(name, category, description, component_key, is_active, sort_order) VALUES ('Frost', 'imported', 'Maximum whitespace, no chrome. Lets the words carry the page.', 'cv-aurum-frost', true, 74),
(name, category, description, component_key, is_active, sort_order) VALUES ('Sterling', 'imported', 'Senior, authoritative. Playfair headings over a clean body.', 'cv-aurum-sterling', true, 75),
(name, category, description, component_key, is_active, sort_order) VALUES ('Vertex', 'imported', 'A vertical timeline rail threads your experience into a story.', 'cv-aurum-vertex', true, 76),
(name, category, description, component_key, is_active, sort_order) VALUES ('Apex', 'imported', 'Dark sidebar for skills & contact, generous main column for impact.', 'cv-aurum-apex', true, 77),
(name, category, description, component_key, is_active, sort_order) VALUES ('Prism', 'imported', 'A bold color sidebar. Confident, contemporary, memorable.', 'cv-aurum-prism', true, 78),
(name, category, description, component_key, is_active, sort_order) VALUES ('Linen', 'imported', 'A soft right sidebar keeps the focus on your story, then your skills.', 'cv-aurum-linen', true, 79),
(name, category, description, component_key, is_active, sort_order) VALUES ('Quartz', 'imported', 'Dense and efficient. Fits a deep career on a single page.', 'cv-aurum-quartz', true, 80),
(name, category, description, component_key, is_active, sort_order) VALUES ('Lumière', 'imported', 'Refined Garamond with airy spacing. Quietly luxurious.', 'cv-aurum-lumiere', true, 81),
(name, category, description, component_key, is_active, sort_order) VALUES ('Editorial', 'imported', 'Editorial gutter headings. Magazine-grade structure.', 'cv-aurum-editorial', true, 82),
(name, category, description, component_key, is_active, sort_order) VALUES ('Marquee', 'imported', 'A full-width color banner sets a bold, confident tone.', 'cv-aurum-marquee', true, 83),
(name, category, description, component_key, is_active, sort_order) VALUES ('Terminal', 'imported', 'Monospace headings and skill tags. Built for engineers.', 'cv-aurum-terminal', true, 84),
(name, category, description, component_key, is_active, sort_order) VALUES ('Nova', 'imported', 'Vivid sidebar, photo, and rounded tags. Stand out tastefully.', 'cv-aurum-nova', true, 85),
(name, category, description, component_key, is_active, sort_order) VALUES ('Scholar', 'imported', 'Academic, Times-set, single column. The gold standard for tradition.', 'cv-aurum-scholar', true, 86),
(name, category, description, component_key, is_active, sort_order) VALUES ('Onyx', 'imported', 'Monochrome and architectural. Quiet confidence in black and white.', 'cv-aurum-onyx', true, 87),
(name, category, description, component_key, is_active, sort_order) VALUES ('Cobalt', 'imported', 'A bold cobalt banner and crisp tags. Modern and high-energy.', 'cv-aurum-cobalt', true, 88),
(name, category, description, component_key, is_active, sort_order) VALUES ('Academia', 'imported', 'A scholarly serif CV with room for publications. Built for academia.', 'cv-aurum-academia', true, 89),
(name, category, description, component_key, is_active, sort_order) VALUES ('Verdant', 'imported', 'A calm green sidebar. Fresh, friendly, and easy to read.', 'cv-aurum-verdant', true, 90),
(name, category, description, component_key, is_active, sort_order) VALUES ('Sienna', 'imported', 'Warm Spectral serif with terracotta accents. Editorial and inviting.', 'cv-aurum-sienna', true, 91),
(name, category, description, component_key, is_active, sort_order) VALUES ('Newton', 'imported', 'A scholarly, LaTeX-style single column. Serif, centered, timeless.', 'cv-aurum-newton', true, 92),
(name, category, description, component_key, is_active, sort_order) VALUES ('Deedy', 'imported', 'The iconic two-column résumé — tight, bold, and recruiter-loved.', 'cv-aurum-deedy', true, 93),
(name, category, description, component_key, is_active, sort_order) VALUES ('Slate', 'imported', 'Editorial gutter headings in cool teal. Quiet, confident, modern.', 'cv-aurum-slate', true, 94),
(name, category, description, component_key, is_active, sort_order) VALUES ('Mercury', 'imported', 'Corporate navy with Playfair headings. Executive and trustworthy.', 'cv-aurum-mercury', true, 95),
(name, category, description, component_key, is_active, sort_order) VALUES ('Halcyon', 'imported', 'A calm cyan sidebar with a photo. Friendly, fresh, easy to scan.', 'cv-aurum-halcyon', true, 96),
(name, category, description, component_key, is_active, sort_order) VALUES ('Graphite', 'imported', 'Monochrome ink with accent bars. Sharp, structured, engineer-ready.', 'cv-aurum-graphite', true, 97),
(name, category, description, component_key, is_active, sort_order) VALUES ('Portrait', 'imported', 'Photo-forward with a deep sidebar. A personal, memorable first impression.', 'cv-aurum-portrait', true, 98),
(name, category, description, component_key, is_active, sort_order) VALUES ('Spotlight', 'imported', 'A bold color banner with your photo. Confident and contemporary.', 'cv-aurum-spotlight', true, 99),
(name, category, description, component_key, is_active, sort_order) VALUES ('Mono', 'imported', 'Stark black-on-white minimalism. Pure typography, zero noise.', 'cv-aurum-mono', true, 100),
(name, category, description, component_key, is_active, sort_order) VALUES ('Opal', 'imported', 'A soft pastel sidebar with a photo. Calm, polished, approachable.', 'cv-aurum-opal', true, 101),
(name, category, description, component_key, is_active, sort_order) VALUES ('Azurill', 'imported', 'Reactive Resume''''s signature: a clean two-column layout with a light sidebar, blue accent and a serif body. Balanced, readable, and fast to scan.', 'rr-azurill', true, 102),
(name, category, description, component_key, is_active, sort_order) VALUES ('Bronzor', 'imported', 'A calm, minimal single-column with a bronze accent bar and generous whitespace. Clean lines, muted palette.', 'rr-bronzor', true, 103),
(name, category, description, component_key, is_active, sort_order) VALUES ('Chikorita', 'imported', 'Fresh green accents and friendly rounded type. A two-column layout that keeps skills in a light sidebar.', 'rr-chikorita', true, 104),
(name, category, description, component_key, is_active, sort_order) VALUES ('Ditgar', 'imported', 'Bold editorial single-column with a deep ink palette and strong serif headings. Confident and structured.', 'rr-ditgar', true, 105),
(name, category, description, component_key, is_active, sort_order) VALUES ('Ditto', 'imported', 'A soft, neutral layout with a purple accent — adaptable to any field. Clean single-column structure.', 'rr-ditto', true, 106),
(name, category, description, component_key, is_active, sort_order) VALUES ('Gengar', 'imported', 'Moody two-column with a deep purple sidebar and light main column. Distinctive and modern.', 'rr-gengar', true, 107),
(name, category, description, component_key, is_active, sort_order) VALUES ('Glalie', 'imported', 'Cool slate-blue single-column with a crisp top border. Clean, technical, and easy on the eyes.', 'rr-glalie', true, 108),
(name, category, description, component_key, is_active, sort_order) VALUES ('Kakuna', 'imported', 'Warm amber two-column with a tinted sidebar and pill skills. Approachable and distinct.', 'rr-kakuna', true, 109),
(name, category, description, component_key, is_active, sort_order) VALUES ('Lapras', 'imported', 'A large-name, ice-blue single column with soft card sections. Spacious and modern.', 'rr-lapras', true, 110),
(name, category, description, component_key, is_active, sort_order) VALUES ('Leafish', 'imported', 'Fresh green single-column with soft tinted headings. Natural, friendly, and clean.', 'rr-leafish', true, 111),
(name, category, description, component_key, is_active, sort_order) VALUES ('Meowth', 'imported', 'Two-column with a warm gold accent and a light sidebar. A confident, distinctive take.', 'rr-meowth', true, 112),
(name, category, description, component_key, is_active, sort_order) VALUES ('Onyx', 'imported', 'A charcoal two-column with a dark sidebar and crisp white main text. Sharp, high-contrast, modern.', 'rr-onyx', true, 113),
(name, category, description, component_key, is_active, sort_order) VALUES ('Pikachu', 'imported', 'Cheerful yellow-accent two-column with a soft sidebar. Bold, memorable, and friendly.', 'rr-pikachu', true, 114),
(name, category, description, component_key, is_active, sort_order) VALUES ('Rhyhorn', 'imported', 'Grounded terracotta single-column with sturdy serif headings. Reliable and professional.', 'rr-rhyhorn', true, 115),
(name, category, description, component_key, is_active, sort_order) VALUES ('Scizor', 'imported', 'Sharp red single-column with a crisp top accent. Precise, technical, and clean.', 'rr-scizor', true, 116),
(name, category, description, component_key, is_active, sort_order) VALUES ('Resumake Plain', 'imported', 'A plain LaTeX article resume: centered small-caps name, dotted separators, classic ruled sections. The timeless default.', 'rm-article', true, 117),
(name, category, description, component_key, is_active, sort_order) VALUES ('Awesome CV', 'imported', 'Resumake''''s AwesomeCV port: a bold two-column with a colored left rail, uppercase name, and icon-driven sections.', 'rm-awesome-cv', true, 118),
(name, category, description, component_key, is_active, sort_order) VALUES ('Deedy Classic', 'imported', 'The famous Deedy layout: clean serif, two-column with a left sidebar, uppercase section rules and a single accent.', 'rm-deedy', true, 119),
(name, category, description, component_key, is_active, sort_order) VALUES ('Jake''''s Resume', 'imported', 'The legendary Jake''''s Resume single column: serif, bold name, small-caps headers. Software engineers'''' favorite.', 'rm-jakes-resume', true, 120),
(name, category, description, component_key, is_active, sort_order) VALUES ('ModernCV', 'imported', 'ModernCV''''s structured single column: uppercase name band, tinted section bars, and tight entries.', 'rm-moderncv', true, 121),
(name, category, description, component_key, is_active, sort_order) VALUES ('McDowell', 'imported', 'McDowellCV''''s clean professional layout: navy accent, ruled headings, right-aligned dates. Recruiter-tested.', 'rm-mcdowell', true, 122),
(name, category, description, component_key, is_active, sort_order) VALUES ('Resumake Serif', 'imported', 'A classic serif article resume with centered name and generous line spacing. Quiet, formal, timeless.', 'rm-article-serif', true, 123),
(name, category, description, component_key, is_active, sort_order) VALUES ('Resumake Tech', 'imported', 'A compact article variant tuned for engineers: dense entries, mono accent, and clean rule headers.', 'rm-article-tech', true, 124),
(name, category, description, component_key, is_active, sort_order) VALUES ('Resumake Minimal', 'imported', 'The lightest resumake article: thin rules, muted labels, maximum whitespace. Nothing but content.', 'rm-article-minimal', true, 125),
(name, category, description, component_key, is_active, sort_order) VALUES ('RenderCV Classic', 'imported', 'RenderCV''''s original classic theme: serif body, centered name, full-line section rules, right-aligned details. Academic-grade.', 'rc-classic', true, 126),
(name, category, description, component_key, is_active, sort_order) VALUES ('Engineering Classic', 'imported', 'RenderCV''''s engineering-classic theme: Raleway sans-serif, left-aligned name, full-line section rules. Engineer-friendly.', 'rc-engineeringclassic', true, 127),
(name, category, description, component_key, is_active, sort_order) VALUES ('Engineering Resumes', 'imported', 'The beloved engineering-resumes theme: serif, pipe-separated contact, full-line rules. The all-time GitHub favorite.', 'rc-engineeringresumes', true, 128),
(name, category, description, component_key, is_active, sort_order) VALUES ('RenderCV Harvard', 'imported', 'RenderCV''''s Harvard theme: pure black on white, serif, centered header with a full-width rule. Maximally formal.', 'rc-harvard', true, 129),
(name, category, description, component_key, is_active, sort_order) VALUES ('SB2Nov', 'imported', 'SB2Nov''''s famous resume theme: Computer Modern serif, underlined links, full-line section rules. The template everyone starts with.', 'rc-sb2nov', true, 130),
(name, category, description, component_key, is_active, sort_order) VALUES ('Ember', 'imported', 'RenderCV''''s Ember theme: warm Gentium serif name over Ubuntu body with justified text. Cozy and elegant.', 'rc-ember', true, 131),
(name, category, description, component_key, is_active, sort_order) VALUES ('Ink', 'imported', 'RenderCV''''s Ink theme: EB Garamond throughout, justified text, no icons. Editorially serene.', 'rc-ink', true, 132),
(name, category, description, component_key, is_active, sort_order) VALUES ('RenderCV ModernCV', 'imported', 'RenderCV''''s ModernCV theme: Fontin serif with a left-aligned header, photo slot, and clean section bars.', 'rc-moderncv', true, 133),
(name, category, description, component_key, is_active, sort_order) VALUES ('RenderCV Opal', 'imported', 'RenderCV''''s Opal theme: Lato sans with generous margins and a clean, friendly header. Simple and effective.', 'rc-opal', true, 134),
(name, category, description, component_key, is_active, sort_order) VALUES ('Open Resume Blue', 'imported', 'Open Resume''''s clean single column in its signature sky blue — bold name, thin rules, tight, modern.', 'or-blue', true, 135),
(name, category, description, component_key, is_active, sort_order) VALUES ('Open Resume Green', 'imported', 'Open Resume''''s clean single column in a fresh emerald accent. Crisp and recruiter-friendly.', 'or-green', true, 136),
(name, category, description, component_key, is_active, sort_order) VALUES ('Open Resume Indigo', 'imported', 'Open Resume''''s clean single column in a confident indigo. Professional, modern, universally readable.', 'or-indigo', true, 137)
ON CONFLICT (component_key) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  description = EXCLUDED.description,
  is_active = true,
  sort_order = EXCLUDED.sort_order;
