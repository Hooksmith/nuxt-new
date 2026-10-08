## What & why

<!-- Link the ticket (e.g. BANK-123) and describe the change in one or two sentences. -->

## How to test

1.

## Checklist

- [ ] Branch is up to date with `main` and named `feat/…`, `fix/…` or `chore/…`
- [ ] Unit/component tests added or updated (`pnpm test`)
- [ ] E2E covers the user journey if it changed (`pnpm test:e2e`)
- [ ] Keyboard-only and screen reader checked; no new axe violations
- [ ] No secrets, PII or account numbers in logs, URLs or browser storage
- [ ] User input is validated with the shared Zod contract on **both** client and BFF
- [ ] No `v-html`; any new third-party origin is added to the CSP deliberately
- [ ] Screenshots attached for UI changes (light + dark)
