## Description

<!-- What does this PR do, and why? Keep it focused. -->

## Related issues

<!-- e.g. Closes #123 -->

## Type of change

- [ ] ✨ Feature
- [ ] 🐛 Bug fix
- [ ] 📝 Docs
- [ ] ♻️ Refactor
- [ ] 🎨 Style / UI polish
- [ ] ⚡ Performance
- [ ] ✅ Test
- [ ] 🔧 Chore / CI

## PR title format

Titles should follow Conventional Commits:
`feat(scope): description` · `fix(scope): description` · `chore: ...` · `docs: ...`

> **Security**: If this PR relates to a security issue, see [SECURITY.md](../SECURITY.md) —
> do not discuss the details publicly in the PR until the fix is released.

## Checklist

- [ ] Branch is up to date with `main`
- [ ] `pnpm run lint` passes
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm test` passes
- [ ] New code has tests where practical
- [ ] Database changes are reflected in `db/schema.sql` and types regenerated (`pnpm db:gen-types`)
- [ ] No secrets, keys, or `.env` values committed
- [ ] UI changes verified at mobile and desktop widths

## Screenshots (if applicable)

<!-- Paste screenshots of UI changes here. -->
