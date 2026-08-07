import type { ImportedTemplateConfig } from "./types";

/**
 * Templates transcribed from Overleaf-published LaTeX designs.
 *
 * Both entries are faithful transcriptions of the original LaTeX layouts into
 * the data-driven config shape the generic renderer consumes:
 *  - "Abey Resume" by Abey George — a clean single-column fresher resume
 *    (serif headings, horizontal section rules, centered contact header).
 *  - "Ashley McGee's Short Résumé" — the classic compact one-pager
 *    (centered serif masthead, ALL-CAPS section headers, black on white).
 */
export const OVERLEAF_TEMPLATES: ImportedTemplateConfig[] = [
  {
    id: "ol-abey",
    name: "Abey Resume",
    source: "overleaf",
    description: "Clean single-column fresher resume: centered contact header, serif headings under horizontal rules, and bullet-driven sections for Education, Coursework/Skills, Projects, Internship, Technical Skills, Extracurricular and Certifications. Simple, professional, and ATS-clean.",
    tags: ["ats-safe", "single-column", "classic", "student"],
    atsScore: 96,
    header: "centered",
    section: "underline",
    skills: "inline",
    sectionIcons: false,
    theme: { primary: "#1f2937", text: "#1a1a1a", muted: "#52525b" },
    typography: { fontFamily: "Tinos", headingFamily: "Tinos", nameFamily: "Tinos", fontSize: 9.8, lineHeight: 1.38, letterSpacing: 0, headingScale: 1.55, uppercaseHeadings: false },
    layout: { columns: 1, icons: false, sectionGap: 10, itemGap: 6 },
  },
  {
    id: "ol-ashley",
    name: "Ashley McGee Short Résumé",
    source: "overleaf",
    description: "The classic short résumé: a compact one-pager with a centered serif masthead, ALL-CAPS section headers under full hairlines (Education, Projects, Computer Skills, Experience) and dot-separated contact. Pure black on white — the LaTeX article default done right.",
    tags: ["ats-safe", "single-column", "classic", "minimal"],
    atsScore: 97,
    header: "centered",
    section: "rule-after",
    skills: "inline",
    sectionIcons: false,
    theme: { primary: "#000000", text: "#111111", muted: "#3f3f3f" },
    typography: { fontFamily: "Latin Modern Roman", headingFamily: "Latin Modern Roman", nameFamily: "Latin Modern Roman", fontSize: 10, lineHeight: 1.32, letterSpacing: 0, headingScale: 1.5, uppercaseHeadings: true },
    layout: { columns: 1, icons: false, sectionGap: 10, itemGap: 6 },
  },
];
