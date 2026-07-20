# AI Resume Builder — UI/UX Design Brief

A premium, monochrome-first design system with a single accent color and purposeful 3D elements. Built to be followed exactly by an AI app builder — every value below is a decision, not a suggestion.

---

## 1. Design Style & Direction

**Positioning:** Premium, confident, technical-credible — not playful, not corporate-beige, not decorative-creative like Canva/Enhancv. Closer to Linear, Raycast, and Vercel: black-and-white foundation, generous whitespace, sharp typography, and depth used selectively to signal quality rather than cover every surface in gradients.

**Core principles:**
- **Monochrome-first.** 90% of the UI is black, white, and grayscale. Color is earned, not default.
- **One accent, used with intent.** The accent color marks primary actions, active states, and AI-generated content — never decoration.
- **3D as a premium signal, not wallpaper.** Reserved for hero moments (landing page, empty states, onboarding, AI-generation loading states) — never in dense UI like tables, forms, or dashboards, where it would hurt usability.
- **Depth through elevation, not gradients.** Real UI surfaces (cards, panels, modals) get depth from shadow and subtle borders, not gradient fills.
- **Confidence through restraint.** Fewer borders, fewer dividers, more whitespace. If two elements don't need a line between them, don't draw one.

---

## 2. Color Palette

### Foundation (monochrome)

| Token | Hex | Usage |
|---|---|---|
| `--black` | `#0A0A0A` | Primary text, primary buttons (bg), icons |
| `--gray-900` | `#171717` | Headings on dark surfaces |
| `--gray-700` | `#404040` | Body text |
| `--gray-500` | `#737373` | Secondary text, placeholders |
| `--gray-300` | `#D4D4D4` | Borders, dividers |
| `--gray-100` | `#F5F5F5` | Subtle backgrounds, hover states |
| `--gray-50` | `#FAFAFA` | Page background |
| `--white` | `#FFFFFF` | Card/surface background |

### Accent — Indigo (the one pop color)

| Token | Hex | Usage |
|---|---|---|
| `--accent-50` | `#EEF2FF` | Accent-tinted backgrounds (badges, selected states) |
| `--accent-100` | `#E0E7FF` | Hover backgrounds on accent elements |
| `--accent-400` | `#818CF8` | Secondary accent (icons, links on dark bg) |
| `--accent-500` | `#6366F1` | **Primary accent — main CTAs, active nav, focus rings** |
| `--accent-600` | `#4F46E5` | Accent hover state |
| `--accent-900` | `#312E81` | Accent text on light accent backgrounds |

**Rule:** Exactly one accent-filled primary button visible per screen. Every other button is black-outline (secondary) or ghost (tertiary). Indigo never appears in body text, only in interactive/active elements and small AI-related indicators.

### Semantic colors (functional only — not decorative)

| Purpose | Color | Hex |
|---|---|---|
| Success / positive score | Green | `#16A34A` |
| Warning / needs attention | Amber | `#D97706` |
| Error / destructive | Red | `#DC2626` |
| Info | Gray-blue | `#64748B` |

**Rule:** Semantic colors appear only on status indicators (score badges, form validation, toasts) — never as general UI decoration. The "Estimated Compatibility Score" uses green/amber/red only for the numeric badge itself, nothing else on that page shifts color.

### Dark mode
Full dark mode is in scope. Foundation inverts (`--black`→near-white text, `--gray-50`→`#0A0A0A` page bg), accent indigo shifts to `--accent-400` (#818CF8) as the primary interactive color for sufficient contrast on dark surfaces. Cards use `#171717` with `1px solid #262626` borders instead of shadows (shadows barely read on dark backgrounds).

---

## 3. Typography

**Typeface:** Inter (primary), fallback stack: `Inter, -apple-system, "Geist", "Segoe UI", sans-serif`. Use variable font weights if available for finer control; otherwise 400/500/600/700.

### Type scale

| Style | Size | Weight | Line height | Usage |
|---|---|---|---|---|
| Display | 48px | 700 | 1.1 | Landing page hero only |
| H1 | 32px | 600 | 1.2 | Page titles |
| H2 | 24px | 600 | 1.3 | Section headers |
| H3 | 18px | 600 | 1.4 | Card titles, subsection headers |
| Body Large | 16px | 400 | 1.6 | Primary reading content |
| Body | 14px | 400 | 1.6 | Default UI text, form labels |
| Small | 13px | 400 | 1.5 | Secondary text, captions, timestamps |
| Micro | 12px | 500 | 1.4 | Badges, tags, overline labels |
| Button text | 14px | 600 | 1 | All buttons |

**Rules:**
- Sentence case everywhere — buttons, headings, nav items, form labels. Never Title Case, never ALL CAPS (exception: micro-labels/overlines at 12px may use uppercase with `letter-spacing: 0.05em` for section eyebrows only, e.g. "RESUME SECTIONS").
- Max line length for body text: 72 characters (~600px at 16px) for readability in the Resume Builder's form columns.
- Numbers (scores, counts, prices) use **tabular figures** (`font-variant-numeric: tabular-nums`) so they don't jitter when they update live (ATS score recalculation, character counters).
- Monospace (`"JetBrains Mono", monospace`) reserved for one place only: raw code/URL display (GitHub repo names, credential links) — not used generally.

---

## 4. Layout Direction

**Grid system:** 12-column, 1280px max content width on desktop, 24px gutters, 80px outer margins on large screens (≥1440px), 32px on standard desktop (1024–1439px).

**Spacing scale (8px base unit):** 4, 8, 12, 16, 24, 32, 48, 64, 96px. No arbitrary spacing values — every margin/padding maps to this scale.

**Layout patterns by screen type:**

| Screen type | Pattern |
|---|---|
| Marketing (Landing) | Full-width sections, alternating content/visual, centered 1280px max content |
| Auth (Signup/Login) | Centered single card, 440px width, vertically centered on full-height gray-50 background |
| Onboarding | Centered card, 560px width, persistent step indicator top-of-card |
| Resume Builder | 3-column: 240px left nav (fixed) — flexible center form (min 480px) — 400px right panel (preview + AI), collapsing per breakpoints below |
| Dashboard | Left sidebar (240px, fixed) + flexible main content area, top bar 64px height |
| Settings/Admin | Left sidebar sub-nav (200px) + single-column content, max 720px width for forms |

**Elevation system (shadow, not gradient):**

| Level | Shadow | Usage |
|---|---|---|
| 0 | none | Page background, flat inline elements |
| 1 | `0 1px 2px rgba(0,0,0,0.04)` | Resting cards |
| 2 | `0 4px 12px rgba(0,0,0,0.08)` | Hover state on cards, dropdowns |
| 3 | `0 12px 32px rgba(0,0,0,0.12)` | Modals, popovers |
| 4 | `0 24px 64px rgba(0,0,0,0.16)` | The 3D hero visuals, onboarding illustrations |

---

## 5. Component Style

**Corner radius:** 8px default (buttons, inputs, small cards), 16px for large cards/panels, 24px for modals, full-round (`9999px`) for pills/badges/avatars.

**Buttons:**
- **Primary:** Black fill (`--black`), white text, 8px radius, 40px height, 20px horizontal padding. Hover: `--gray-900`. One accent-indigo primary button reserved specifically for the single most important action per screen (e.g., "Generate with AI," "Upgrade to Pro") — everything else that would default to "primary" stays black.
- **Secondary:** White fill, 1px `--gray-300` border, black text. Hover: `--gray-50` fill.
- **Ghost:** Transparent, no border, black text. Hover: `--gray-100` fill.
- **Destructive:** White fill, 1px red border, red text. Hover: red-50 fill.
- All buttons: `font-weight: 600`, `font-size: 14px`, transition `120ms ease` on hover/active states, `scale(0.98)` on active/press.

**Inputs:** 40px height, 8px radius, 1px `--gray-300` border, white background. Focus: border becomes `--accent-500`, plus a 3px accent-tinted focus ring (`box-shadow: 0 0 0 3px rgba(99,102,241,0.15)`). Error state: red border + red focus ring, error message in 13px red text below field.

**Cards:** White background, 1px `--gray-300` border OR elevation-1 shadow (not both — pick one per context; bordered cards for dense lists like Dashboard resume cards, shadowed cards for standalone content like the AI suggestion panel).

**Badges/Tags:** 12px micro text, 4px vertical / 10px horizontal padding, full-round pills, colored per semantic meaning (score badges) or `--gray-100` bg / `--gray-700` text for neutral tags (skill tags, template categories).

**Icons:** Outline-style icon set (Lucide or Tabler-outline), 20px default inline size, 24px for standalone icon buttons, always inherit surrounding text color unless carrying semantic meaning (green check, red error).

**Modals:** Centered, max-width 560px (standard) or 720px (data-heavy like ATS breakdown), elevation-3 shadow, 24px radius, backdrop `rgba(0,0,0,0.4)` with blur(2px).

---

## 6. 3D Visual System — Where and How

3D is reserved for **five specific moments** where premium feel matters most and density is lowest. It never appears in the working UI (forms, tables, lists, dashboards).

| Location | 3D element | Style |
|---|---|---|
| Landing page hero | Floating 3D resume/document stack with soft rotation, layered depth, subtle black/white/indigo materials | Isometric, matte (not glossy/plastic), soft ambient shadow beneath, gentle idle rotation animation |
| Onboarding (Student/Experienced selection) | Small 3D icon per card (graduation cap for Student, briefcase for Experienced) | Consistent isometric style, single accent-indigo material highlight on one facet |
| Empty states (Dashboard, Job Tracker, Analytics) | Small centered 3D illustration (e.g., floating folder, empty inbox tray) | Muted grayscale with one indigo accent detail — signals "premium empty," not "broken/sad" |
| AI generation loading state | Abstract 3D particle/orb animation while AI Assistant Panel processes | Indigo-toned, low-poly or soft-blob style, subtle pulsing motion, resolves into checkmark on completion |
| Subscription/Pricing page | 3D badge/crown icon on the Pro plan card | Black-and-indigo material, static (no animation, to avoid distracting from pricing comparison) |

**3D style guardrails:**
- Matte/soft materials, not glossy plastic or neon glow — must match the monochrome-premium tone, not look like a mobile game.
- Consistent light source direction (top-left, soft) across every 3D asset for visual coherence.
- Color restricted to black, white, gray, and indigo within the 3D assets — no rainbow gradients.
- All 3D assets degrade gracefully to a static 2D fallback image on low-power devices/reduced-motion settings.

---

## 7. Dashboard Structure

**Layout:** Fixed left sidebar (240px) + top bar (64px) + main content area.

**Left sidebar (top to bottom):**
1. Logo (32px height, links to Dashboard)
2. Primary nav — icon + label, 44px row height, active state = `--gray-100` background + black text + 3px accent-indigo left border accent:
   - Dashboard
   - Resume Builder (opens last-edited resume)
   - Job Tracker
   - Templates
   - Analytics
3. Divider
4. Secondary nav: Settings, Help
5. Bottom-pinned: user avatar + name + plan badge ("Free" gray pill / "Pro" indigo pill), click opens account menu

**Top bar:** Breadcrumb/page title (left), global search (center, optional), notification bell + "Upgrade to Pro" button (if Free plan) + avatar (right).

**Main content — Dashboard home:**
- Page header: "Your resumes" (H1) + "Create new resume" primary button (top-right)
- Resume grid: `repeat(auto-fill, minmax(280px, 1fr))`, 24px gap, each card:
  - Thumbnail preview (white bg, subtle border, 4:3 aspect, actual resume render scaled down)
  - Resume name (H3, editable inline on click)
  - Last edited timestamp (13px gray-500)
  - Overflow menu (⋮) top-right of card: Rename, Duplicate, Delete, Download
  - On hover: elevation-2 shadow lift + slight `translateY(-2px)`
- Empty state: centered 3D illustration + "Create your first resume" (H2) + one-line subtext + primary CTA button

---

## 8. Mobile Responsiveness

**Breakpoints:**

| Name | Width | Behavior |
|---|---|---|
| Mobile | < 640px | Single column everywhere, bottom tab nav replaces sidebar |
| Tablet | 640–1023px | Collapsed sidebar (icon-only, 64px, expandable on tap), single-column forms |
| Desktop | 1024–1439px | Full sidebar, 2-column Builder (nav+form, preview becomes a tab) |
| Large desktop | ≥ 1440px | Full 3-column Builder layout as specified in Section 4 |

**Mobile-specific rules:**
- Bottom tab bar (fixed, 64px height, white bg, top border): Home, Resume, AI, Jobs, Profile — active tab = accent-indigo icon + label, inactive = gray-500.
- Floating action button (56px circle, black fill, white "+" icon, accent-indigo on press) for "Create Resume," positioned bottom-right, 16px inset above tab bar.
- Resume Builder on mobile: single-column, section-by-section (one section visible at a time with a horizontal section-pill selector at top, swipeable), live preview becomes a separate full-screen view reached via a "Preview" button, not simultaneous with editing.
- AI Assistant Panel on mobile: bottom sheet (slides up, 70% viewport height, drag handle at top), not a docked side panel.
- Touch targets: minimum 44×44px for all interactive elements, 8px minimum spacing between adjacent tappable elements.
- Modals become full-screen sheets on mobile (slide up from bottom) rather than centered floating modals.
- 3D hero visual on landing page simplifies to a static rendered image on mobile (no live rotation) to protect load performance.

---

## 9. UX Principles

1. **Never block on AI.** Every AI action (generate, rewrite, optimize) must have a visible loading state and a graceful failure state that preserves the user's existing content — AI assists, it never destructively overwrites without an undo path.
2. **Autosave, always visible.** The Resume Builder shows real-time save status ("Saving…" / "Saved") so users never wonder if their work is preserved.
3. **One primary action per screen.** Exactly one accent-filled button represents the main thing the user should do next; everything else is secondary/ghost.
4. **Progressive disclosure.** Advanced options (e.g., company-specific variants, role-based tailoring) are one click away from the main flow, not front-loaded into it — the default path stays simple.
5. **Empty states sell the feature, not apologize for absence.** Every empty state names what goes there and gives a direct CTA, styled with the 3D system to feel premium rather than broken.
6. **Consistent iconography and motion.** Same icon set throughout, same 120ms ease-out transition curve for all micro-interactions (hover, press, panel open/close).
7. **Score/metric transparency.** Any AI-generated or estimated number (compatibility score, keyword match %) is visually distinct (badge treatment) from user-entered data, so users always know what's their input versus the system's estimate.

---

## 10. Visual References

- **Linear** (linear.app) — monochrome UI discipline, sidebar/nav structure, restrained accent use
- **Raycast** (raycast.com) — dark mode execution, premium feel with minimal color
- **Vercel** (vercel.com) — landing page structure, black/white marketing site with a single accent, typography confidence
- **Stripe** (stripe.com) — dashboard information density done cleanly, card/table patterns
- **Arc Browser / The Browser Company** — 3D illustration style reference (soft, matte, purposeful, not gamey)
- **Notion** — sidebar navigation pattern and empty-state tone of voice

---

## Design Tokens Summary (for implementation)

```css
:root {
  /* Foundation */
  --black: #0A0A0A;
  --gray-900: #171717;
  --gray-700: #404040;
  --gray-500: #737373;
  --gray-300: #D4D4D4;
  --gray-100: #F5F5F5;
  --gray-50: #FAFAFA;
  --white: #FFFFFF;

  /* Accent */
  --accent-50: #EEF2FF;
  --accent-100: #E0E7FF;
  --accent-400: #818CF8;
  --accent-500: #6366F1;
  --accent-600: #4F46E5;
  --accent-900: #312E81;

  /* Semantic */
  --success: #16A34A;
  --warning: #D97706;
  --error: #DC2626;
  --info: #64748B;

  /* Type */
  --font-sans: 'Inter', -apple-system, 'Geist', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Spacing (8px base) */
  --space-1: 4px; --space-2: 8px; --space-3: 12px; --space-4: 16px;
  --space-6: 24px; --space-8: 32px; --space-12: 48px; --space-16: 64px; --space-24: 96px;

  /* Radius */
  --radius-sm: 8px; --radius-md: 16px; --radius-lg: 24px; --radius-full: 9999px;

  /* Shadow */
  --shadow-1: 0 1px 2px rgba(0,0,0,0.04);
  --shadow-2: 0 4px 12px rgba(0,0,0,0.08);
  --shadow-3: 0 12px 32px rgba(0,0,0,0.12);
  --shadow-4: 0 24px 64px rgba(0,0,0,0.16);
}
```