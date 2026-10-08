# Contributing

## Branching

Trunk-based development with short-lived branches:

- `main` is always releasable and auto-deploys to **staging**.
- Work on `feat/<ticket>-<slug>`, `fix/<ticket>-<slug>` or `chore/<slug>`, branched from `main`.
- Open a pull request early (draft is fine); keep it small enough to review in ~15 minutes.
- Rebase on `main` before merging; we **squash-merge** so `main` has one Conventional Commit per change.
- Releases are tags `vX.Y.Z` on `main`; tagging deploys to **production** after approval.
- Hotfixes: branch from the release tag, fix, tag `vX.Y.Z+1`, then merge back to `main`.

## Commits

[Conventional Commits](https://www.conventionalcommits.org), enforced by a `commit-msg` hook:

```
feat(loans): add debt-to-income check to the application wizard
fix(shell): keep transaction filters in the URL
```

Scopes: `shell`, `loans`, `base`, `bff`, `ci`, `k8s`, `deps`.

## Before you push

`lint-staged` runs ESLint and Prettier on staged files. CI also runs:

```bash
pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm build && pnpm test:e2e
```

## Code review checklist

Reviewers check (and authors self-review) against the PR template:

- **Correctness** — edge cases, loading/empty/error states, tests that would fail without the change.
- **Security** — input validated by the shared Zod contract on client _and_ BFF; no `v-html`; no secrets or
  PII in logs, URLs or browser storage; new third-party origins are added to the CSP deliberately.
- **Accessibility** — keyboard-only flow works; labels, focus order and announcements make sense; axe is clean.
- **Architecture** — server state in TanStack Query, client state in Pinia, shared code in `layers/base`;
  zones don't import from each other.
- **Performance** — no new large dependency without a reason; heavy UI is lazy-loaded.

## Where code goes

| You are adding…                                                      | Put it in                       |
| -------------------------------------------------------------------- | ------------------------------- |
| A reusable component, composable or store used by more than one zone | `layers/base/app/`              |
| A request/response shape or validation rule                          | `layers/base/shared/contracts/` |
| A feature page owned by one domain                                   | that zone's `app/pages/`        |
| A BFF endpoint                                                       | `apps/shell/server/api/`        |
