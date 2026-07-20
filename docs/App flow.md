# AI Resume Builder — Complete App Flow Document

**Scope note:** This document sequences flows by the PRD's own Section 12 phase plan (Phase 1 → 2 → 3), not the flat Section 5 module list. Per Section 12: *"If these two directions conflict during planning, the sequencing in this section should govern day-to-day engineering work."* Flows for features flagged infeasible-as-specified (LinkedIn deep import, Interview Prediction, unconstrained AI metrics) are written to match what the PRD/TRD say is actually buildable, not the literal marketing description. Where a screen's behavior differs from a naive reading of the PRD, that's called out explicitly so an agent doesn't build the wrong thing.

Every screen below specifies: purpose, elements, actions + button behavior, navigation (in/out), success state, error state(s), empty state, and loading state where relevant.

---

## Legend

- 🟢 Fully buildable as specified
- 🟡 Buildable but constrained/reframed vs. PRD's literal wording (constraint noted inline)
- 🔴 Not included in this flow — blocked pending external dependency (noted where it would have appeared)

---

# PHASE 1 — Core Resume Engine

## 1. Landing Page 🟢
**Route:** `/`
**Purpose:** Convert visitors to signups; SEO entry point (Next.js SSR per TRD Section 2).

**Elements:**
- Header: logo (left), nav links (Templates, Pricing, Login), primary CTA button "Get Started" (right)
- Hero: headline, subheadline, CTA button "Create Resume"
- Secondary CTA row: "Import GitHub" button
  - 🟡 **"Import LinkedIn" CTA is removed from this screen.** PRD listed it as a primary CTA; TRD Section 5/6 confirms only OAuth login (name/email/photo) is available, not import. Promoting "Import LinkedIn" as a hero-level CTA overstates the feature and should not ship. LinkedIn appears only as a login option on Signup (Screen 2).
- Example resume showcase carousel (static/marketing images, 3–5 cards)
- Template preview carousel (pulls from Template Library, read-only, no auth required)
- Features section (icon + text grid, 6 items matching Section 5 modules)
- Testimonials section (static content, placeholder until real testimonials exist)
- Pricing summary (2-column: Free / Pro, "See full pricing" link → Subscription info, no auth wall to view)
- Footer: links (About, Privacy, Terms, Contact), social icons

**Actions:**
| Element | Behavior |
|---|---|
| "Get Started" / "Create Resume" CTA | → Signup Page (Screen 2) |
| "Import GitHub" CTA | → Signup Page (Screen 2), pre-selects GitHub OAuth on load |
| "Login" nav link | → Login Page (Screen 2b) |
| Template card click | → Template preview modal (read-only, "Sign up to use this template" CTA inside) |
| Pricing "See full pricing" | → scroll to Pricing section or `/pricing` if built standalone |

**Empty state:** N/A (static marketing page).
**Error state:** If SSR data fetch fails (e.g., template previews don't load), render page without that section — never block the whole page render on a non-critical fetch.
**Loading state:** Skeleton loaders for template carousel only; rest is static SSR content, no loading state needed.

---

## 2. Sign Up Page 🟢
**Route:** `/signup`

**Elements:**
- Email input, Password input, "Sign up with Email" button
- Divider ("or")
- "Continue with Google" button (OAuth)
- "Continue with LinkedIn" button (OAuth — 🟡 label must read "Continue with LinkedIn" not "Import LinkedIn"; returns name/email/photo only per TRD Section 5)
- "Continue with GitHub" button (OAuth, requests `read:user public_repo` scope per TRD Section 6)
- "Already have an account? Log in" link
- Terms/Privacy checkbox (required to enable submit) — required for Section 9 (data privacy) compliance

**Actions:**
| Element | Behavior |
|---|---|
| Email + Password + Submit | Client-side validate (email format, password ≥8 chars) → POST `/api/auth/signup` → on success, create session (JWT + refresh cookie per TRD Section 5) → redirect to User Type Selection (Screen 3) |
| Google OAuth button | Redirect to Google consent → callback creates/links account → session created → redirect to User Type Selection if new user, or Resume Dashboard if returning user |
| LinkedIn OAuth button | Redirect to LinkedIn OIDC consent → callback returns name/email/photo only → account created with those 3 fields → **no profile import runs** → redirect to User Type Selection |
| GitHub OAuth button | Redirect to GitHub consent (repo read scope) → callback stores encrypted OAuth token (TRD Section 9: never exposed to frontend) → redirect to User Type Selection |
| "Log in" link | → Login Page (Screen 2b) |

**Success state:** Session created, redirect fires within 1s of callback response.
**Error states:**
- Email already registered → inline error under email field: "An account with this email already exists. [Log in instead]"
- Password too weak → inline error, do not submit
- OAuth provider returns error/denial → toast: "Sign-in was cancelled or failed. Please try again." Stay on Signup page.
- Network/server error on submit → toast: "Something went wrong. Please try again." Form values persist (don't clear inputs).

**Empty state:** N/A (form page).
**Loading state:** Submit button shows spinner + disables on click to prevent double-submit; OAuth buttons disable while redirect is in flight.

### 2b. Login Page 🟢
**Route:** `/login`
Same layout pattern as Signup (email/password + 3 OAuth buttons), minus the Terms checkbox.
- Invalid credentials → inline error: "Incorrect email or password."
- Returning user via any method → skip User Type Selection, go directly to Resume Dashboard (Screen 7).
- "Forgot password?" link → Password Reset flow (standard: email input → reset link sent → confirmation screen).

---

## 3. User Type Selection 🟢
**Route:** `/onboarding/user-type`
**Purpose:** Branch into Student or Experienced content model (PRD Section 3 — segments require different defaults).

**Elements:**
- Two large selectable cards: "Student" and "Experienced Professional"
  - 🟡 **Fresher handling:** PRD defines 3 segments (Student/Fresher/Experienced) but only specifies 2 branches here (Section 3). Resolution: "Experienced Professional" card subtitle reads "0+ years, including internships and first jobs" so Freshers self-select into the Experienced path but get a lighter-weight version of the form (see below). This avoids building a third parallel onboarding flow not specified in Section 3, while still serving the Fresher segment.
- Progress indicator (step 1 of 2, before Career Goal page)

**Actions:**
| Element | Behavior |
|---|---|
| "Student" card click | Selects card (visual highlight) → auto-advances after 400ms OR shows "Continue" button → POST user_type=student → → Screen 3a (Student sub-form) |
| "Experienced Professional" card click | Same pattern → → Screen 3b (Experienced sub-form) |
| Back button (browser or in-app) | → Signup confirmation state (does not destroy session; user can retry selection) |

**Error state:** If POST fails, show inline toast, keep selection state, allow retry without re-selecting.
**Empty state:** N/A.

### 3a. Student Sub-Form
Fields: College name (text, autocomplete against a static university list, free-text fallback), Degree (text), Graduation year (dropdown, current year ±6), Skills (multi-tag input, min 1 required to proceed).
- "Continue" button disabled until College + Graduation year filled (Skills optional but nudged: "Add at least one skill to get better AI suggestions" if empty on submit attempt).
- On submit → save to user profile → → Career Goal Page (Screen 4).

### 3b. Experienced Sub-Form
Fields: Current role (text), Years of experience (dropdown: 0–1, 1–2, 2–5, 5–10, 10+), Industry (dropdown), Current company (text, optional).
- "Continue" enabled once Current role + Years selected.
- On submit → → Career Goal Page (Screen 4).

---

## 4. Career Goal Page 🟢
**Route:** `/onboarding/career-goal`

**Elements:**
- Desired role (text with autocomplete suggestions)
- Desired company (text, optional, multi-add chips)
- Desired industry (dropdown)
- Salary range (dual slider or min/max input, optional, currency selector)
- Work type preference (radio: Remote / Hybrid / Onsite / No preference)
- "Continue" button, "Skip for now" link

**Actions:**
| Element | Behavior |
|---|---|
| "Continue" | Save fields (any combination, none required except Desired role) → → Resume Dashboard (Screen 7), first-time empty state |
| "Skip for now" | Save nothing → → Resume Dashboard, first-time empty state |

**Error state:** Salary min > max → inline error, block submit until corrected.
**Empty state:** N/A (form).

---

## 5. Resume Dashboard 🟢 (Phase 1: basic version, no ATS/prediction yet)
**Route:** `/dashboard`
**Purpose:** Home base after onboarding and on every return visit.

**Elements:**
- "My Resumes" grid/list (cards: resume name, last edited date, thumbnail preview)
- Per-card menu (⋮): Rename, Duplicate, Delete, Download PDF
- "Create New Resume" button (primary, top-right and as empty-state CTA)
- 🟡 ATS score badge, view/download counters, Interview Prediction indicator are **not shown in Phase 1** — these ship in Phase 2 (ATS) and are held indefinitely for Interview Prediction pending real outcome data (PRD Section 5.7 flag, TRD Section 7). Building the UI slot for them now with fake/placeholder numbers would misrepresent the product; card layout should be designed to add a score badge later without redesign.

**Actions:**
| Element | Behavior |
|---|---|
| "Create New Resume" | → Resume Builder (Screen 6), new blank resume, pre-filled with onboarding data (name/college/role from Screens 3–4) |
| Resume card click | → Resume Builder (Screen 6), loads that resume's data |
| Card menu → Rename | Inline text edit on card title → PATCH on blur/enter |
| Card menu → Duplicate | POST duplicate → new card appears in grid, appended, name = "Copy of [original]" |
| Card menu → Delete | Confirmation modal: "Delete this resume? This can't be undone." Confirm → DELETE → card removed from grid with fade-out animation |
| Card menu → Download PDF | Triggers export pipeline (Screen 15 logic) directly from dashboard, no navigation |

**Empty state:** No resumes yet — centered illustration + "Create your first resume" heading + "Create New Resume" button. This is what every user sees immediately after onboarding.
**Error state:** Dashboard fetch fails → retry button + "Couldn't load your resumes. [Retry]" — do not show empty state on fetch failure (empty state and error state must be visually distinct).
**Loading state:** Skeleton cards (3 placeholder cards) while fetching.

---

## 6. Resume Builder 🟢
**Route:** `/resume/:id/edit`
**Purpose:** Core editing surface. Left: section nav. Center: form. Right: live preview + AI panel (per TRD Section 2 layout).

**Layout:**
- Left sidebar: section list (Personal Info, Summary, Experience, Education, Skills, Projects, Certifications, Achievements, Languages) — click to jump, checkmark icon once a section has ≥1 saved entry
- Center: active section's form
- Right panel: live resume preview (updates on blur/debounced keystroke, ~500ms), AI Assistant Panel below/beside preview (see Screen 6-AI)
- Top bar: resume name (editable inline), autosave indicator ("Saved" / "Saving..." / "Unsaved changes"), "Preview" button, "Export" button

**Autosave behavior:** Debounced save 1s after last keystroke per field, or on field blur, whichever first. Autosave indicator reflects real state — never show "Saved" while a request is in flight.

### 6.1 Personal Information Section
Fields: Name, Email, Phone, LinkedIn URL (manual text field — not pulled from OAuth), GitHub URL (auto-filled if GitHub connected, editable), Portfolio URL.
- All fields optional except Name and Email (soft-required: warn but don't block save).
- Error: invalid email format → inline error, does not block autosave of other fields.

### 6.2 Summary Section
- Textarea (large, ~4-6 lines)
- Three buttons above textarea: "AI Generate Summary" | "Rewrite Summary" | "ATS Optimize Summary"
- **"AI Generate Summary"**: enabled only if user has ≥1 Experience or Education entry (needs source content) — disabled state tooltip: "Add your experience or education first so AI has something to summarize." On click → loading state in textarea area ("Generating...") → POST to AI service → replaces textarea content → "Undo" link appears for 10s to revert to prior text.
- **"Rewrite Summary"**: enabled only if textarea has content. Same loading/undo pattern.
- **"ATS Optimize Summary"**: enabled only if textarea has content. Same pattern; additionally shows a small diff view (before/after) rather than silent replace, since ATS optimization changes wording for keyword reasons the user should be able to verify.
- Error: AI request fails/times out → toast "AI suggestion failed. Please try again." Textarea content unchanged.

### 6.3 Experience Section
- List of experience entries (add/reorder via drag handle/delete)
- "Add Experience" button → new entry form: Company, Role, Start date, End date (or "Currently working here" checkbox disabling End date), Responsibilities/Achievements (textarea, supports bullet-style input)
- Per-entry: "Improve with AI" button → opens AI Assistant Panel (Screen 6-AI) scoped to that entry
- Delete entry → confirmation modal ("Remove this experience entry?") → confirm → removed, list re-indexes
- Empty state (no entries): "No experience added yet. [+ Add Experience]" placeholder card in the list position.

### 6.4 Education Section
Fields per entry: College, Degree, CGPA/GPA (optional), Graduation year. Same add/edit/delete pattern as Experience. Pre-filled from Screen 3a if Student path.

### 6.5 Skills Section
- Tag input, categorized tabs: Technical / Soft / Tools & Frameworks
- Autocomplete suggestions as user types (from a static curated skill list)
- "Suggest skills" button (🟡 pulls from GitHub repo languages if GitHub connected — see Screen 6-GitHub integration below; otherwise disabled with tooltip "Connect GitHub for skill suggestions")

### 6.6 Projects Section
- Entries: Title, Description, Tech stack (tags), Link (optional), Source (dropdown: Personal / GitHub / Company — auto-set to "GitHub" for imported projects, locked)
- "Import from GitHub" button → opens GitHub Integration Page (Screen 6-GitHub) in modal/panel, not full navigation, so user doesn't lose Builder context
- Manual "Add Project" button → blank entry form

### 6.7 Certifications Section
- Entries: Name, Issuer, Date, Credential URL (optional)
- "Add Certification" — manual entry only in Phase 1/2.
  - 🔴 **LinkedIn-sourced certificate import is not available.** No button/affordance for "import from LinkedIn" appears here — see Screen 5-LinkedIn note below. This is a deliberate omission, not a missing feature to flag as broken.

### 6.8 Achievements Section
Entries: Title, Description, Date (optional). Same add/edit/delete pattern.

### 6.9 Languages Section
Entries: Language (dropdown/autocomplete), Proficiency (dropdown: Basic/Conversational/Fluent/Native). Add/remove rows.

**Section-level error state (all sections):** Save/autosave fails → toast "Couldn't save your changes. Retrying..." → auto-retry once after 3s → if still failing, persistent banner: "You're offline or something's wrong. Changes are saved locally until reconnected." (requires local draft cache, e.g., localStorage/IndexedDB fallback).

---

## 6-AI. AI Assistant Panel 🟡
**Location:** Docked panel within Resume Builder, contextual to whichever field/section is focused.
**Constraint (TRD Section 7, PRD Section 5.9):** The AI must never insert a metric/number the user did not supply. This is a hard behavioral requirement for the agent building the prompt layer, not a UI nicety.

**Elements:**
- Suggestion buttons: "Improve bullet points", "Add missing keywords", "Add action verbs", "Remove weak content"
- 🟡 **"Add metrics" behaves differently than the literal PRD example.** It does **not** generate a number. On click, it scans the current bullet for quantifiable claims lacking a number and inserts a bracketed placeholder the user must fill: e.g., "Developed REST API serving `[X]` users" — never "Developed REST API serving 50K users" unless the user typed 50K somewhere first. Tooltip on the button: "Highlights where a number would strengthen this bullet — you fill in the real figure."
- Each suggestion shown as a before/after inline diff with individual "Accept" / "Reject" controls per suggested change (not one global accept-all), so the user can pick and choose.

**Actions:**
| Element | Behavior |
|---|---|
| Suggestion button click | POST current field text + task type → AI service → returns 1–3 suggested variants → render as diff cards |
| "Accept" on a suggestion | Replace field text with suggested variant → log accept event (feeds Success Metrics: % suggestions accepted, per PRD Section 8) |
| "Reject" | Dismiss card, no change → log reject event |
| "Regenerate" (if shown) | Re-request with same task type, different output |

**Error state:** AI service timeout/failure → "AI suggestions unavailable right now. Try again in a moment." Do not silently fail — the button should return to its default (non-loading) state.
**Empty state:** No field focused / no content to improve → panel shows placeholder: "Select a bullet point or section to get AI suggestions."
**Loading state:** Skeleton diff cards while request in flight (~1–3s expected).

---

## 6-GitHub. GitHub Integration Page 🟢
**Route:** `/integrations/github` (also embeddable as modal from Screen 6.6)

**Elements:**
- If not connected: "Connect GitHub" button (OAuth)
- If connected: repo list, each row showing repo name, ★ stars, fork count, primary language, "Add to Resume" button per row
- "AI suggestions for which repos to feature" — a highlighted subsection at top: "Recommended for your resume" (3 repos, AI-ranked by stars/recency/relevance to Desired role from Screen 4)
- Filter/sort controls: by stars, by last updated, by language

**Actions:**
| Element | Behavior |
|---|---|
| "Connect GitHub" | OAuth flow (TRD Section 5) → on callback success, fetch repo list (cached per TRD Section 6 rate-limit note — don't refetch every load) → render list |
| "Add to Resume" (per repo) | Creates a Projects entry (Screen 6.6) pre-filled: Title=repo name, Description=repo description or AI-summarized README, Tech stack=detected languages, Link=repo URL, Source=GitHub (locked) → toast "Added to your resume" → button changes to "Added ✓" (disabled) |
| "Add open-source contribution" | Manual entry variant of the above for repos not owned by the user (PR contributions) — text form: repo name, contribution description, link |
| Sort/filter controls | Client-side re-render of already-fetched list, no new API call |

**Error states:**
- OAuth denied/cancelled → toast, stay on page, "Connect GitHub" button remains
- GitHub API rate limit hit (TRD Section 6: 5,000 req/hr) → banner: "GitHub data temporarily unavailable, please try again shortly" — this is why caching matters; should be rare
- Repo fetch fails post-auth → retry button in place of list

**Empty state:** Connected but 0 public repos → "No public repositories found. You can still add projects manually. [+ Add Project Manually]"
**Loading state:** Skeleton rows (5) while fetching repo list.

---

## 14. Resume Templates Page 🟢
**Route:** `/templates`

**Elements:**
- Category filter tabs: All / ATS Professional / Modern / Minimal / Executive / Student / Creative
- Grid of template cards: thumbnail, name, "Preview" and "Use this template" buttons
- Live preview modal on card click: renders current resume content inside the selected template

**Actions:**
| Element | Behavior |
|---|---|
| Category tab click | Client-side filter, no reload |
| "Preview" | Opens modal with user's actual resume content rendered in that template (not placeholder lorem ipsum) — falls back to placeholder content if resume is empty |
| "Use this template" | Sets resume.template_id → PATCH → toast "Template applied" → if opened from within Builder, returns to Builder with new template active in right-panel preview; if opened standalone, offers "Go to Resume Builder" button |
| "Change theme" (color variant, if template supports it) | Swatch picker within preview modal, applies instantly to preview, persists on "Use this template" |

**Empty state:** N/A (templates are static catalog content).
**Error state:** Template metadata fails to load → "Couldn't load templates. [Retry]"

---

## 15. Resume Preview & Export Page 🟢
**Route:** `/resume/:id/preview`

**Elements:**
- Full-page rendered resume (read-only, exact export representation)
- Action bar: "Print", "Share", "Download" (dropdown: PDF / DOCX / TXT), "Back to Editor"

**Actions:**
| Element | Behavior |
|---|---|
| "Download" → format choice | POST export request → backend generates file server-side (TRD Section 3: server-side generation for pixel-consistent export) → loading spinner on button ("Generating...") → triggers browser download on completion |
| "Print" | Browser native print dialog (`window.print()`) using print-optimized CSS |
| "Share" | Generates a shareable read-only link (if this feature is in scope) → copy-to-clipboard with confirmation toast; if not in Phase 1 scope, button hidden entirely rather than shown disabled |
| "Back to Editor" | → Resume Builder (Screen 6), same resume |

**Error state:** Export generation fails → toast "Export failed. Please try again." Button returns to default state, no partial/corrupt download triggered.
**Success state:** Toast "Downloaded [filename].[ext]" after browser download fires.
**Empty state:** N/A (only reachable with an existing resume).

---

# PHASE 2 — Integrations, ATS, and Targeting

## 5. LinkedIn Integration Page 🟡 (heavily constrained vs. PRD literal text)
**Route:** `/integrations/linkedin`

**This screen must NOT be built as PRD Section 5.5 literally describes it.** Per Section 1's own notice and TRD Section 6: only OAuth login (name/email/photo) is available. Import Profile/Experience/Education/Skills/Certificates/Posts/Recommendations have **no data source** and must not appear as clickable import actions.

**Elements:**
- Connection status card: "Connected as [Name]" with profile photo, or "Connect LinkedIn" button if not connected
- Explanatory copy block (required, not optional): "LinkedIn doesn't currently allow us to import your profile data automatically. You can connect for sign-in, and add certificates, achievements, or updates manually below."
- Manual-add section (3 quick-add cards): "Add Certificate", "Add Achievement", "Add LinkedIn Post reference" — each opens a small form (title, issuer/source, date, optional link) that writes into the relevant Resume Builder section (Certifications, Achievements) or a personal notes field
- AI suggestions for profile improvement: this is **reframed as resume-content suggestions**, not LinkedIn-profile suggestions, since there's no profile data to analyze — copy reads "AI tips to strengthen your resume" and reuses the AI Assistant Panel logic (Screen 6-AI), not a LinkedIn-specific feature

**Actions:**
| Element | Behavior |
|---|---|
| "Connect LinkedIn" | OAuth (OIDC) → returns name/email/photo → stored on profile → status card updates |
| "Add Certificate" / etc. | Opens inline form → on submit, writes to the corresponding Resume Builder section → toast "Added to your resume" |

**Error state:** OAuth failure → toast, no change to connection status.
**Empty state:** Not connected — shows "Connect LinkedIn" as primary state; manual-add cards remain usable regardless of connection status (they don't require LinkedIn auth, just resume auth).

**What is explicitly absent:** No "Import Profile" button, no "Import Experience" button, no auto-populated fields from LinkedIn anywhere in the product. If a future partnership (PRD Open Question) is secured, this screen gets rebuilt — it is not a stub with disabled buttons, because disabled-but-visible import buttons would still misrepresent current capability to users.

---

## 10. ATS Optimization Page 🟡
**Route:** `/resume/:id/ats-score`

**Constraint (TRD Section 7 & 10):** UI copy must say **"Estimated Compatibility Score"**, never "ATS Score" unqualified. This applies to every instance of this number across the entire app (Dashboard badge when added in Phase 2, this page, Analytics).

**Elements:**
- Large score display: "Estimated Compatibility Score: 78/100" with a one-line disclaimer directly beneath it, always visible, not tucked in a tooltip: *"This is our own estimate based on common ATS patterns — not a score from Workday, Greenhouse, or any specific hiring system."*
- Sub-scores (bar or radial, 3 categories): Skills Match, Formatting, Keyword Coverage
- Suggestions list: "Add missing skills", "Improve summary", "Add metrics", "Fix formatting" — each an actionable card, not just text
- "Recalculate" button (for after edits)

**Actions:**
| Element | Behavior |
|---|---|
| Page load | Fetch cached score (TRD Section 4: Redis caches expensive recalculation) if resume unchanged since last calc; else trigger calc |
| Suggestion card → "Fix" / "Add" button | Deep-links to the relevant Resume Builder section (Screen 6) with that field focused, OR opens AI Assistant Panel scoped to fix that specific gap |
| "Recalculate" | POST recalc request → loading state on score display (pulsing skeleton, not blank) → updates on response |

**Error state:** Calculation fails → "Couldn't calculate your score. [Retry]" — do not show a stale or zero score as if current.
**Empty state:** Resume has insufficient content to score (e.g., no Experience/Skills at all) → "Add more content to your resume to get a compatibility estimate." with a CTA back to Builder, no numeric score shown (never show "0/100," which reads as a real failing grade rather than "not enough data").

---

## 11. Job Description Analyzer 🟢
**Route:** `/tools/job-match` (also accessible from within Resume Builder as a side panel)

**Elements:**
- Input toggle: "Paste text" / "Paste URL"
- Textarea (paste mode) or URL input (URL mode) + "Analyze" button
- Results panel (appears after analysis): Keyword Match % (large), three columns/lists: Missing Keywords, Missing Skills, Missing Tools
- Per-item "+" button next to each missing keyword/skill/tool
- "Add All & Update Resume" bulk button

**Actions:**
| Element | Behavior |
|---|---|
| "Analyze" (paste mode) | Validate non-empty → POST text → AI + keyword-matching hybrid per TRD Section 7 (deterministic-leaning, validated against fallback matcher) → render results |
| "Analyze" (URL mode) | POST URL → server fetches + extracts text (TRD Section 6: simple HTML-to-text, respects robots.txt/ToS, does not scrape boards that disallow it) → same result rendering. If a job board blocks fetching → error state below |
| Per-item "+" | Adds that specific keyword/skill to the relevant Resume Builder section → item shows "Added ✓" |
| "Add All & Update Resume" | Confirmation modal listing all items about to be added (user can uncheck individual ones) → confirm → bulk-adds → toast "X items added to your resume" |

**Error states:**
- URL fetch blocked by target site's terms → "We couldn't retrieve this job posting — please paste the description text instead." (never silently fall back to scraping)
- Empty paste submitted → inline validation, "Analyze" disabled until text present
- Analysis service fails → toast + retry

**Empty state:** Before first analysis — placeholder illustration + "Paste a job description to see how your resume matches."
**Loading state:** "Analyzing..." with skeleton result panels (~2-4s expected for AI + matching).

---

## 12. Company-Specific Resume 🟡
**Route:** `/resume/:id/variants/company`

**Constraint (PRD design flag):** Must not produce formulaic, keyword-swapped output per fixed template. Prompt layer must vary phrasing per user's actual content, not apply the same substitution to everyone selecting "Startup."

**Elements:**
- Profile selector: Startup / MNC / FAANG-Product / (extensible list)
- Short description under each option (1 line: what this profile emphasizes)
- "Generate Variant" button
- Result: side-by-side or toggle view (Original vs. Variant), diff-highlighted
- "Save as New Resume" / "Replace Current" / "Discard" actions

**Actions:**
| Element | Behavior |
|---|---|
| Profile selection + "Generate Variant" | POST resume content + profile type → AI service generates rewritten version emphasizing profile-relevant framing, using *this user's own bullets/projects* as source material, not a fixed template swap → render diff view |
| "Save as New Resume" | Creates a new resume record (duplicate + variant applied) → appears in Dashboard as separate card → does not overwrite original |
| "Replace Current" | Confirmation modal ("This replaces your current resume content. Continue?") → applies variant to existing resume |
| "Discard" | Clears generated variant, returns to profile selector, no changes saved |

**Error state:** Generation fails → toast, no partial overwrite of existing resume under any circumstance (only "Save as New" or explicit confirmed "Replace" can mutate saved data).
**Empty state:** No resume content yet → "Build out your resume first, then generate a company-tailored version." CTA to Builder.

---

## 13. Role-Based Resume 🟢
**Route:** `/resume/:id/variants/role`
Same interaction pattern as Screen 12, but profile options are role types (Software Engineer, Frontend Developer, Backend Developer, Data Analyst, Product Manager, Marketing) instead of company types. Same generate → diff → Save as New / Replace / Discard actions and error/empty states.

---

## 16. Cover Letter Builder 🟢
**Route:** `/tools/cover-letter`

**Elements:**
- Inputs: Resume selector (dropdown, if multiple resumes exist), Job description (paste or reuse from a recent Job Description Analyzer session), Company name (text input)
- "Generate Cover Letter" button
- Output: editable textarea with generated letter, formatted preview alongside
- Action bar: Regenerate, Download (PDF/DOCX), Copy to clipboard

**Actions:**
| Element | Behavior |
|---|---|
| "Generate Cover Letter" | Validate resume + job description present (company name optional but improves output) → POST → AI generates draft, constrained to claims present in the resume (TRD Section 7: "should still avoid inventing specific claims not present in the resume") → renders in editable textarea |
| Textarea edits | User can freely edit generated text; autosave draft |
| "Regenerate" | Re-requests with same inputs, replaces content (confirmation if user has manually edited: "You have unsaved edits — regenerate anyway?") |
| "Download" | Same export pipeline as Screen 15 |
| "Copy to clipboard" | Copies plain text, toast confirmation |

**Error state:** Generation fails → toast, textarea remains editable/empty for manual writing as fallback.
**Empty state:** No resume exists yet → "Create a resume first so we have content to build your cover letter from." CTA to Dashboard/Builder.

---

## 17. Resume Update Center 🟡
**Route:** `/updates` (or notification-driven, no dedicated page required if handled via toast/inbox pattern)

**Constraint:** Only GitHub-sourced auto-detection is buildable (TRD Section 11 confirms GitHub API feasible; LinkedIn auto-detection blocked same as Screen 5).

**Elements:**
- Notification list/inbox: "New project detected: [repo name]" cards
- Per-card actions: "Add to Resume" / "Ignore"
- 🔴 No LinkedIn-sourced notifications ("new job," "new certificate," "new post") appear here — not built, not stubbed.

**Actions:**
| Element | Behavior |
|---|---|
| Background job (BullMQ, TRD Section 3) polls connected users' GitHub for new public repos | On detection, creates a notification record |
| "Add to Resume" | Same behavior as Screen 6-GitHub "Add to Resume" → toast confirmation, notification marked resolved/removed from inbox |
| "Ignore" | Notification dismissed, marked as ignored (won't re-surface for that repo) |

**Empty state:** "No new updates right now. We'll let you know when we spot new GitHub activity."
**Error state:** Polling job fails silently to the user (logged server-side only) — do not surface backend job failures as user-facing errors; simply show empty state if nothing new was found.

---

# PHASE 3 — Retention, Tracking, and Admin

## 18. Job Tracker 🟢
**Route:** `/jobs`

**Elements:**
- Table/board view toggle
- Columns/statuses: Applied, Interview, Rejected, Offer (Kanban-style if board view)
- Each entry: Company, Role, Date applied, Status, Notes (optional), linked Resume version (which resume/variant was used)
- "Add Application" button (manual entry: Company, Role, Date, Status, optional link to job posting)

**Actions:**
| Element | Behavior |
|---|---|
| "Add Application" | Opens form modal → on submit, creates entry → appears in "Applied" column/status by default |
| Status dropdown (per entry) or drag-to-column (board view) | Updates status → PATCH → if moved to "Interview" or "Offer," optionally prompts: "Want to note this in your Analytics?" (feeds self-reported outcome metric, TRD Section 7's data-collection groundwork for Interview Prediction) |
| Entry click | Opens detail view/edit modal |
| Delete entry | Confirmation modal → confirm → removed |

**Empty state:** "No applications tracked yet. [+ Add Application]"
**Error state:** Save fails → toast, form retains entered values, does not close modal.

---

## 19. Analytics Page 🟡
**Route:** `/analytics`

**Elements:**
- Estimated Compatibility Score trend chart (line, over time) — same "estimated" labeling constraint as Screen 10 applies to every axis label and tooltip here
- Resume views / recruiter views counters (if view-tracking is in scope; if not built, omit rather than show static zero)
- 🟡 **"Interview Rate" widget**, if shown, must be labeled "Self-Reported Interview Rate" with a visible note: *"Based on outcomes you've logged in Job Tracker — not a prediction."* Calculated only from Job Tracker entries the user explicitly marked "Interview" or beyond, per Section 5.19's own caveat that this is self-reported, not verified.
- 🔴 No standalone "Interview Prediction" score/indicator appears anywhere in Analytics or Dashboard. This was flagged in PRD Section 5.7 and TRD Section 11 as unbuildable without labeled outcome data the product doesn't have at launch — do not build a placeholder number for this.

**Error state:** Chart data fetch fails → "Couldn't load your analytics. [Retry]"
**Empty state:** Fewer than 2 data points for trend chart → "Check back after you've used the app a bit more — trends need a little history." (avoid rendering a flat/misleading single-point line chart)

---

## 20. Subscription Page 🟡
**Route:** `/settings/subscription` or `/pricing` (authenticated view)

**Elements:**
- Two-column plan comparison: Free vs. Pro
- Free: 1 resume, Estimated Compatibility Score (basic)
- Pro: Unlimited resumes, GitHub sync, ATS optimization (full), Company-specific resume variants
- 🟡 **"LinkedIn sync" is removed from the Pro feature list.** Per PRD Section 5.20's own note: this must not be sold commercially until the Section 1 constraint is resolved. Listing it as a paid benefit while it doesn't functionally exist is a billing-integrity issue, not just a marketing nitpick — do not include it in plan comparison copy anywhere, including marketing pages.
- "Upgrade to Pro" button (Free plan view) / "Manage Subscription" (Pro users)
- Billing cycle toggle (Monthly/Annual) if applicable

**Actions:**
| Element | Behavior |
|---|---|
| "Upgrade to Pro" | → Payment flow (Stripe/payment provider checkout, standard redirect or embedded form) → on success, webhook updates user's plan → redirect back with success toast, feature gates lift immediately |
| "Manage Subscription" | → billing portal (provider-hosted) for cancel/update payment method |

**Error state:** Payment fails → provider-returned error surfaced inline, user remains on Free plan, no partial charge/partial feature unlock.
**Success state:** Plan upgraded → toast "Welcome to Pro!" + immediate UI update removing upgrade prompts across the app.

---

## 21. Settings Page 🟢
**Route:** `/settings`

**Elements:**
- Tabs/sections: Profile, Integrations, Notifications
- **Profile:** Name, Email (change requires re-verification), Password change, Delete Account
- **Integrations:** Connection status cards for Google/LinkedIn/GitHub with Connect/Disconnect per provider
- **Notifications:** Toggles for "Resume update alerts" (GitHub-sourced, per Screen 17) and "Job alerts" (if job-matching notifications are in scope)

**Actions:**
| Element | Behavior |
|---|---|
| "Disconnect" (per integration) | Confirmation modal (esp. for GitHub: "Disconnecting will stop auto-detecting new projects. Existing imported projects stay on your resume.") → confirm → revokes stored token, updates status |
| "Delete Account" | Multi-step confirmation (type email to confirm, per data-deletion best practice, TRD Section 9) → on confirm, triggers full data export offer first ("Download your data before deleting?") → then deletion job runs |
| Notification toggles | Instant save on toggle, no separate "Save" button needed |

**Error state:** Any save fails → inline toast per section, does not affect other sections' saved state.
**Empty state:** N/A (settings always has content).

---

## 22. Admin Panel 🟢
**Route:** `/admin` (role-gated server-side on every request per TRD Section 9 — never a frontend-only check)

**Elements:**
- Nav: User Management, Resume Analytics, Template Management, AI Prompt Management
- **User Management:** searchable/filterable user table (email, plan, signup date, status), per-user actions (suspend, view resumes, reset password trigger)
- **Resume Analytics:** aggregate stats (total resumes, avg Estimated Compatibility Score, most-used templates) — same "estimated" labeling discipline applies internally too, so admin-facing dashboards don't drift into treating the heuristic as ground truth
- **Template Management:** CRUD for template catalog (add/edit/archive templates, upload thumbnail, set category)
- **AI Prompt Management:** view/edit the prompt templates used for each AI feature (Summary generation, ATS scoring, keyword extraction, cover letter, company/role variants) — versioned, with a "test prompt" sandbox before publishing changes live

**Actions:**
| Element | Behavior |
|---|---|
| User row → Suspend | Confirmation modal → sets user status=suspended → user's next request gets 403 with "Account suspended, contact support" |
| Template CRUD actions | Standard form-based create/edit; Delete requires confirmation and checks no active resumes reference it before hard-delete (soft-archive instead if referenced) |
| AI Prompt edit → "Test" | Runs the edited prompt against a sample resume in a sandboxed call, shows output, does NOT affect production until "Publish" is clicked separately |
| AI Prompt "Publish" | Confirmation modal (changes affect all users immediately) → new prompt version becomes active, old version retained in version history for rollback |

**Error state:** Any admin mutation failing → explicit toast with the actual error reference (admins need more diagnostic detail than end users), never a silent failure.
**Empty state:** New template catalog / no users yet → standard "no data" placeholders per section.
**Access control:** Non-admin hitting `/admin` route → redirect to Dashboard, no error message revealing the route exists (avoid leaking admin surface to normal users beyond a generic 404/redirect).

---

# Mobile App Navigation (iOS/Android, React Native per TRD Section 2)

**Bottom tab bar:** Home (Dashboard) · Resume (Builder, opens most-recent resume) · AI Assistant · Jobs (Tracker) · Profile (Settings)
**Floating Action Button:** "Create Resume" — visible on Home tab, same behavior as Dashboard's "Create New Resume" button.

**Mobile-specific behavior notes:**
- Resume Builder's 3-column desktop layout (nav/form/preview) collapses to a single-column, section-by-section flow with a bottom sheet for AI Assistant Panel rather than a docked side panel.
- Live preview (desktop right panel) becomes an explicit "Preview" tab/button rather than always-visible, since screen width can't sustain simultaneous form + preview.
- All error/empty/loading states carry over identically in meaning; only layout changes.
- LinkedIn/GitHub OAuth flows use in-app browser (SFSafariViewController / Chrome Custom Tabs), not full app-context switch, per standard OAuth mobile UX.

---

# Cross-Cutting States (apply to every screen unless overridden above)

**Session expiry:** Any API call returning 401 → silent refresh-token attempt → if refresh also fails, redirect to Login with toast "Your session expired, please log in again," preserving intended destination for post-login redirect.

**Offline/network loss:** Persistent top banner "You're offline — changes will sync when you're back online" where local draft caching is implemented (primarily Resume Builder); read-only screens simply show a retry state on next interaction.

**Global rate-limiting on AI endpoints (TRD Section 9):** If a user hits a server-side AI rate limit, every AI-triggering button across the app shows the same message: "You've hit the AI usage limit for now. Try again in a few minutes." — never a generic 500 error for this specific case, since it's an expected/handled condition, not a bug.

---

# Explicit Build Exclusions (for agent clarity — do not implement)

1. LinkedIn Import Profile / Experience / Education / Skills / Certificates / Posts / Recommendations — no backend endpoint, no UI affordance, anywhere.
2. "Interview Prediction" as a modeled/predictive feature — do not build a scoring model or display a number framed as a prediction.
3. AI-generated resume metrics not traceable to user-supplied numbers — the AI service layer must reject/placeholder these, not just "try to avoid" them via prompting alone (TRD Section 11 recommends a validation pass; treat that as required, not optional).
4. "LinkedIn sync" as a listed/sellable Pro feature.
5. Fixed, non-varying company/role template substitution — Company-Specific and Role-Based variants must generate from the user's actual content, not swap a static paragraph per category.