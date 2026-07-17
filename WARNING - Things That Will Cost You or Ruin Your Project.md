# WARNING — Things That Will Cost You or Ruin Your Project

Read this before writing a single line of code. Every item here is a real trap that has killed similar projects.

---

# PHASE 1 RISKS (MVP — Core Resume Builder)

## 1. Gemini API Free Tier Rate Limits Will Block You

| Limit | Value | What happens when you hit it |
|-------|-------|------------------------------|
| Requests per minute | 10 RPM | 429 errors — app feels broken |
| Requests per day | 1,500 RPD | App stops working entirely for rest of day |
| Context | 1M tokens | Fine for short text, but long resumes + JD will fail |

**When this will hit you:** ~25 users each making 5 AI calls (summary, bullet x3, grammar). That's it.

**What NOT to do:**
- Don't call AI on every keystroke (autosave + AI = 429 in minutes)
- Don't make one AI call per bullet point — batch them
- Don't assume limits reset instantly (they reset at midnight Pacific)

**What to do instead:**
- Queue AI requests, show "processing" states
- Cache AI results per user+section so repeat edits don't re-call
- Use Gemini 3.1 Flash-Lite (15 RPM) for simple tasks, save 3 Flash for complex ones

## 2. Supabase Free Project Will Pause and Kill Your Demo

Free project pauses after **7 days of inactivity**. When paused:
- Database takes 20-30 seconds to wake up
- Anyone visiting your app sees a loading spinner or error
- You lose investors, users, or评委 in those 30 seconds

**What NOT to do:**
- Don't treat Supabase Free as "production" — it's for development
- Don't share demo links without warning people about cold starts
- Don't assume "inactivity" = no users — Supabase defines it their way

**What to do instead:**
- Set a weekly cron (GitHub Actions, free) that hits your DB to keep it alive
- Or accept that Phase 1 is dev-only and plan to upgrade to $25/mo Pro before any real demo

## 3. AI Will Fabricate Metrics and Get You Sued

The PRD example says: `"Built API" → "Developed REST API serving 50K users"`

The AI **will invent** the "50K users" number. If a user submits that resume and gets caught:
- The user blames your app
- Resume fraud is legally serious
- You have no defense because your AI generated the lie

**What NOT to do:**
- Don't let AI add any number unless the user explicitly typed it
- Don't use prompts like "add impressive metrics" — they will hallucinate

**What to do instead:**
- Prompt: "Only use metrics the user has provided. Never invent numbers, percentages, or user counts."
- Add a disclaimer on every AI suggestion: "Review before using — verify all numbers"
- Log all AI inputs/outputs so you can prove what was generated

## 4. PDF Export Will Break Without Server-Side Fallback

Client-side PDF generation (`@react-pdf/renderer`, `jsPDF`) works... until it doesn't:
- Different browsers render differently
- Fonts won't match across OS
- ATS parsers will choke on your output

**What NOT to do:**
- Don't rely only on client-side generation for production
- Don't assume `window.print()` is acceptable

**What to do instead:**
- Client-side PDF is fine for Phase 1 MVP
- Plan Phase 2 to have a server-side fallback (BullMQ queue)
- Test export against actual ATS parsers (copy-paste into Word/Google Docs and check)

## 5. No Rate Limiting on AI Endpoints = Bankruptcy

One user can hammer your `/api/ai/enhance-bullet` endpoint 1000 times. With Gemini free tier that's fine (it'll 429). But if you move to paid tier or use a model with paid overage:

- Each call costs ~$0.001-0.01
- 10,000 calls = $10-100
- A single script kiddie can cost you hundreds overnight

**What NOT to do:**
- Don't expose AI endpoints without rate limiting
- Don't let unauthenticated users hit AI

**What to do instead:**
- Rate limit per user: 10 AI calls/minute, 100/day
- Rate limit per IP: 20 AI calls/minute
- Use Vercel's built-in rate limiting or a simple in-memory limiter

---

# PHASE 2 RISKS (ATS, JD Matching, Integrations)

## 6. ATS Score Is NOT Real — Misleading Users Will Destroy Trust

Real ATS systems (Workday, Taleo, Greenhouse, Lever) do NOT publish their scoring logic. Your "ATS Score" is a **heuristic approximation** at best.

**What NOT to do:**
- Don't call it "ATS Score" without qualification
- Don't claim it measures actual ATS compatibility
- Don't sell "ATS optimization" as a guaranteed pass

**What to do instead:**
- Label it everywhere as "Estimated ATS Compatibility" (PRD Section 5.10 flag)
- Add tooltip: "This is an estimate based on common ATS formats. Real ATS scores vary by employer."
- Never guarantee results

## 7. Job URL Scraping Will Get You Blocked or Sued

If you let users paste a job URL and your server fetches it:
- Many job boards (LinkedIn, Indeed, etc.) explicitly forbid scraping in their ToS
- You're now liable for ToS violations
- Some sites will block your server IP

**What NOT to do:**
- Don't scrape job boards that forbid it
- Don't store scraped content without permission

**What to do instead:**
- Only accept pasted text (user copies-pastes the JD manually)
- If you support URLs, use a server-side HTML-to-text extractor and cache results (don't re-fetch)
- Add a clear message: "Only paste JDs you have permission to use"

## 8. GitHub API Rate Limits Will Break for Power Users

Free tier: 5,000 requests/hour per authenticated user. Sounds fine until:
- User has 200+ repos (not uncommon for active devs)
- Each repo needs language, stars, forks, description
- That's 200+ API calls per sync
- Refetching on every dashboard load = rate limit hit in 1-2 refreshes

**What NOT to do:**
- Don't fetch GitHub data on every page load
- Don't sync all repos every time (paginated 100 per page = multiple calls)

**What to do instead:**
- Cache GitHub data in your DB, only refresh when user explicitly clicks "Sync"
- Store repo data with timestamps, refresh max once per hour
- Show user their rate limit status

## 9. Company-Specific Resumes Will Look Formulaic and Cringe

Hiring managers see AI-generated templates every day. If your "Startup Resume" just swaps in keywords like "ownership" and "fast growth," it's obvious and hurts the candidate.

**What NOT to do:**
- Don't use fixed keyword substitution per company type
- Don't claim "AI-tailored" if it's just a find-and-replace

**What to do instead:**
- Vary phrasing meaningfully per user's actual experience
- Add a human review step: "AI suggested these changes — edit before saving"
- Keep the user in control, not fully automated

---

# PHASE 3 RISKS (Subscriptions, Admin, Mobile)

## 10. Selling "LinkedIn Sync" as a Paid Feature = Refund Requests + Bad Reviews

LinkedIn shut down profile data access to third parties in **2015**. There is no public API for importing experience, education, skills, certificates, posts, or recommendations.

**What NOT to do:**
- Don't list "LinkedIn Sync" or "LinkedIn Import" as a Pro feature
- Don't charge users for something you cannot deliver
- Don't try to scrape LinkedIn — they will sue (they already sued hiQ Labs and won)

**What to do instead:**
- LinkedIn OAuth can only return name, email, and profile photo
- Everything else must be **manual entry** by the user
- If you want deep LinkedIn access, you need a **LinkedIn Talent Solutions Partnership** — a formal business agreement, not an engineering task
- Until that partnership exists, remove LinkedIn import from your roadmap entirely

## 11. Interview Prediction Is Impossible Without Data — Don't Fake It

"Interview Prediction" requires a trained model on real interview-outcome data. You don't have this data. You won't have it for years.

**What NOT to do:**
- Don't ship an "Interview Prediction" feature that's just a random number or heuristic
- Don't claim your app can predict interview chances — users will test it and see it's fake
- Bad reviews will destroy your app's rating overnight

**What to do instead:**
- Remove "Interview Prediction" from the roadmap entirely
- Instead show historical data: "Users with ATS scores above X% reported Y% interview rate" (self-reported only)
- Be honest: "We cannot predict interview outcomes"

## 12. Subscriptions Without Real Value = Churn Death

Free plan: 1 resume, basic ATS. Pro plan: unlimited, GitHub sync, ATS optimization, company-specific resume.

Pro is only valuable if:
- Users actually want multiple resumes (many only need 1)
- ATS optimization actually helps (see risk #6)
- Company-specific resumes are more than template swaps (see risk #9)

**What NOT to do:**
- Don't launch paid plans until you've validated users will pay
- Don't make the free plan so limited that users can't evaluate the product
- Don't expect conversion from free users who haven't experienced value

**What to do instead:**
- Start free-only. Collect feedback for 2-4 weeks after MVP
- Only add payment when users are asking "how do I pay for more?"
- If you must launch paid, offer a 30-day free Pro trial so users see value first

## 13. GDPR / Data Privacy — Resume Data Contains PII

Every resume has: name, email, phone, work history, education. This is Personally Identifiable Information (PII).

**What NOT to do:**
- Don't store data without a privacy policy
- Don't log full resume content in plaintext
- Don't expose user data to other users (even admin panel must be careful)
- Don't ignore data deletion requests

**What to do instead:**
- Write a privacy policy before launch
- Allow users to export and delete all their data
- Encrypt resume data at rest and in transit
- Never log AI prompts containing PII
- Supabase Free does NOT have daily backups — warn users

## 14. Admin Panel Without Proper Auth = Data Breach

Admin panel controls: user management, resume analytics, template management, AI prompt management.

**What NOT to do:**
- Don't rely on frontend-only role checks
- Don't make the admin panel discoverable at a predictable URL without auth
- Don't give admin access through regular user auth flow

**What to do instead:**
- Verify admin role server-side on EVERY request
- Use a separate admin login or require 2FA
- Rate-limit admin login attempts
- Keep admin panel behind a separate route with middleware

---

# CROSS-PHASE RISKS (Will Ruin You at Any Stage)

## 15. You Cannot Build 22 Modules With 3 People in 3 Weeks

The PRD lists 22 modules. The team plan says 3 phases. That's ambitious for 3 generalist engineers.

**What NOT to do:**
- Don't try to build everything at once — you'll finish nothing
- Don't split work by frontend/backend — creates handoff overhead
- Don't let perfect be the enemy of shipped

**What to do instead:**
- Phase 1 is the only thing that matters. Ship it before touching Phase 2
- Each person owns features end-to-end (UI + API + DB) — no handoffs
- If you must cut something, cut Phase 3 first (Job Tracker, Analytics, Admin don't block resume creation)

## 16. Supabase 500MB Database Will Fill Up

500MB sounds like a lot until you store:
- User profiles + auth data
- Multiple resumes per user (each with education, experience, projects, skills sections)
- AI prompt logs (for debugging)
- Job tracker entries

**What NOT to do:**
- Don't store full AI request/response for every call in the DB (this alone will kill your storage)
- Don't keep deleted resumes in the DB
- Don't store large files in the DB (use Supabase Storage for PDFs)

**What to do instead:**
- Only log AI calls for debugging — auto-delete logs older than 7 days
- Soft-delete resumes but physically purge after 30 days
- Store exported PDFs in Supabase Storage (1GB free), not in the database

## 17. Vercel Serverless Function Timeouts (10s limit)

Vercel Hobby plan has a **10-second** serverless function timeout. If your AI call to Gemini + response parsing takes more than 10 seconds, the function fails.

**What NOT to do:**
- Don't make synchronous AI calls for long tasks from API routes
- Don't assume all AI calls complete in under 10s

**What to do instead:**
- Keep AI prompts short and specific (not "rewrite my entire resume")
- For long tasks, use a background job approach or return immediately and poll
- OR use Edge Functions (faster, but limited Node.js APIs)

## 18. No Backup Strategy = Data Loss

Supabase Free has no automatic daily backups. If your DB corrupts or you accidentally delete production data, it's gone forever.

**What NOT to do:**
- Don't assume Supabase backs up free projects (they don't)
- Don't run destructive migrations without a manual dump first

**What to do instead:**
- Run `pg_dump` weekly via GitHub Actions (free cron) to export to a private GitHub repo or S3
- Before any DB migration, manually export via Supabase dashboard
- Keep a local copy of your schema + seed data

---

# QUICK REFERENCE: Money vs. Risk

| What | Cost | Risk Level | Notes |
|------|------|------------|-------|
| Gemini API Free Tier | $0 | MEDIUM | 1,500 req/day limit will hit you at ~25 active users |
| Supabase Free Tier | $0 | HIGH | 7-day pause can kill demos; 500MB fills up |
| Vercel Hobby | $0 | LOW | 10s function timeout is main constraint |
| GitHub OAuth | $0 | LOW | 5,000 req/hr — cache wisely |
| Client-side PDF | $0 | LOW | Works for MVP, plan server-side later |
| **Supabase Pro** | **$25/mo** | **REQUIRED BEFORE LAUNCH** | Stop pausing, get backups, more storage |
| **Gemini Paid Tier** | **Pay as you go** | **REQUIRED FOR SCALE** | Remove rate limit anxiety |
| **Vercel Pro** | **$20/mo** | **NEEDED FOR >10s functions** | Longer timeouts, faster deploys |

**Bottom line:**
- Phase 1 can run on $0/mo — but expect friction
- Before any real demo or user testing: upgrade Supabase to Pro ($25/mo)
- Before launch: have a plan for each risk above
- Never ship a feature that makes claims you can't back up (ATS Score, Interview Prediction, LinkedIn Import)
