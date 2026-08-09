/**
 * Shared LaTeX utilities for resume export.
 * Provides escaping, helpers, and common formatting functions.
 */

// ── LaTeX Special Character Escaping ─────────────────────────────────────────

/**
 * Escapes a string for safe inclusion in LaTeX.
 * Handles all special characters: \ & % $ # _ { } ~ ^
 */
export function latexEscape(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}")
    .replace(/\\textbackslash\{\}\\&/g, "\\textbackslash{} &"); // Fix double-escaped ampersand
}

/**
 * Escapes a URL for use in \href or \url.
 * Preserves URL structure while escaping LaTeX special chars.
 */
export function latexUrl(url: string): string {
  if (!url) return "";
  // First escape backslashes, then other special chars
  return url
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

/**
 * Escapes text for use inside \text{} or similar commands.
 * More aggressive escaping for text content.
 */
export function latexText(text: string): string {
  return latexEscape(text);
}

/**
 * Returns the value if present, otherwise empty string.
 * Useful for optional fields.
 */
export function latexOptional(value: string | undefined | null): string {
  return value ? latexEscape(value) : "";
}

/**
 * Formats a date range for LaTeX.
 */
export function latexDateRange(
  start: string,
  end: string,
  current?: boolean
): string {
  const startEscaped = latexEscape(start);
  const endEscaped = current ? "Present" : latexEscape(end);
  return `${startEscaped} -- ${endEscaped}`;
}

/**
 * Creates a LaTeX bullet list from an array of strings.
 */
export function latexBulletList(items: string[]): string {
  if (!items.length) return "";
  const escapedItems = items.map((item) => `\\item ${latexEscape(item)}`).join("\n");
  return `\\begin{itemize}\n${escapedItems}\n\\end{itemize}`;
}

/**
 * Creates a LaTeX section heading with optional accent color.
 */
export function latexSection(
  title: string,
  accentColor?: string
): string {
  const escapedTitle = latexEscape(title.toUpperCase());
  if (accentColor) {
    return `\\section*{\\textcolor{accent}{${escapedTitle}}}`;
  }
  return `\\section*{${escapedTitle}}`;
}

/**
 * Creates a LaTeX subsection heading.
 */
export function latexSubsection(title: string): string {
  return `\\subsection*{${latexEscape(title)}}`;
}

/**
 * Formats a name with large, bold styling.
 */
export function latexName(name: string, accentColor?: string): string {
  const escaped = latexEscape(name);
  if (accentColor) {
    return `{\\LARGE \\textbf{\\textcolor{accent}{${escaped}}}}`;
  }
  return `{\\LARGE \\textbf{${escaped}}}`;
}

/**
 * Formats a role/title line.
 */
export function latexRole(role: string, accentColor?: string): string {
  const escaped = latexEscape(role);
  if (accentColor) {
    return `{\\large \\textbf{\\textcolor{accent}{${escaped}}}}`;
  }
  return `{\\large \\textbf{${escaped}}}`;
}

/**
 * Formats a company/institution line.
 */
export function latexCompany(company: string, location?: string): string {
  const parts = [latexEscape(company)];
  if (location) parts.push(latexEscape(location));
  return `\\textit{${parts.join(" \\textbullet\ ")}}`;
}

/**
 * Formats contact information line.
 */
export function latexContactLine(items: string[]): string {
  return items.map(latexEscape).join(" \\quad|\\quad ");
}

/**
 * Creates a horizontal rule with optional color.
 */
export function latexRule(accentColor?: string): string {
  if (accentColor) {
    return `{\\color{accent}\\hrule height 1.5pt}`;
  }
  return `\\hrule height 0.5pt`;
}

/**
 * Creates a thin hairline rule.
 */
export function latexHairline(): string {
  return `\\hrule height 0.25pt`;
}

/**
 * Formats a skill/category line.
 */
export function latexSkillLine(label: string, items: string[]): string {
  if (!items.length) return "";
  const escapedLabel = latexEscape(label);
  const escapedItems = items.map(latexEscape).join(", ");
  return `\\textbf{${escapedLabel}:} ${escapedItems}`;
}

/**
 * Formats a project technology list.
 */
export function latexTechList(techs: string[], accentColor?: string): string {
  if (!techs.length) return "";
  const escaped = techs.map((t) => {
    const e = latexEscape(t);
    if (accentColor) {
      return `{\\color{accent}${e}}`;
    }
    return e;
  }).join(", ");
  return `\\textit{Technologies:} ${escaped}`;
}

/**
 * Formats a certification line.
 */
export function latexCertification(
  name: string,
  issuer?: string,
  date?: string
): string {
  const parts = [latexEscape(name)];
  if (issuer) parts.push(`--- ${latexEscape(issuer)}`);
  if (date) parts.push(`(${latexEscape(date)})`);
  return parts.join(" ");
}

/**
 * Formats a language line.
 */
export function latexLanguage(name: string, proficiency: string): string {
  return `${latexEscape(name)} (${latexEscape(proficiency)})`;
}

/**
 * Formats an achievement line.
 */
export function latexAchievement(title: string, description?: string): string {
  const parts = [`\\textbf{${latexEscape(title)}}`];
  if (description) parts.push(`--- ${latexEscape(description)}`);
  return parts.join(" ");
}

/**
 * Formats a publication line.
 */
export function latexPublication(
  title: string,
  publisher?: string,
  date?: string,
  url?: string
): string {
  const parts = [`\\textit{${latexEscape(title)}}`];
  if (publisher) parts.push(latexEscape(publisher));
  if (date) parts.push(`(${latexEscape(date)})`);
  if (url) parts.push(`\\href{${latexUrl(url)}}{${latexUrl(url)}}`);
  return parts.join(" | ");
}

/**
 * Formats a coding profile line.
 */
export function latexCodingProfile(platform: string, handle: string, url?: string): string {
  const text = `${latexEscape(platform)}: ${latexEscape(handle)}`;
  if (url) {
    return `\\href{${latexUrl(url)}}{${text}}`;
  }
  return text;
}

/**
 * Wraps content in a minipage for two-column layouts.
 */
export function latexMinipage(width: string, content: string): string {
  return `\\begin{minipage}[t]{${width}}\n${content}\n\\end{minipage}`;
}

/**
 * Creates a two-column layout using paracol.
 */
export function latexTwoColumn(leftWidth: string, leftContent: string, rightContent: string): string {
  return `\\begin{paracol}{2}
\\setcolumnwidth{${leftWidth},}
${leftContent}
\\switchcolumn
${rightContent}
\\end{paracol}`;
}

/**
 * Adds vertical space.
 */
export function latexVspace(amount: string): string {
  return `\\vspace{${amount}}`;
}

/**
 * Adds small vertical space.
 */
export function latexSmallSkip(): string {
  return `\\smallskip`;
}

/**
 * Adds medium vertical space.
 */
export function latexMedSkip(): string {
  return `\\medskip`;
}

/**
 * Adds large vertical space.
 */
export function latexBigSkip(): string {
  return `\\bigskip`;
}

/**
 * Creates a centered block.
 */
export function latexCenter(content: string): string {
  return `\\begin{center}\n${content}\n\\end{center}`;
}

/**
 * Creates a flushright block.
 */
export function latexFlushRight(content: string): string {
  return `\\begin{flushright}\n${content}\n\\end{flushright}`;
}

/**
 * Creates a flushleft block.
 */
export function latexFlushLeft(content: string): string {
  return `\\begin{flushleft}\n${content}\n\\end{flushleft}`;
}

/**
 * Bold text.
 */
export function latexBold(text: string): string {
  return `\\textbf{${latexEscape(text)}}`;
}

/**
 * Italic text.
 */
export function latexItalic(text: string): string {
  return `\\textit{${latexEscape(text)}}`;
}

/**
 * Small caps text.
 */
export function latexSmallCaps(text: string): string {
  return `\\textsc{${latexEscape(text)}}`;
}

/**
 * Monospace text.
 */
export function latexMonospace(text: string): string {
  return `\\texttt{${latexEscape(text)}}`;
}

/**
 * Colored text (requires xcolor package).
 */
export function latexColor(color: string, text: string): string {
  return `{\\color{${color}}${latexEscape(text)}}`;
}

/**
 * Generates the LaTeX document preamble with common packages.
 */
export function latexPreamble(
  accentColor: string,
  fontFamily: "sans" | "serif" | "mono" = "sans",
  isTwoColumn: boolean = false
): string {
  const fontSetup = getFontSetup(fontFamily);
  const twoColumnPkg = isTwoColumn ? "\\usepackage{paracol}\n" : "";
  
  return `\\documentclass[10pt,a4paper]{article}
\\usepackage[margin=0.75in]{geometry}
\\usepackage{fontspec}
\\usepackage{xcolor}
\\usepackage{enumitem}
\\usepackage{titlesec}
${twoColumnPkg}
\\usepackage{multicol}
\\usepackage{hyperref}
\\usepackage{microtype}
\\usepackage{ragged2e}

% Font setup
${fontSetup}

% Colors
\\definecolor{accent}{HTML}{${accentColor.replace("#", "")}}
\\definecolor{muted}{HTML}{6B7280}
\\definecolor{heading}{HTML}{1F2937}
\\definecolor{body}{HTML}{374151}
\\definecolor{lightgray}{HTML}{E5E7EB}
\\definecolor{divider}{HTML}{D1D5DB}

% Hyperlink setup
\\hypersetup{
  colorlinks=true,
  linkcolor=accent,
  urlcolor=accent,
  citecolor=accent,
  pdfborder={0 0 0}
}

% Section formatting
\\titleformat{\\section}{\\large\\bfseries\\color{heading}}{}{0em}{}[][\\vspace{2pt}\\hrule height 0.5pt\\vspace{6pt}]
\\titlespacing{\\section}{0pt}{12pt}{6pt}
\\titleformat{\\subsection}{\\normalsize\\bfseries\\color{heading}}{}{0em}{}
\\titlespacing{\\subsection}{0pt}{8pt}{4pt}

% List formatting
\\setlist[itemize]{leftmargin=*, topsep=2pt, itemsep=2pt, parsep=0pt}
\\setlist[enumerate]{leftmargin=*, topsep=2pt, itemsep=2pt, parsep=0pt}

% Paragraph formatting
\\setlength{\\parindent}{0pt}
\\setlength{\\parskip}{4pt}
\\raggedright

% Page style
\\pagenumbering{gobble}

\\begin{document}
`;
}

/**
 * Gets font setup for fontspec based on family.
 * Uses system fonts available on macOS/Linux/Windows.
 */
function getFontSetup(fontFamily: "sans" | "serif" | "mono"): string {
  switch (fontFamily) {
    case "serif":
      return `% Serif: Times New Roman (system)
\\setmainfont{Times New Roman}[
  BoldFont = Times New Roman Bold,
  ItalicFont = Times New Roman Italic,
  BoldItalicFont = Times New Roman Bold Italic
]
\\setsansfont{Arial}[
  BoldFont = Arial Bold,
  ItalicFont = Arial Italic,
  BoldItalicFont = Arial Bold Italic
]
\\setmonofont{Courier New}[
  BoldFont = Courier New Bold,
  ItalicFont = Courier New Italic,
  BoldItalicFont = Courier New Bold Italic
]`;
    case "mono":
      return `% Mono: Courier New (system)
\\setmainfont{Courier New}[
  BoldFont = Courier New Bold,
  ItalicFont = Courier New Italic,
  BoldItalicFont = Courier New Bold Italic
]`;
    case "sans":
    default:
      return `% Sans: Helvetica/Arial (system)
\\setmainfont{Helvetica}[
  BoldFont = Helvetica Bold,
  ItalicFont = Helvetica Oblique,
  BoldItalicFont = Helvetica Bold Oblique
]
\\setmonofont{Courier New}[
  BoldFont = Courier New Bold,
  ItalicFont = Courier New Italic,
  BoldItalicFont = Courier New Bold Italic
]`;
  }
}

/**
 * Closes the LaTeX document.
 */
export function latexClose(): string {
  return `\\end{document}`;
}

/**
 * Sanitizes a filename for LaTeX export.
 */
export function sanitizeLatexFilename(name: string): string {
  return name
    .replace(/["\r\n\\]/g, "")
    .replace(/\s+/g, "_")
    .trim();
}

/**
 * Gets the accent color for a resume, falling back to a default.
 * Variant-aware: when the user hasn't chosen an accent, the variant's own
 * default accent (resolved by the export entry point) is used.
 */
export function getAccent(resume: { accentColor?: string | null }, fallback: string): string {
  return resume.accentColor || fallback;
}

/**
 * Gets the font family for a resume, falling back to sans.
 * Variant-aware: the export entry point pre-resolves the variant default.
 */
export function getFontFamily(resume: { fontFamily?: "sans" | "serif" | "mono" }): "sans" | "serif" | "mono" {
  return resume.fontFamily || "sans";
}