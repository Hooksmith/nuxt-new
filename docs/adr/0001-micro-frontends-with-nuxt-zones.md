# ADR 0001 — Micro-frontends as Nuxt zones with a shared layer

- **Status:** Accepted
- **Date:** 2026-10-08

## Context

Several teams (accounts, lending, cards, …) need to ship banking features independently, with their own
release cadence and blast radius, while customers must experience a single, consistent portal. Each area
needs SSR for performance and accessibility.

Options considered:

1. **Monolith SPA/SSR app** — simplest, but every release ships everything and teams block each other.
2. **Runtime composition (Module Federation, iframes, Web Components)** — maximum independence, but adds
   runtime coupling, shared-dependency version negotiation, weaker SSR, and a larger attack surface.
3. **Path-based zones** (the Next.js multi-zones model) — each zone is a complete Nuxt app owning a URL
   prefix; a gateway routes by path; shared code is consumed at build time.

## Decision

Use **zones**. Each zone is a Nuxt app with its own `app.baseURL`, pipeline, image and Deployment. Shared
concerns (design system, auth guard, API client, security headers, Zod contracts) live in a **Nuxt layer**
(`layers/base`) that every zone `extends`.

- Navigation within a zone is client-side; across zones it's a full page load (`<ZoneLink>`).
- The gateway (Kubernetes `HTTPRoute`) routes `/loans/**` to the loans zone and everything else to the shell.
  Locally, the shell proxies `/loans` (Vite proxy in dev, Nitro middleware for production builds).
- Session, CSRF cookie and API live on the same origin, so zones share authentication with no token passing.

## Consequences

- ✅ Independent deploys and rollbacks per zone; failures are isolated to a URL prefix.
- ✅ Full SSR per zone, no runtime module loading, simple CSP.
- ✅ Consistent UX and security via the layer; contracts are type-checked end to end.
- ⚠️ Crossing zones costs a page load — zone boundaries should follow user journeys, not components.
- ⚠️ Changing the layer means rebuilding every zone. If it becomes a bottleneck, version the layer as a
  package (`@bank/base@x.y`) so zones can upgrade on their own schedule.
