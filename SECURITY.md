# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| main    | ✅ Supported       |

Security fixes are applied to the `main` branch and released with the next
deployment. This is a continuously deployed application; there are no LTS
release lines.

## Reporting a Vulnerability

We take security seriously. **Please do not open a public issue** for
security vulnerabilities.

To report a vulnerability, contact the maintainers privately by opening a
[GitHub security advisory](https://github.com/Khushi-agarwal1401/AI-Resume-Builder-and-Analyzer/security/advisories/new).

Please include in your report:

- The affected component or endpoint
- A description of the vulnerability and its impact
- Steps to reproduce (or a proof-of-concept), if possible
- Any suggested remediation

### What to expect

- **Acknowledgment** — we will confirm receipt of your report within **48 hours**.
- **Assessment** — we will triage and assess severity within **5 business days**.
- **Fix & disclosure** — once a fix is ready, we will coordinate disclosure
  and credit you if you wish to be credited.

We ask that you give us a reasonable period to fix the issue before any
public disclosure.

## Security Scope

Areas of particular concern for this application:

- **Authentication & session handling** (NextAuth, OAuth flows)
- **Data ownership** — plain Postgres (no RLS): every query is scoped to the
  authenticated user id in application code
- **API routes** — input validation, rate limiting, and authorization
- **AI prompts** — anti-hallucination and injection guardrails
- **Environment variables & secrets** — must never be committed to the
  repository; production values live in the deployment environment
- **Payment flows** (Stripe) — webhook signature verification and
  subscription state consistency

## Environment Variables

All configuration is injected at runtime from the deployment environment.
`.env.example` documents the required variables. Never commit real values
to the repository — treat `.env*` files as untracked and local-only.

## Dependencies

Dependency updates are handled automatically via Dependabot. Security
advisories affecting production dependencies should be treated as high
priority.
